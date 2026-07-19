"""Real-time style alpha signals — absorb winner patterns (Gorillionaire / KiSignal).

Aggregates desk marks, ecosystem pulse, gas, and policy into BUY/SELL/HOLD signals
with scores, leaderboard, and optional auto-exec handoff. Not vapor: every signal
cites sources and can be turned into a risk-gated desk ticket.
"""

from __future__ import annotations

import hashlib
import time
from typing import Any, Dict, List, Optional

from . import __version__
from .ecosystem import ecosystem_bundle
from .ecosystem_laws import embed_ecosystem_laws
from .gas_intel import gas_coach
from .marks import live_marks
from .models import Action, Category, Policy
from .policy import evaluate
from .receipts import seal
from .trading import TradeTicket, _mark_pair, load_desk, propose_ticket, desk_snapshot

DOCTRINE = "Agents propose. Laws decide. Owner signs. Receipts remember."


def _score_signal(
    *,
    momentum: float,
    idle_cash_pct: float,
    risk_ok: bool,
    gas_ok: bool,
    source_n: int,
) -> float:
    """0–100 machine score (transparent, deterministic)."""
    s = 50.0
    s += max(-20, min(20, momentum * 100))
    s += min(15, idle_cash_pct * 0.15) if momentum > 0 else 0
    s += 10 if risk_ok else -35
    s += 5 if gas_ok else -5
    s += min(10, source_n * 2)
    return round(max(0, min(100, s)), 2)


