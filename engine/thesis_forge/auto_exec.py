"""Auto-execution intelligence — paper loops under laws (winner utility + THESIS brakes).

Pipeline:
  signals → policy gate → paper fill (auto)
  optional: strategy batch auto-fill
  optional: company staff + mission awaiting owner (never silent chain broadcast)

Chain txs still require owner signature (promote). Paper = full auto for demo.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from . import __version__
from .receipts import seal
from .signals import generate_signals, signal_to_ticket
from .strategies import list_strategies, run_strategy
from .trading import load_desk, paper_fill, desk_snapshot, run_desk_arena

DOCTRINE = "Agents propose. Laws decide. Owner signs. Receipts remember."


def auto_paper_from_signals(
    network: str = "monad-testnet",
    *,
    max_fills: int = 3,
    min_score: float = 55.0,
) -> Dict[str, Any]:
    """Generate signals, propose tickets for auto_executable ones, paper-fill accepts."""
    t0 = time.time()
    board = generate_signals(network)
    filled: List[Dict[str, Any]] = []
    rejected: List[Dict[str, Any]] = []
    proposed: List[Dict[str, Any]] = []

    for sig in board.get("signals") or []:
        if len(filled) >= max_fills:
            break
        if not sig.get("auto_executable"):
            continue
        if float(sig.get("score") or 0) < min_score:
            continue
        if sig.get("policy_ok") is False:
            rejected.append({"signal": sig["id"], "reason": "policy_ok=false", "summary": sig.get("policy_summary")})
            continue
        st = signal_to_ticket(sig["id"], network)
        proposed.append(st)
        if not st.get("accepted"):
            rejected.append(
                {
                    "signal": sig["id"],
                    "reason": "desk_risk_rejected",
                    "ticket": (st.get("ticket") or {}).get("status"),
                }
            )
            continue
        tid = (st.get("ticket") or {}).get("ticket_id")
        if not tid:
            continue
        try:
            desk = load_desk()
            ticket = paper_fill(desk, tid)
            filled.append(
                {
                    "signal": sig["id"],
                    "ticket_id": tid,
                    "fill_price": ticket.fill_price,
                    "pnl_delta": ticket.pnl_delta,
                    "status": ticket.status,
                }
            )
        except Exception as exc:
            rejected.append({"signal": sig["id"], "reason": str(exc)[:160]})

    desk = desk_snapshot()
    out = {
        "schema": "thesis.auto_exec.signals.v1",
        "ok": True,
        "mode": "paper",
        "chain_broadcast": False,
        "doctrine": DOCTRINE,
        "elapsed_ms": (time.time() - t0) * 1000,
        "signals_seen": board.get("n"),
        "n_proposed": len(proposed),
        "n_filled": len(filled),
        "n_rejected": len(rejected),
        "filled": filled,
        "rejected": rejected,
        "desk": {"equity": desk.get("equity"), "cash_usdc": desk.get("cash_usdc"), "day_pnl": desk.get("day_pnl")},
        "leaderboard_top": (board.get("leaderboard") or [])[:5],
        "note": "Paper auto-exec complete. Mainnet still needs owner signature (promote).",
    }
    seal("auto_exec.signals", {"filled": len(filled), "rejected": len(rejected)})
    return out


def auto_strategy_run(
    strategy_id: str = "market-make",
    *,
    auto_fill: bool = True,
) -> Dict[str, Any]:
    """Run a desk strategy and optionally paper-fill all risk_accepted tickets."""
    t0 = time.time()
    result = run_strategy(strategy_id)
    fills = []
    if auto_fill and result.get("ok"):
        for ticket in result.get("tickets") or []:
            if not isinstance(ticket, dict):
                continue
            status = ticket.get("status")
            tid = ticket.get("ticket_id")
            if status == "risk_accepted" and tid:
                try:
                    desk = load_desk()
                    ft = paper_fill(desk, tid)
                    fills.append({"ticket_id": tid, "status": ft.status, "fill_price": ft.fill_price})
                except Exception as exc:
                    fills.append({"ticket_id": tid, "error": str(exc)[:120]})
    return {
        "schema": "thesis.auto_exec.strategy.v1",
        "ok": bool(result.get("ok", True)),
        "strategy": strategy_id,
        "auto_fill": auto_fill,
        "strategy_result": {
            "n_accepted": result.get("n_accepted"),
            "n_rejected": result.get("n_rejected"),
            "ok": result.get("ok"),
        },
        "fills": fills,
        "n_filled": sum(1 for f in fills if f.get("status") == "paper_filled"),
        "elapsed_ms": (time.time() - t0) * 1000,
        "chain_broadcast": False,
        "doctrine": DOCTRINE,
    }


def auto_loop(
    network: str = "monad-testnet",
    *,
    include_arena: bool = True,
    include_signals: bool = True,
    include_strategy: bool = True,
    strategy_id: str = "market-make",
) -> Dict[str, Any]:
    """One-shot intelligence + auto paper execution (judge demo in ~seconds)."""
    t0 = time.time()
    steps: List[Dict[str, Any]] = []

    arena = None
    if include_arena:
        arena = run_desk_arena(load_desk())
        steps.append(
            {
                "step": "desk_arena",
                "ok": int(arena.get("n_rejected") or 0) >= 1,
                "detail": f"accept {arena.get('n_accepted')} reject {arena.get('n_rejected')}",
            }
        )

    sig_exec = None
    if include_signals:
        sig_exec = auto_paper_from_signals(network, max_fills=2)
        steps.append(
            {
                "step": "signals_auto_paper",
                "ok": True,
                "detail": f"filled {sig_exec.get('n_filled')} rejected {sig_exec.get('n_rejected')}",
            }
        )

    strat = None
    if include_strategy:
        try:
            strat = auto_strategy_run(strategy_id, auto_fill=True)
            steps.append(
                {
                    "step": f"strategy:{strategy_id}",
                    "ok": strat.get("ok"),
                    "detail": f"fills {strat.get('n_filled')}",
                }
            )
        except Exception as exc:
            steps.append({"step": f"strategy:{strategy_id}", "ok": False, "detail": str(exc)[:120]})

    # Intelligence synthesis
    from .intelligence import coach
    from .company.os import morning_brief

    c = coach(network)
    brief = morning_brief()
    desk = desk_snapshot()

    out = {
        "schema": "thesis.auto_exec.loop.v1",
        "version": __version__,
        "ok": all(s.get("ok") for s in steps) if steps else True,
        "mode": "paper_auto + owner-gated chain",
        "doctrine": DOCTRINE,
        "elapsed_ms": (time.time() - t0) * 1000,
        "headline": (
            f"AUTO LOOP · arena reject {(arena or {}).get('n_rejected', 0)} · "
            f"signal fills {(sig_exec or {}).get('n_filled', 0)} · "
            f"strategy fills {(strat or {}).get('n_filled', 0)}"
        ),
        "steps": steps,
        "arena": {
            "n_accepted": (arena or {}).get("n_accepted"),
            "n_rejected": (arena or {}).get("n_rejected"),
        }
        if arena
        else None,
        "signals": {
            "n_filled": (sig_exec or {}).get("n_filled"),
            "n_rejected": (sig_exec or {}).get("n_rejected"),
            "top": (sig_exec or {}).get("leaderboard_top"),
        }
        if sig_exec
        else None,
        "strategy": {
            "id": strategy_id,
            "n_filled": (strat or {}).get("n_filled"),
        }
        if strat
        else None,
        "intelligence": {
            "coach_headline": c.get("headline"),
            "tips": (c.get("tips") or [])[:3],
            "brief": (brief.get("narrative") or brief.get("headline") or "")[:240],
        },
        "desk": {
            "equity": desk.get("equity"),
            "day_pnl": desk.get("day_pnl"),
            "cash_usdc": desk.get("cash_usdc"),
        },
        "absorbs_winners": {
            "KiSignal": "alpha → gated ticket → paper exec",
            "Gorillionaire": "signal board + scores + leaderboard",
            "MonetAI": "strategy rebalance auto-fill",
            "THESIS_edge": "dual stack REJECT + no silent chain broadcast",
        },
        "owner_next": "Review filled paper book · promote vault route only if you sign",
    }
    seal(
        "auto_exec.loop",
        {
            "ok": out["ok"],
            "filled": (sig_exec or {}).get("n_filled", 0) + (strat or {}).get("n_filled", 0),
            "rejects": (arena or {}).get("n_rejected"),
        },
    )
    return out


def intelligence_pulse(network: str = "monad-testnet") -> Dict[str, Any]:
    """Richer intelligence: coach + signals top + auto recommendation."""
    from .intelligence import coach, quick_reject_demo
    from .company.os import morning_brief
    from .lawbook import lawbook_payload

    c = coach(network)
    b = morning_brief()
    sig = generate_signals(network, n=6)
    rej = quick_reject_demo()
    lb = lawbook_payload(network)
    top = (sig.get("signals") or [None])[0]
    rec = "hold"
    if top and top.get("auto_executable") and top.get("policy_ok"):
        rec = f"auto_paper:{top['id']}"
    elif int(rej.get("n_rejected") or 0) >= 1:
        rec = "celebrate_reject_then_lawful_signal"

    return {
        "schema": "thesis.intelligence.pulse.v1",
        "version": __version__,
        "headline": c.get("headline") or b.get("narrative"),
        "recommendation": rec,
        "brief": b.get("narrative") or b.get("headline"),
        "tips": c.get("tips") or [],
        "signals_top": (sig.get("leaderboard") or [])[:5],
        "reject_demo": {"n_rejected": rej.get("n_rejected"), "lesson": rej.get("lesson")},
        "lawbook_aligned": (lb.get("alignment") or {}).get("ok"),
        "auto_exec_hint": "POST /auto/loop or terminal: auto",
        "doctrine": DOCTRINE,
    }
