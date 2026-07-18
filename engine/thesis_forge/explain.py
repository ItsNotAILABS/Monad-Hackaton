"""Plain-language explainers for rejects, wins, and next actions."""

from __future__ import annotations

from typing import Any, Dict, List

from .models import Action, Evaluation, Policy

_TEACH: Dict[str, Dict[str, str]] = {
    "category-not-allowed": {
        "title": "Category banned by lawbook",
        "teach": "Your lawbook only allows certain activity types (dex, vault, …). Perps or agents outside that list are illegal by design.",
        "fix": "Remove the category from the plan, or deliberately expand allowed_categories after you accept the risk.",
        "risk": "Agents love high-APY categories. Bans are how you keep them out without trusting the model.",
    },
    "slippage-limit": {
        "title": "Slippage too high",
        "teach": "Slippage is how much worse the fill can be than the quote. High slippage is how thin markets and MEV extract value.",
        "fix": "Lower slippage_bps under max_slippage_bps, or split the trade, or skip the venue.",
        "risk": "Bots often raise slippage 'to guarantee fill' — that guarantee is paid by you.",
    },
    "protocol-exposure-limit": {
        "title": "Too much in one protocol",
        "teach": "Concentration risk: if one protocol fails or pauses, a large share of capital is stuck or lost.",
        "fix": "Reduce size or diversify until resulting_protocol_exposure_bps is under the cap.",
        "risk": "Yield agents stack the hottest farm. Caps force diversification.",
    },
    "liquid-reserve-limit": {
        "title": "Not enough dry powder",
        "teach": "Liquid reserve is cash/liquid buffer for gas, margin, and exits. Going all-in removes optionality.",
        "fix": "Keep more liquid assets so resulting_liquid_reserve_bps stays above the minimum.",
        "risk": "All-in vault dumps look smart until you need gas or an emergency exit.",
    },
    "leverage-limit": {
        "title": "Leverage over the line",
        "teach": "Leverage multiplies gains and losses. Your lawbook sets a hard ceiling so agents cannot quietly lever up.",
        "fix": "Reduce borrowed exposure until leverage_bps ≤ max_leverage_bps (10000 = 1x).",
        "risk": "One volatile move liquidates levered positions. Seatbelts exist for this.",
    },
    "action-value-limit": {
        "title": "Action size too large",
        "teach": "Max action value is a per-step circuit breaker so no single call can move your whole treasury.",
        "fix": "Split into smaller actions under max_action_value.",
        "risk": "One bad approve+swap of full balance is a classic agent failure mode.",
    },
}


def explain_evaluation(action: Action, evaluation: Evaluation, policy: Policy) -> Dict[str, Any]:
    cards: List[Dict[str, str]] = []
    for v in evaluation.violations:
        meta = _TEACH.get(
            v,
            {
                "title": v,
                "teach": evaluation.human_summary,
                "fix": "Adjust the plan to satisfy the lawbook.",
                "risk": "Unclassified violation — treat as hard stop.",
            },
        )
        cards.append({"code": v, **meta})

    if evaluation.accepted:
        headline = f"ACCEPTED — {action.agent} on {action.protocol}"
        story = (
            f"This plan stays inside your laws (score {evaluation.score:.0f}). "
            f"Next: user must still authorize any on-chain execute — acceptance is not a signature."
        )
        next_steps = [
            "Review target protocol adapter_status (planned/simulated ≠ live capital).",
            "Simulate gas and exact calldata before signing.",
            "Seal a receipt after execution.",
        ]
    else:
        headline = f"REJECTED — {action.agent} on {action.protocol}"
        story = (
            f"{len(evaluation.violations)} law(s) blocked this plan. "
            "That is the product: agents propose, laws decide."
        )
        next_steps = [c["fix"] for c in cards][:4]
        next_steps.append("Re-run arena after editing the plan or tightening teaching.")

    return {
        "schema": "thesis.explain.v1",
        "accepted": evaluation.accepted,
        "headline": headline,
        "story": story,
        "summary": evaluation.human_summary,
        "score": evaluation.score,
        "violations": evaluation.violations,
        "reasons": evaluation.reasons,
        "cards": cards,
        "next_steps": next_steps,
        "policy_snapshot": policy.model_dump(mode="json"),
        "action": action.model_dump(mode="json"),
        "doctrine": "Reject is a feature. Teach the failure before you fund it.",
    }


def explain_arena(report: dict) -> Dict[str, Any]:
    """High-level arena narrative for UI."""
    rejected = []
    accepted = []
    for row in report.get("evaluations") or []:
        ev = row.get("evaluation") or {}
        act = row.get("action") or {}
        item = {
            "agent": act.get("agent"),
            "protocol": act.get("protocol"),
            "summary": ev.get("human_summary"),
            "violations": ev.get("violations") or [],
        }
        if ev.get("accepted"):
            accepted.append(item)
        else:
            rejected.append(item)
    winner = (report.get("winner") or {}).get("action") or {}
    return {
        "schema": "thesis.explain.arena.v1",
        "headline": (
            f"{report.get('n_rejected', 0)} rejected · {report.get('n_accepted', 0)} accepted"
        ),
        "story": (
            f"Winner: {winner.get('agent', 'none')}. "
            "Show rejections first in demos — judges click twice looking for fake success."
        ),
        "rejected": rejected,
        "accepted": accepted,
        "winner_agent": winner.get("agent"),
        "teaching_tip": "Open any REJECT card and read the fix — that is Academy in the wild.",
    }
