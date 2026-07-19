"""Lightweight coach intelligence for HOME / DESK."""

from __future__ import annotations

from typing import Any, Dict, List

from .daily import home as daily_home
from .gas_intel import apply_gas_limit_margin, gas_coach
from .trading import desk_snapshot, run_desk_arena, load_desk


def coach(network: str = "monad-testnet") -> Dict[str, Any]:
    """Single endpoint for 'what should I do now' intelligence."""
    h = daily_home(network)
    desk = desk_snapshot()
    tips: List[Dict[str, str]] = []

    nba = h.get("next_best_action") or {}
    tips.append(
        {
            "priority": "1",
            "kind": "habit",
            "title": nba.get("title") or "Daily mission",
            "body": f"Next: {nba.get('cta')}. Practical > fancy.",
            "href": "home",
        }
    )

    gas = h.get("gas_coach") or gas_coach()
    tips.append(
        {
            "priority": "2",
            "kind": "gas",
            "title": gas["tip"]["title"],
            "body": gas["tip"]["roommate"],
            "href": "home",
        }
    )

    day_pnl = float(desk.get("day_pnl") or 0)
    if day_pnl < 0:
        tips.append(
            {
                "priority": "0",
                "kind": "risk",
                "title": "Red day — shrink size",
                "body": "Desk day PnL is negative. Run rejects only; skip whale tickets.",
                "href": "desk",
            }
        )

    open_n = float(desk.get("open_notional") or 0)
    if open_n > 1500:
        tips.append(
            {
                "priority": "1",
                "kind": "inventory",
                "title": "Inventory heavy",
                "body": f"Open notional {open_n:.0f}. Consider take-profit strategy.",
                "href": "desk",
            }
        )

    tips.append(
        {
            "priority": "3",
            "kind": "ecosystem",
            "title": f"Asset: {(h.get('featured_asset') or {}).get('symbol', 'MON')}",
            "body": "Use catalog addresses only — never paste from random CT.",
            "href": "codex",
        }
    )

    tips.sort(key=lambda t: t["priority"])
    demo = apply_gas_limit_margin(10143, 120_000)
    return {
        "schema": "thesis.intelligence.v1",
        "headline": (h.get("intelligence") or {}).get("headline"),
        "tips": tips[:5],
        "gas_example": demo,
        "streak": h.get("streak"),
        "level": h.get("level"),
        "xp": h.get("xp"),
        "pitch": h.get("pitch"),
    }


def quick_reject_demo() -> Dict[str, Any]:
    """One-tap intelligence: show a reject so user feels the product."""
    report = run_desk_arena(load_desk())
    rejected = [r for r in report.get("results") or [] if not r.get("accepted")]
    sample = rejected[0] if rejected else None
    return {
        "schema": "thesis.intelligence.reject_demo.v1",
        "n_rejected": report.get("n_rejected"),
        "sample": sample,
        "lesson": "That reject just saved a blank-check trade. Come back tomorrow for another.",
    }
