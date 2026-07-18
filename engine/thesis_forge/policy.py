"""NOMOS Arena — multi-agent proposal evaluation core.

Heart of THESIS risk/law: evaluate → arbitrate → arena_report.

Doctrine (everywhere):
  Agents propose. Laws decide. Owner signs. Receipts remember.

REJECT is a first-class, valuable feature — not a failure.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from .models import Action, Evaluation, Policy

DOCTRINE = "Agents propose. Laws decide. Owner signs. Receipts remember."
TAGLINE = "Auto multi-agent propose + arena (REJECT is a feature)"

# Machine-readable rulebook. evaluate() applies these against Action + Policy.
RULES: List[Dict[str, Any]] = [
    {
        "id": "category-not-allowed",
        "field_action": "category",
        "field_policy": "allowed_categories",
        "op": "in",
        "human": "Category is outside the lawbook allowlist.",
    },
    {
        "id": "slippage-limit",
        "field_action": "slippage_bps",
        "field_policy": "max_slippage_bps",
        "op": "<=",
        "human": "Slippage exceeds max_slippage_bps — price impact too high.",
    },
    {
        "id": "protocol-exposure-limit",
        "field_action": "resulting_protocol_exposure_bps",
        "field_policy": "max_protocol_exposure_bps",
        "op": "<=",
        "human": "Protocol concentration exceeds max_protocol_exposure_bps.",
    },
    {
        "id": "liquid-reserve-limit",
        "field_action": "resulting_liquid_reserve_bps",
        "field_policy": "min_liquid_reserve_bps",
        "op": ">=",
        "human": "Liquid reserve would fall below min_liquid_reserve_bps.",
    },
    {
        "id": "leverage-limit",
        "field_action": "resulting_leverage_bps",
        "field_policy": "max_leverage_bps",
        "op": "<=",
        "human": "Leverage exceeds max_leverage_bps — too much borrowed risk.",
    },
    {
        "id": "action-value-limit",
        "field_action": "value",
        "field_policy": "max_action_value",
        "op": "<=",
        "human": "Action value exceeds max_action_value cap.",
    },
]

_REASON = {r["id"]: r["human"] for r in RULES}


def rule_catalog() -> Dict[str, Any]:
    """Public catalog of arena checks (for GET /nomos, docs, UI)."""
    return {
        "schema": "thesis.nomos.rules.v1",
        "doctrine": DOCTRINE,
        "tagline": TAGLINE,
        "reject_is_a_feature": True,
        "pipeline": ["evaluate", "arbitrate", "arena_report"],
        "models": {
            "Action": (
                "Proposed plan/ticket: agent, category, protocol, value, "
                "slippage_bps, resulting_*_bps, expected_gain_bps, risk_bps, rationale"
            ),
            "Policy": (
                "Rulebook / constitution: max_slippage_bps, max_protocol_exposure_bps, "
                "min_liquid_reserve_bps, max_leverage_bps, max_action_value, "
                "allowed_categories, require_simulation"
            ),
            "Evaluation": (
                "Result of one Action vs Policy: accepted, violations, score, "
                "reasons, human_summary"
            ),
        },
        "rules": list(RULES),
        "score": "expected_gain_bps - risk_bps - slippage_bps (lawful plans only compete for winner)",
        "files": {
            "core": "engine/thesis_forge/policy.py",
            "agents": "engine/thesis_forge/agents.py",
            "api": "engine/thesis_forge/api.py",
            "models": "engine/thesis_forge/models.py",
        },
    }


def evaluate(action: Action, policy: Policy) -> Evaluation:
    """Check a single proposed Action against the Policy rulebook.

    Violations are collected (not short-circuited) so operators see every brake
    that fired — essential for ACADEMY failure-first labs.
    """
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

    accepted = len(violations) == 0
    # Score is still computed for rejected plans (transparency / teaching),
    # but arbitrate() only ranks accepted ones for the winner.
    score = float(action.expected_gain_bps - action.risk_bps - action.slippage_bps)
    reasons = [_REASON.get(v, v) for v in violations]

    if not accepted:
        reason = (
            f"REJECTED plan by agent '{action.agent}' on {action.protocol}: "
            + "; ".join(reasons)
        )
    else:
        reason = (
            f"ACCEPTED plan by agent '{action.agent}' on {action.protocol} "
            f"(score={score:.0f}). Laws satisfied."
        )

    return Evaluation(
        accepted=accepted,
        violations=violations,
        score=score,
        reasons=reasons,
        human_summary=reason,
    )


def arbitrate(
    actions: list[Action], policy: Policy
) -> Tuple[List[Tuple[Action, Evaluation]], Optional[Tuple[Action, Evaluation]]]:
    """Evaluate all proposals; winner = highest score among *accepted* plans.

    If every plan is rejected, winner is None — that is a valid arena outcome
    (REJECT is a feature). Owner may revise constitution or re-propose.
    """
    evaluated = [(action, evaluate(action, policy)) for action in actions]
    lawful = [item for item in evaluated if item[1].accepted]
    winner = max(lawful, key=lambda item: item[1].score) if lawful else None
    return evaluated, winner


def scoreboard(
    evaluated: List[Tuple[Action, Evaluation]],
) -> List[Dict[str, Any]]:
    """Rank plans: accepted first (by score desc), then rejected (by score desc)."""
    rows: List[Dict[str, Any]] = []
    for action, ev in evaluated:
        rows.append(
            {
                "agent": action.agent,
                "protocol": action.protocol,
                "category": action.category.value
                if hasattr(action.category, "value")
                else str(action.category),
                "accepted": ev.accepted,
                "score": ev.score,
                "violations": list(ev.violations),
                "outcome": "ACCEPT" if ev.accepted else "REJECT",
            }
        )
    rows.sort(key=lambda r: (0 if r["accepted"] else 1, -float(r["score"])))
    for i, r in enumerate(rows):
        r["rank"] = i + 1
    return rows


def arena_report(actions: list[Action], policy: Policy) -> dict:
    """Full arena report: evaluate all → scoreboard → lawful winner.

    Always sets reject_is_a_feature=True. n_rejected >= 1 in demos is intentional.
    """
    evaluated, winner = arbitrate(actions, policy)
    rows = []
    for action, ev in evaluated:
        rows.append(
            {
                "action": action.model_dump(mode="json"),
                "evaluation": ev.model_dump(mode="json"),
            }
        )
    n_accepted = sum(1 for _, e in evaluated if e.accepted)
    n_rejected = sum(1 for _, e in evaluated if not e.accepted)
    board = scoreboard(evaluated)

    return {
        "schema": "thesis.arena.v1",
        "department": "NOMOS",
        "doctrine": DOCTRINE,
        "tagline": TAGLINE,
        "policy": policy.model_dump(mode="json"),
        "n_plans": len(actions),
        "n_accepted": n_accepted,
        "n_rejected": n_rejected,
        "evaluations": rows,
        "scoreboard": board,
        "winner": {
            "action": winner[0].model_dump(mode="json"),
            "evaluation": winner[1].model_dump(mode="json"),
        }
        if winner
        else None,
        "reject_is_a_feature": True,
        "rules_applied": [r["id"] for r in RULES],
        "owner_next": (
            "Owner may approve winner path, reject all, simulate_again, or revise laws."
            if winner
            else "No lawful winner — revise proposals/laws or accept full REJECT as safety."
        ),
    }


def explain_violations(violations: list[str]) -> List[Dict[str, str]]:
    """Map violation ids → human reasons (for UI / academy)."""
    return [
        {"id": v, "reason": _REASON.get(v, v)}
        for v in violations
    ]
