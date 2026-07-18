"""ACADEMY — failure-first education for humans and AI agents."""

from __future__ import annotations

from typing import Any, Dict, List

from .models import Action, Category, Policy
from .policy import evaluate

# Default lawbook used in teaching labs (strict enough to fail bad plans)
TEACHING_POLICY = Policy(
    max_slippage_bps=50,
    max_protocol_exposure_bps=2000,
    min_liquid_reserve_bps=2500,
    max_leverage_bps=12500,
    max_action_value=1000,
    require_simulation=True,
    allowed_categories=[
        Category.DEX,
        Category.LENDING,
        Category.VAULT,
        Category.STAKING,
        Category.ANALYTICS,
        # deliberately exclude PERPS by default for lessons
    ],
)


def _quest(
    quest_id: str,
    title: str,
    lesson: str,
    ai_constraint: str,
    why_it_matters: str,
    options: List[Action],
    correct_index: int,
    pass_if: str,
) -> Dict[str, Any]:
    return {
        "id": quest_id,
        "title": title,
        "lesson": lesson,
        "ai_constraint": ai_constraint,
        "why_it_matters": why_it_matters,
        "pass_if": pass_if,
        "correct_index": correct_index,
        "options": [a.model_dump(mode="json") for a in options],
        "policy": TEACHING_POLICY.model_dump(mode="json"),
    }


QUESTS: List[Dict[str, Any]] = [
    _quest(
        "slippage-trap",
        "Slippage trap",
        "Slippage is how much worse your fill can be versus the quote. "
        "Loose slippage on thin liquidity is how bots and humans bleed value.",
        "AI agents must never propose slippage_bps above the lawbook max.",
        "You almost signed a 9% slippage swap because an agent 'wanted certainty of fill.'",
        [
            Action(
                agent="reckless-bot",
                category=Category.DEX,
                protocol="kuru",
                action="swap",
                value=200,
                slippage_bps=900,
                resulting_protocol_exposure_bps=1000,
                resulting_liquid_reserve_bps=4000,
                resulting_leverage_bps=10000,
                expected_gain_bps=20,
                risk_bps=400,
                rationale="Guarantee fill at any price",
            ),
            Action(
                agent="careful-bot",
                category=Category.DEX,
                protocol="kuru",
                action="swap",
                value=200,
                slippage_bps=30,
                resulting_protocol_exposure_bps=1000,
                resulting_liquid_reserve_bps=4000,
                resulting_leverage_bps=10000,
                expected_gain_bps=15,
                risk_bps=40,
                rationale="Bound price impact under law",
            ),
        ],
        correct_index=1,
        pass_if="Pick the plan that stays under max_slippage_bps and is ACCEPTED.",
    ),
    _quest(
        "rogue-category",
        "Rogue category / perps ban",
        "Your lawbook can ban entire categories (e.g. perps) while you learn. "
        "Agents must not route around category bans.",
        "If category ∉ allowed_categories → hard reject. No exceptions in prompts.",
        "An agent opened leveraged perps because 'expected_gain looked high.'",
        [
            Action(
                agent="degen",
                category=Category.PERPS,
                protocol="perpl",
                action="open",
                value=100,
                slippage_bps=10,
                resulting_protocol_exposure_bps=1000,
                resulting_liquid_reserve_bps=4000,
                resulting_leverage_bps=10000,
                expected_gain_bps=800,
                risk_bps=500,
                rationale="High APY perps",
            ),
            Action(
                agent="builder",
                category=Category.LENDING,
                protocol="aave",
                action="supply",
                value=100,
                slippage_bps=5,
                resulting_protocol_exposure_bps=1000,
                resulting_liquid_reserve_bps=5000,
                resulting_leverage_bps=10000,
                expected_gain_bps=120,
                risk_bps=50,
                rationale="Supply only within allowlist",
            ),
        ],
        correct_index=1,
        pass_if="Reject the perps plan; accept a lawful lending plan.",
    ),
    _quest(
        "reserve-leverage",
        "Reserve & leverage discipline",
        "min liquid reserve keeps dry powder. max leverage caps borrowed risk. "
        "Together they stop 'all-in' agent strategies.",
        "Never lower reserves or raise leverage past lawbook — even if score looks good.",
        "Agent maxed exposure and leverage for yield; you would have been one move from liquidated.",
        [
            Action(
                agent="all-in",
                category=Category.VAULT,
                protocol="beefy",
                action="deposit",
                value=500,
                slippage_bps=20,
                resulting_protocol_exposure_bps=9000,
                resulting_liquid_reserve_bps=100,
                resulting_leverage_bps=40000,
                expected_gain_bps=900,
                risk_bps=200,
                rationale="Max yield",
            ),
            Action(
                agent="balanced",
                category=Category.VAULT,
                protocol="beefy",
                action="deposit",
                value=200,
                slippage_bps=15,
                resulting_protocol_exposure_bps=1200,
                resulting_liquid_reserve_bps=4000,
                resulting_leverage_bps=10000,
                expected_gain_bps=300,
                risk_bps=80,
                rationale="Stay inside reserve and leverage laws",
            ),
        ],
        correct_index=1,
        pass_if="Choose the plan that keeps reserve and leverage lawful.",
    ),
    _quest(
        "receipt-literacy",
        "Receipt literacy",
        "Every material act should leave a hash-linked receipt so you can audit "
        "what the agent did and what was rejected.",
        "Never claim execution without a receipt hash. Prefer seal over screenshots.",
        "Without receipts, 'the bot said it worked' is not evidence.",
        [
            Action(
                agent="ghost",
                category=Category.ANALYTICS,
                protocol="monadvision",
                action="noop-claim",
                value=0,
                slippage_bps=0,
                resulting_protocol_exposure_bps=0,
                resulting_liquid_reserve_bps=10000,
                resulting_leverage_bps=10000,
                expected_gain_bps=0,
                risk_bps=0,
                rationale="Say success without sealing",
            ),
            Action(
                agent="auditor",
                category=Category.ANALYTICS,
                protocol="monadvision",
                action="seal-receipt",
                value=0,
                slippage_bps=0,
                resulting_protocol_exposure_bps=500,
                resulting_liquid_reserve_bps=5000,
                resulting_leverage_bps=10000,
                expected_gain_bps=10,
                risk_bps=5,
                rationale="Seal hash-linked receipt for the action",
            ),
        ],
        correct_index=1,
        pass_if="Prefer the plan that seals an auditable receipt path.",
    ),
]


