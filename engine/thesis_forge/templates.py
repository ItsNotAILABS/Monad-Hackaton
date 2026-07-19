"""Policy + mission presets — product-ready starting points."""

from __future__ import annotations

from typing import Any, Dict, List

from .models import Category, Policy

PRESETS: List[Dict[str, Any]] = [
    {
        "id": "seatbelt",
        "name": "Seatbelt (recommended)",
        "tagline": "Agents help; capital stays fenced.",
        "blurb": "Tight slippage, no perps, modest size. Best default for Spark demos.",
        "categories": ["dex", "lending", "vault", "staking", "analytics"],
        "policy": Policy(
            max_slippage_bps=40,
            max_protocol_exposure_bps=1500,
            min_liquid_reserve_bps=3000,
            max_leverage_bps=10000,
            max_action_value=250,
            require_simulation=True,
            allowed_categories=[
                Category.DEX,
                Category.LENDING,
                Category.VAULT,
                Category.STAKING,
                Category.ANALYTICS,
            ],
        ),
        "objective": (
            "Coordinate my Monad portfolio across swaps, lending, and vaults while agents "
            "only propose actions inside a strict lawbook — reject anything that looks like a blank check."
        ),
    },
    {
        "id": "learner",
        "name": "Learner lab",
        "tagline": "Failure-first education mode.",
        "blurb": "Very small size so Academy rejects teach without drama.",
        "categories": ["dex", "vault", "analytics"],
        "policy": Policy(
            max_slippage_bps=25,
            max_protocol_exposure_bps=1000,
            min_liquid_reserve_bps=4000,
            max_leverage_bps=10000,
            max_action_value=50,
            require_simulation=True,
            allowed_categories=[Category.DEX, Category.VAULT, Category.ANALYTICS, Category.LENDING],
        ),
        "objective": (
            "Learn Monad DeFi risk by simulating agent plans that must fail or pass under "
            "tight laws before I ever fund automation."
        ),
    },
    {
        "id": "builder",
        "name": "Builder deploy",
        "tagline": "Ship governed apps on Monad.",
        "blurb": "Balanced laws for generating deploy packages and policy vaults.",
        "categories": ["dex", "lending", "vault", "staking", "agent", "analytics"],
        "policy": Policy(
            max_slippage_bps=50,
            max_protocol_exposure_bps=2000,
            min_liquid_reserve_bps=2500,
            max_leverage_bps=12500,
            max_action_value=1000,
            require_simulation=True,
            allowed_categories=list(Category),
        ),
        "objective": (
            "Generate a governed Monad application with contracts, lawbook, agent manual, "
            "and deploy plan so AI agents cannot bypass owner-defined policy."
        ),
    },
    {
        "id": "no-leverage",
        "name": "No leverage",
        "tagline": "Spot + vault only.",
        "blurb": "Perps banned. Leverage locked at 1x. For people burned by liquidations.",
        "categories": ["dex", "vault", "staking", "lending"],
        "policy": Policy(
            max_slippage_bps=30,
            max_protocol_exposure_bps=1800,
            min_liquid_reserve_bps=3500,
            max_leverage_bps=10000,
            max_action_value=400,
            require_simulation=True,
            allowed_categories=[
                Category.DEX,
                Category.VAULT,
                Category.STAKING,
                Category.LENDING,
                Category.ANALYTICS,
            ],
        ),
        "objective": (
            "Operate on Monad with zero leverage and no perps — agents may rebalance and "
            "supply only inside hard reserve and exposure caps."
        ),
    },
]


def list_presets() -> List[Dict[str, Any]]:
    out = []
    for p in PRESETS:
        out.append(
            {
                "id": p["id"],
                "name": p["name"],
                "tagline": p["tagline"],
                "blurb": p["blurb"],
                "categories": p["categories"],
                "policy": p["policy"].model_dump(mode="json"),
                "objective": p["objective"],
            }
        )
    return out


def get_preset(preset_id: str) -> Dict[str, Any] | None:
    for p in list_presets():
        if p["id"] == preset_id:
            return p
    return None
