"""Multi-agent plan generation for NOMOS arena (deterministic, no LLM required)."""

from __future__ import annotations

from typing import List

from .models import Action, BuildRequest, Category, Policy


def propose_plans(request: BuildRequest, policy: Policy | None = None) -> List[Action]:
    """Generate competing agent plans from objective + categories.

    Always includes at least one lawful and one unlawful plan so REJECT is demoable.
    """
    pol = policy or request.policy
    cats = request.categories or [Category.VAULT]
    primary = cats[0]
    proto_map = {
        Category.DEX: "kuru",
        Category.LENDING: "aave",
        Category.VAULT: "beefy",
        Category.STAKING: "magma",
        Category.PERPS: "perpl",
        Category.ANALYTICS: "monadvision",
        Category.AGENT: "monad-agent-hub",
    }
    proto = proto_map.get(primary, "beefy")

    plans: List[Action] = [
        Action(
            agent="reckless-agent",
            category=Category.PERPS if Category.PERPS not in pol.allowed_categories else primary,
            protocol="perpl",
            action="open",
            value=max(pol.max_action_value * 3, 5000),
            slippage_bps=max(pol.max_slippage_bps * 10, 800),
            resulting_protocol_exposure_bps=min(9500, pol.max_protocol_exposure_bps + 5000),
            resulting_liquid_reserve_bps=max(50, pol.min_liquid_reserve_bps // 10),
            resulting_leverage_bps=max(40000, pol.max_leverage_bps * 2),
            expected_gain_bps=900,
            risk_bps=500,
            rationale="Maximize yield with leverage — expected REJECT under lawbook",
        ),
        Action(
            agent="balanced-agent",
            category=primary if primary in pol.allowed_categories else Category.VAULT,
            protocol=proto if primary != Category.PERPS else "beefy",
            action="deposit" if primary in (Category.VAULT, Category.STAKING) else "supply" if primary == Category.LENDING else "swap",
            value=min(100.0, pol.max_action_value * 0.1),
            slippage_bps=min(20, pol.max_slippage_bps),
            resulting_protocol_exposure_bps=min(1200, pol.max_protocol_exposure_bps),
            resulting_liquid_reserve_bps=max(4000, pol.min_liquid_reserve_bps),
            resulting_leverage_bps=10000,
            expected_gain_bps=280,
            risk_bps=60,
            rationale="Conservative action inside all lawbook bounds",
        ),
        Action(
            agent="yield-agent",
            category=Category.VAULT if Category.VAULT in pol.allowed_categories else primary,
            protocol="beefy",
            action="deposit",
            value=min(200.0, pol.max_action_value * 0.2),
            slippage_bps=min(25, pol.max_slippage_bps),
            resulting_protocol_exposure_bps=min(1500, pol.max_protocol_exposure_bps),
            resulting_liquid_reserve_bps=max(3500, pol.min_liquid_reserve_bps),
            resulting_leverage_bps=10000,
            expected_gain_bps=420,
            risk_bps=90,
            rationale="Vault yield within exposure and reserve limits",
        ),
        Action(
            agent="dust-agent",
            category=Category.DEX if Category.DEX in pol.allowed_categories else primary,
            protocol="kuru",
            action="swap",
            value=min(50.0, pol.max_action_value * 0.05),
            slippage_bps=min(15, pol.max_slippage_bps),
            resulting_protocol_exposure_bps=min(800, pol.max_protocol_exposure_bps),
            resulting_liquid_reserve_bps=max(5000, pol.min_liquid_reserve_bps),
            resulting_leverage_bps=10000,
            expected_gain_bps=40,
            risk_bps=25,
            rationale="Small DEX rebalance for liquidity hygiene",
        ),
    ]
    return plans
