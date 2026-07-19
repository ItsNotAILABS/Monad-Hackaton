"""Trading strategy presets for the desk — produce risk-gated ticket batches."""

from __future__ import annotations

from typing import Any, Dict, List

from .trading import TradeTicket, _mark_pair, load_desk, propose_ticket

STRATEGIES: List[Dict[str, Any]] = [
    {
        "id": "market-make",
        "name": "Market make (two-sided)",
        "tagline": "Post bid + ask around mid on Kuru",
        "blurb": "Small size, tight slip. Builds inventory habit without perps.",
        "risk": "low",
    },
    {
        "id": "inventory",
        "name": "Inventory rebalance",
        "tagline": "Buy underweight MON / sell overweight WETH",
        "blurb": "Pulls book toward a neutral cash/spot mix using spot venues only.",
        "risk": "medium",
    },
    {
        "id": "take-profit",
        "name": "Take profit",
        "tagline": "Trim winners when uPnL is green",
        "blurb": "Sells a slice of longs with positive unrealized PnL; no-op if flat/red.",
        "risk": "low",
    },
]


def list_strategies() -> List[Dict[str, Any]]:
    return list(STRATEGIES)


def _tickets_market_make(desk) -> List[TradeTicket]:
    mid = _mark_pair(desk, "MON/USDC")
    spread = mid * 0.002  # 20 bps half-spread
    qty = 20.0
    return [
        TradeTicket(
            agent="strategy:market-make",
            venue_id="kuru",
            pair="MON/USDC",
            side="buy",
            qty=qty,
            limit_price=round(mid - spread, 6),
            slippage_bps=15,
            leverage_bps=10000,
            rationale=f"MM bid MON @ {mid - spread:.6f} (mid {mid:.6f})",
        ),
        TradeTicket(
            agent="strategy:market-make",
            venue_id="kuru",
            pair="MON/USDC",
            side="sell",
            qty=qty,
            limit_price=round(mid + spread, 6),
            slippage_bps=15,
            leverage_bps=10000,
            rationale=f"MM ask MON @ {mid + spread:.6f} (mid {mid:.6f})",
        ),
    ]


def _tickets_inventory(desk) -> List[TradeTicket]:
    mon = _mark_pair(desk, "MON/USDC")
    eth = _mark_pair(desk, "WETH/USDC")
    tickets = [
        TradeTicket(
            agent="strategy:inventory",
            venue_id="kuru",
            pair="MON/USDC",
            side="buy",
            qty=40,
            limit_price=mon,
            slippage_bps=20,
            leverage_bps=10000,
            rationale="Inventory: add MON exposure on primary spot venue",
        )
    ]
    # If we hold WETH long, trim; else skip sell-to-open if shorts disabled will reject
    weth_key = "uniswap:WETH/USDC"
    pos = desk.positions.get(weth_key) or desk.positions.get("kuru:WETH/USDC")
    if pos and pos.qty > 0.01:
        tickets.append(
            TradeTicket(
                agent="strategy:inventory",
                venue_id="uniswap",
                pair="WETH/USDC",
                side="sell",
                qty=min(0.05, pos.qty),
                limit_price=eth,
                slippage_bps=25,
                leverage_bps=10000,
                rationale="Inventory: trim WETH toward cash",
            )
        )
    else:
        tickets.append(
            TradeTicket(
                agent="strategy:inventory",
                venue_id="uniswap",
                pair="WETH/USDC",
                side="buy",
                qty=0.02,
                limit_price=eth,
                slippage_bps=25,
                leverage_bps=10000,
                rationale="Inventory: seed small WETH sleeve for diversification",
            )
        )
    return tickets


def _tickets_take_profit(desk) -> List[TradeTicket]:
    out: List[TradeTicket] = []
    for pos in desk.positions.values():
        if pos.qty <= 0:
            continue
        if pos.unrealized_pnl <= 0:
            continue
        # sell 25% of winning long
        qty = max(pos.qty * 0.25, 1e-6)
        # prefer venue that holds the position
        venue = pos.venue_id if pos.venue_id in ("kuru", "uniswap") else "kuru"
        pair = pos.pair
        if pair.endswith("-PERP"):
            continue  # spot TP strategy
        mark = pos.mark_price or _mark_pair(desk, pair)
        out.append(
            TradeTicket(
                agent="strategy:take-profit",
                venue_id=venue,
                pair=pair,
                side="sell",
                qty=round(qty, 6),
                limit_price=mark,
                slippage_bps=20,
                leverage_bps=10000,
                rationale=f"Take profit: uPnL {pos.unrealized_pnl:.2f} on {pair} — sell 25%",
            )
        )
    if not out:
        # explicit no-op ticket that will be documented
        mid = _mark_pair(desk, "MON/USDC")
        out.append(
            TradeTicket(
                agent="strategy:take-profit",
                venue_id="kuru",
                pair="MON/USDC",
                side="sell",
                qty=0.001,
                limit_price=mid,
                slippage_bps=20,
                leverage_bps=10000,
                rationale="Take profit: no winning longs — placeholder tiny sell (may reject if no inventory)",
            )
        )
    return out


_BUILDERS = {
    "market-make": _tickets_market_make,
    "inventory": _tickets_inventory,
    "take-profit": _tickets_take_profit,
}


def run_strategy(strategy_id: str, *, submit: bool = True) -> Dict[str, Any]:
    """Build tickets for a strategy; optionally submit through desk risk gate."""
    if strategy_id not in _BUILDERS:
        return {"ok": False, "error": f"unknown strategy {strategy_id}", "strategies": list_strategies()}
    desk = load_desk()
    raw_tickets = _BUILDERS[strategy_id](desk)
    results = []
    for t in raw_tickets:
        if submit:
            out = propose_ticket(desk, t)
            results.append(out.model_dump(mode="json"))
            desk = load_desk()
        else:
            t.notional = t.qty * t.limit_price
            results.append(t.model_dump(mode="json"))
    meta = next(s for s in STRATEGIES if s["id"] == strategy_id)
    accepted = sum(1 for r in results if r.get("status") == "risk_accepted")
    rejected = sum(1 for r in results if r.get("status") == "risk_rejected")
    return {
        "ok": True,
        "schema": "thesis.strategy.run.v1",
        "strategy": meta,
        "submitted": submit,
        "n": len(results),
        "n_accepted": accepted,
        "n_rejected": rejected,
        "tickets": results,
        "doctrine": "Strategies propose tickets. Desk limits + NOMOS decide.",
    }