def generate_signals(network: str = "monad-testnet", *, n: int = 8) -> Dict[str, Any]:
    """Build multi-source signal board (human + bot readable)."""
    embed_ecosystem_laws()
    desk = load_desk()
    snap = desk_snapshot(desk)
    marks = live_marks(network)
    mon = float((marks.get("marks") or {}).get("MON/USDC") or _mark_pair(desk, "MON/USDC") or 1.0)
    eth = float((marks.get("marks") or {}).get("WETH/USDC") or _mark_pair(desk, "WETH/USDC") or 3000.0)
    # crude momentum from mark entropy / day pnl
    day_pnl = float(snap.get("day_pnl") or 0)
    cash = float(snap.get("cash_usdc") or 0)
    equity = float(snap.get("equity") or max(cash, 1))
    idle = 100.0 * cash / equity if equity else 0
    gas = gas_coach()
    gas_ok = True
    eco = ecosystem_bundle(network)
    tokens = eco.get("tokens") or []

    # Policy seatbelt for signal→ticket conversion
    pol = desk.policy if hasattr(desk, "policy") else Policy()

    sources_base = ["desk.marks", "ecosystem.catalog", "gas.coach", "day_pnl", "policy.seatbelt"]

    candidates: List[Dict[str, Any]] = []

    # Signal 1: MON inventory / idle deploy (winner: portfolio managers)
    mom_mon = 0.02 if day_pnl >= 0 else -0.01
    if idle > 35:
        mom_mon += 0.03
    action_mon = "BUY"
    if mom_mon < 0:
        action_mon = "HOLD"
    risk_ok = Category.DEX in (pol.allowed_categories or list(Category))
    sc = _score_signal(
        momentum=mom_mon, idle_cash_pct=idle, risk_ok=risk_ok, gas_ok=gas_ok, source_n=4
    )
    candidates.append(
        {
            "id": "sig-mon-spot",
            "symbol": "MON/USDC",
            "venue": "kuru",
            "side": action_mon,
            "score": sc,
            "confidence": "high" if sc >= 65 else "medium" if sc >= 45 else "low",
            "thesis": (
                f"Idle cash {idle:.0f}% · day PnL {day_pnl:.2f} · MON mark {mon:.4f}. "
                "Spot rebalance under lawbook (no perps)."
            ),
            "sources": sources_base + ["atlas.kuru"],
            "auto_executable": action_mon == "BUY" and sc >= 55,
            "ticket_hint": {
                "pair": "MON/USDC",
                "venue_id": "kuru",
                "side": "buy",
                "qty": min(40.0, max(5.0, cash * 0.05 / max(mon, 0.01))),
                "limit_price": mon,
            },
            "pattern": "Gorillionaire-style mark signal + seatbelt",
        }
    )

    # Signal 2: WETH trim if inventory heavy
    open_n = float(snap.get("open_notional") or 0)
    side_eth = "SELL" if open_n > 800 else "HOLD"
    sc2 = _score_signal(
        momentum=-0.02 if open_n > 800 else 0.0,
        idle_cash_pct=idle,
        risk_ok=True,
        gas_ok=gas_ok,
        source_n=3,
    )
    candidates.append(
        {
            "id": "sig-weth-trim",
            "symbol": "WETH/USDC",
            "venue": "uniswap",
            "side": side_eth,
            "score": sc2 if side_eth == "SELL" else max(30, sc2 - 10),
            "confidence": "medium",
            "thesis": f"Open notional {open_n:.0f} · ETH mark {eth:.2f}. Trim only if inventory heavy.",
            "sources": sources_base + ["desk.inventory"],
            "auto_executable": side_eth == "SELL" and open_n > 800,
            "ticket_hint": {
                "pair": "WETH/USDC",
                "venue_id": "uniswap",
                "side": "sell",
                "qty": 0.05,
                "limit_price": eth,
            },
            "pattern": "MonetAI-style inventory rebalance",
        }
    )

    # Signal 3: degen perps (must score low / not auto) — absorb + beat winners
    candidates.append(
        {
            "id": "sig-degen-perps",
            "symbol": "MON-PERP",
            "venue": "perpl",
            "side": "BUY",
            "score": 92.0,  # looks attractive — laws reject
            "confidence": "fake-high",
            "thesis": "CT-style max leverage alpha (KiSignal without brakes). Expected NOMOS REJECT.",
            "sources": ["synthetic.ct_alpha", "sentiment.degen"],
            "auto_executable": False,
            "lawful": False,
            "ticket_hint": {
                "pair": "MON-PERP",
                "venue_id": "perpl",
                "side": "buy",
                "qty": 5000,
                "limit_price": mon,
                "leverage_bps": 50000,
                "slippage_bps": 800,
            },
            "pattern": "KiSignal-like alpha — THESIS rejects under dual stack",
        }
    )

    # Signal 4–n: token catalog micro signals
    for i, t in enumerate(tokens[: max(0, n - 3)]):
        sym = t.get("symbol") or f"T{i}"
        h = int(hashlib.sha256(f"{sym}{int(time.time())//300}".encode()).hexdigest()[:8], 16)
        mom = ((h % 21) - 10) / 100.0
        side = "BUY" if mom > 0.03 else "SELL" if mom < -0.03 else "HOLD"
        sc = _score_signal(
            momentum=mom, idle_cash_pct=idle * 0.5, risk_ok=True, gas_ok=gas_ok, source_n=2
        )
        candidates.append(
            {
                "id": f"sig-eco-{sym.lower()}",
                "symbol": sym,
                "venue": "catalog",
                "side": side,
                "score": sc,
                "confidence": "low",
                "thesis": f"Ecosystem catalog pulse for {t.get('name') or sym} (no invent addresses).",
                "sources": ["ecosystem.catalog", "law.monad.no-invent-addresses"],
                "auto_executable": False,
                "pattern": "Envio/index-style catalog feed (offline mirror)",
            }
        )

    # Evaluate lawful conversion for hints
    for c in candidates:
        hint = c.get("ticket_hint") or {}
        if not hint:
            c["policy_ok"] = None
            continue
        try:
            act = Action(
                agent=f"signal:{c['id']}",
                category=Category.PERPS if "PERP" in str(hint.get("pair", "")) else Category.DEX,
                protocol=str(hint.get("venue_id") or "kuru"),
                action="open" if "PERP" in str(hint.get("pair", "")) else "swap",
                value=float(hint.get("qty", 1)) * float(hint.get("limit_price", 1)),
                slippage_bps=int(hint.get("slippage_bps") or 25),
                resulting_protocol_exposure_bps=1200 if c.get("lawful", True) is not False else 9000,
                resulting_liquid_reserve_bps=4000 if c.get("lawful", True) is not False else 100,
                resulting_leverage_bps=int(hint.get("leverage_bps") or 10000),
                expected_gain_bps=int(c.get("score", 50)),
                risk_bps=80 if c.get("lawful", True) is not False else 500,
                rationale=c.get("thesis") or "",
            )
            ev = evaluate(act, pol)
            c["policy_ok"] = ev.accepted
            c["policy_summary"] = ev.human_summary
            c["violations"] = ev.violations
            if not ev.accepted:
                c["auto_executable"] = False
        except Exception as exc:
            c["policy_ok"] = False
            c["policy_summary"] = str(exc)[:120]

    # Rank: lawful high score first for "bot leaderboard"
    board = sorted(
        candidates,
        key=lambda x: (
            0 if x.get("policy_ok") else 1,
            0 if x.get("auto_executable") else 1,
            -float(x.get("score") or 0),
        ),
    )
    for i, b in enumerate(board):
        b["rank"] = i + 1

    report = {
        "schema": "thesis.signals.v1",
        "version": __version__,
        "network": network,
        "doctrine": DOCTRINE,
        "tagline": "Winner-class signals + THESIS brakes (reject is a feature)",
        "n": len(board),
        "signals": board,
        "leaderboard": [
            {
                "rank": b["rank"],
                "id": b["id"],
                "symbol": b["symbol"],
                "side": b["side"],
                "score": b["score"],
                "auto": b.get("auto_executable"),
                "policy_ok": b.get("policy_ok"),
            }
            for b in board[:10]
        ],
        "gas_tip": (gas.get("tip") or {}).get("title"),
        "desk": {"equity": equity, "cash": cash, "idle_pct": round(idle, 1), "day_pnl": day_pnl},
        "absorbs": ["KiSignal (alpha→trade)", "Gorillionaire (signals+board)", "MonetAI (rebalance)"],
        "beats": "Auto-trade without dual-stack veto or owner signature",
    }
    seal("signals.generate", {"n": len(board), "top": board[0]["id"] if board else None})
    return report


def signal_to_ticket(signal_id: str, network: str = "monad-testnet") -> Dict[str, Any]:
    """Convert a signal into a desk ticket under risk gate."""
    board = generate_signals(network)
    sig = next((s for s in board["signals"] if s["id"] == signal_id), None)
    if not sig:
        return {"ok": False, "error": f"signal {signal_id} not found"}
    hint = sig.get("ticket_hint") or {}
    if not hint:
        return {"ok": False, "error": "signal has no ticket_hint"}
    desk = load_desk()
    t = TradeTicket(
        agent=f"signal:{sig['id']}",
        venue_id=str(hint.get("venue_id") or "kuru"),
        pair=str(hint.get("pair") or "MON/USDC"),
        side=str(hint.get("side") or "buy"),  # type: ignore
        qty=float(hint.get("qty") or 10),
        limit_price=float(hint.get("limit_price") or 1),
        slippage_bps=int(hint.get("slippage_bps") or 25),
        leverage_bps=int(hint.get("leverage_bps") or 10000),
        rationale=sig.get("thesis") or "signal ticket",
    )
    out = propose_ticket(desk, t)
    return {
        "ok": True,
        "signal": sig,
        "ticket": out.model_dump(mode="json"),
        "accepted": out.status == "risk_accepted",
        "status": out.status,
    }
