"""NOMOS — policy evaluation and multi-plan arena."""

from __future__ import annotations

from typing import List, Optional, Tuple

from .models import Action, Evaluation, Policy

_REASON = {
    "category-not-allowed": "Category is outside the lawbook allowlist.",
    "slippage-limit": "Slippage exceeds max_slippage_bps — price impact too high.",
    "protocol-exposure-limit": "Protocol concentration exceeds max_protocol_exposure_bps.",
    "liquid-reserve-limit": "Liquid reserve would fall below min_liquid_reserve_bps.",
    "leverage-limit": "Leverage exceeds max_leverage_bps — too much borrowed risk.",
    "action-value-limit": "Action value exceeds max_action_value cap.",
}


def evaluate(action: Action, policy: Policy) -> Evaluation:
    violations: list[str] = []
    if action.category not in policy.allowed_categories:
        violations.append("category-not-allowed")
    if action.slippage_bps > policy.max_slippage_bps:
        violations.append("slippage-limit")
    if action.resulting_protocol_exposure_bps > policy.max_protocol_exposure_bps:
        violations.append("protocol-exposure-limit")
    if action.resulting_liquid_reserve_bps < policy.min_liquid_reserve_bps:
        violations.append("liquid-reserve-limit")
    if action.resulting_leverage_bps > policy.max_leverage_bps:
        violations.append("leverage-limit")
    if action.value > policy.max_action_value:
        violations.append("action-value-limit")

    score = float(action.expected_gain_bps - action.risk_bps - action.slippage_bps)
    reasons = [_REASON.get(v, v) for v in violations]
    if violations:
        summary = (
            f"REJECTED plan by agent '{action.agent}' on {action.protocol}: "
            + "; ".join(reasons)
        )
    else:
        summary = (
            f"ACCEPTED plan by agent '{action.agent}' on {action.protocol} "
            f"(score={score:.0f}). Laws satisfied."
        )
    return Evaluation(
        accepted=not violations,
        violations=violations,
        score=score,
        reasons=reasons,
        human_summary=summary,
    )


def arbitrate(
    actions: list[Action], policy: Policy
) -> Tuple[List[Tuple[Action, Evaluation]], Optional[Tuple[Action, Evaluation]]]:
    evaluated = [(action, evaluate(action, policy)) for action in actions]
    lawful = [item for item in evaluated if item[1].accepted]
    winner = max(lawful, key=lambda item: item[1].score) if lawful else None
    return evaluated, winner


def arena_report(actions: list[Action], policy: Policy) -> dict:
    evaluated, winner = arbitrate(actions, policy)
    rows = []
    for action, ev in evaluated:
        rows.append(
            {
                "action": action.model_dump(mode="json"),
                "evaluation": ev.model_dump(mode="json"),
            }
        )
    return {
        "schema": "thesis.arena.v1",
        "doctrine": "Agents propose. Laws decide.",
        "policy": policy.model_dump(mode="json"),
        "n_plans": len(actions),
        "n_accepted": sum(1 for _, e in evaluated if e.accepted),
        "n_rejected": sum(1 for _, e in evaluated if not e.accepted),
        "evaluations": rows,
        "winner": {
            "action": winner[0].model_dump(mode="json"),
            "evaluation": winner[1].model_dump(mode="json"),
        }
        if winner
        else None,
        "reject_is_a_feature": True,
    }