def list_quests() -> list[dict[str, Any]]:
    return [
        {
            "id": q["id"],
            "title": q["title"],
            "lesson": q["lesson"],
            "ai_constraint": q["ai_constraint"],
            "why_it_matters": q["why_it_matters"],
            "pass_if": q["pass_if"],
            "n_options": len(q["options"]),
        }
        for q in QUESTS
    ]


def get_quest(quest_id: str) -> dict[str, Any] | None:
    for q in QUESTS:
        if q["id"] == quest_id:
            return q
    return None


def grade_quest(quest_id: str, selected_action_index: int, understood: bool = False) -> dict[str, Any]:
    q = get_quest(quest_id)
    if not q:
        return {"ok": False, "error": f"unknown quest {quest_id}"}
    opts = q["options"]
    if selected_action_index < 0 or selected_action_index >= len(opts):
        return {"ok": False, "error": "selected_action_index out of range"}

    policy = Policy(**q["policy"])
    graded = []
    for raw in opts:
        action = Action(**raw)
        ev = evaluate(action, policy)
        graded.append({"action": raw, "evaluation": ev.model_dump(mode="json")})

    chosen = graded[selected_action_index]
    correct = selected_action_index == q["correct_index"]
    chosen_accepted = chosen["evaluation"]["accepted"]
    # Must pick the correct lawful plan (and it must be accepted)
    passed = correct and chosen_accepted and understood

    return {
        "ok": True,
        "schema": "thesis.academy.grade.v1",
        "quest_id": quest_id,
        "title": q["title"],
        "passed": passed,
        "correct_index": q["correct_index"],
        "selected_index": selected_action_index,
        "understood": understood,
        "chosen_summary": chosen["evaluation"]["human_summary"],
        "graded_options": graded,
        "certificate_line": (
            "I failed safely on Monad before I spent for real."
            if passed
            else "Review the lesson and pick the lawful plan; check 'I understand'."
        ),
        "ai_constraint": q["ai_constraint"],
        "lesson": q["lesson"],
    }
