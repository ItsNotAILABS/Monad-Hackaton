"""Company OS — THESIS General Manager coordinates all departments."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..receipts import seal
from .departments import (
    constitution_to_policy,
    run_academy,
    run_agora,
    run_custos,
    run_mathesis,
    run_nervus,
    run_nomos,
    run_praxis,
    run_sensus,
)
from .models import (
    CompanyState,
    Constitution,
    Dept,
    Mission,
    MissionStatus,
    Priority,
    StrategyProposal,
)

_ROOT = Path(__file__).resolve().parents[3]
_PATH = _ROOT / "receipts" / "company_os.json"


class CompanyOS:
    def __init__(self, state: CompanyState):
        self.state = state

    def save(self) -> None:
        self.state.updated_at = time.time()
        _PATH.parent.mkdir(parents=True, exist_ok=True)
        _PATH.write_text(json.dumps(self.state.model_dump(mode="json"), indent=2), encoding="utf-8")


def _load() -> CompanyState:
    if _PATH.exists():
        try:
            raw = json.loads(_PATH.read_text(encoding="utf-8"))
            # Pydantic will coerce nested structures
            return CompanyState(**raw)
        except Exception:
            pass
    return CompanyState()


def get_company() -> CompanyOS:
    return CompanyOS(_load())


def constitution_get() -> Dict[str, Any]:
    c = get_company()
    return {
        "constitution": c.state.constitution.model_dump(mode="json"),
        "policy_mirror": constitution_to_policy(c.state.constitution).model_dump(mode="json"),
        "company_name": c.state.company_name,
    }


def constitution_set(data: Dict[str, Any]) -> Dict[str, Any]:
    c = get_company()
    base = c.state.constitution.model_dump()
    base.update({k: v for k, v in data.items() if v is not None})
    c.state.constitution = Constitution(**base)
    c.save()
    seal("company.constitution", {"owner": c.state.constitution.owner_label})
    return constitution_get()


def run_objective(objective: Optional[str] = None) -> Dict[str, Any]:
    """Full company pipeline for one owner objective → mission awaiting approval."""
    t0 = time.perf_counter()
    company = get_company()
    const = company.state.constitution
    obj = (objective or const.objective_default).strip()

    # Embed ecosystem laws at runtime (same class of runtime embed as owner constitution)
    from ..ecosystem_laws import embed_ecosystem_laws

    eco_laws = embed_ecosystem_laws()

    sensus = run_sensus(const)
    proposals, agora = run_agora(const, sensus)
    proposals, nomos = run_nomos(const, proposals)
    mathesis = run_mathesis(const, sensus, proposals)

    lawful = [p for p in proposals if p.lawful]
    winner: Optional[StrategyProposal] = max(lawful, key=lambda p: p.score) if lawful else None

    praxis = run_praxis(winner, const)
    txs = (praxis.findings or {}).get("transactions") or []
    custos = run_custos(winner, txs)
    academy = run_academy(winner, const)

    status = MissionStatus.AWAITING_APPROVAL
    priority = Priority.RECOMMENDED
    if not winner or custos.status == "block":
        status = MissionStatus.BLOCKED
        priority = Priority.REJECTED
    elif winner and winner.agent == "preservation":
        priority = Priority.OPTIONAL

    rejected_props = [p for p in proposals if not p.lawful]

    mission = Mission(
        title=winner.title if winner else "No lawful mission",
        objective=obj,
        status=status,
        priority=priority,
        departments_involved=[
            Dept.SENSUS,
            Dept.AGORA,
            Dept.NOMOS,
            Dept.MATHESIS,
            Dept.PRAXIS,
            Dept.CUSTOS,
            Dept.ACADEMY,
            Dept.NERVUS,
            Dept.MEMORIA,
            Dept.THESIS,
        ],
        reports=[sensus, agora, nomos, mathesis, praxis, custos, academy],
        proposals=proposals,
        winner=winner,
        expected_outcome=(
            f"{winner.thesis} Expected return ~{winner.expected_return_bps} bps, risk ~{winner.risk_bps} bps."
            if winner
            else "All actionable plans blocked by constitution or security."
        ),
        risks=_risks(winner, const, rejected_props),
        transactions=txs,
        explanation=_gm_explanation(obj, sensus, winner, nomos, custos, academy),
        academy_lesson=(academy.findings or {}).get("lesson", ""),
        simulation=mathesis.findings or {},
        security=custos.findings or {},
        tags=["company-os", winner.agent if winner else "none"],
    )

    nervus = run_nervus(
        {
            "mission_id": mission.mission_id,
            "objective": obj,
            "winner": winner.agent if winner else None,
            "status": status.value,
            "n_proposals": len(proposals),
            "n_blocked": len(rejected_props),
        }
    )
    mission.reports.append(nervus)
    mission.receipt_hash = (nervus.findings or {}).get("receipt", {}).get("receipt_hash", "")
    mission.updated_at = time.time()

    m = company.state.metrics
    m.missions_total += 1
    m.policy_blocks += len(rejected_props)
    m.time_saved_minutes += 18.0
    if winner and winner.agent == "yield":
        m.idle_capital_reduced_usdc += float(
            (mathesis.findings or {}).get("best", {}).get("notional") or 0
        )
    m.unnecessary_tx_avoided += len(rejected_props)
    company.state.missions.insert(0, mission)
    company.state.missions = company.state.missions[:100]
    company.state.metrics = m
    company.save()

    elapsed = (time.perf_counter() - t0) * 1000
    return {
        "schema": "thesis.company.mission.v1",
        "ok": True,
        "elapsed_ms": elapsed,
        "mission": mission.model_dump(mode="json"),
        "sla_all_met": all(r.sla_met for r in mission.reports),
        "headquarters": "awaiting_owner" if status == MissionStatus.AWAITING_APPROVAL else status.value,
        "law_stack": {
            "owner_constitution": True,
            "ecosystem_laws_embedded": True,
            "ecosystem_law_count": eco_laws.get("law_count"),
            "ecosystem_domains": list((eco_laws.get("domains") or {}).keys()),
            "doctrine": eco_laws.get("doctrine"),
        },
    }


def _risks(winner, const: Constitution, rejected: List[StrategyProposal]) -> List[str]:
    risks = [
        f"Must maintain ≥{const.min_liquid_reserve_bps / 100:.0f}% liquid reserve",
        f"Protocol concentration cap {const.max_protocol_exposure_bps / 100:.0f}%",
        "Monad gas is billed on limit — keep buffers tight (~7.5%)",
    ]
    if winner and winner.actions:
        risks.append(f"Smart-contract exposure via {winner.actions[0].get('protocol')}")
    if rejected:
        risks.append(f"{len(rejected)} competing plans were unlawful and blocked")
    return risks


def _gm_explanation(obj, sensus, winner, nomos, custos, academy) -> str:
    return (
        f"**THESIS (GM)** received objective: “{obj}”.\n\n"
        f"**SENSUS:** {sensus.summary}\n\n"
        f"**NOMOS:** {nomos.summary}\n\n"
        f"**Recommendation:** "
        + (
            f"{winner.agent} — {winner.title}. {winner.thesis}"
            if winner
            else "Hold / no action — constitution or security blocked deployable plans."
        )
        + f"\n\n**CUSTOS:** {custos.summary}\n\n"
        f"**ACADEMY:** {(academy.findings or {}).get('lesson', '')[:400]}"
    )


def morning_brief() -> Dict[str, Any]:
    company = get_company()
    const = company.state.constitution
    sensus = run_sensus(const)
    f = sensus.findings or {}
    equity = float(f.get("desk_equity") or 0)
    cash = float(f.get("desk_cash_usdc") or 0)
    idle = float(f.get("idle_capital_pct") or 0)
    day_pnl = f.get("day_pnl")
    mon = (f.get("marks") or {}).get("MON/USDC")
    urgent = idle > 50
    company.state.last_brief_at = time.time()
    company.save()
    return {
        "schema": "thesis.company.brief.v1",
        "headline": "Morning Brief",
        "as_of": time.time(),
        "narrative": (
            f"You have operating equity ≈ {equity:.0f} USDC-eq and cash ≈ {cash:.0f}. "
            f"{idle:.0f}% appears idle. "
            f"MON mark ≈ {mon}. Day desk PnL {day_pnl}. "
            + ("One idle-capital action may be worth reviewing." if urgent else "No action is urgent.")
        ),
        "bullets": [
            f"Equity ≈ {equity:.2f}",
            f"Cash ≈ {cash:.2f} ({idle:.0f}% idle)",
            f"Day PnL: {day_pnl}",
            f"Wallets linked: {f.get('wallets_linked')}",
            f"Sandbox twins: {f.get('sandbox_twins')}",
            f"Gas: {f.get('gas_tip')}",
            f"Constitution: liquid≥{const.min_liquid_reserve_bps / 100:.0f}%, "
            f"max protocol {const.max_protocol_exposure_bps / 100:.0f}%, leverage "
            f"{'OFF' if not const.allow_leverage else 'ON'}",
        ],
        "sensus": sensus.model_dump(mode="json"),
        "company": company.state.company_name,
        "metrics_snapshot": company.state.metrics.model_dump(mode="json"),
    }


def inbox() -> Dict[str, Any]:
    company = get_company()
    items: List[Dict[str, Any]] = []
    for m in company.state.missions[:20]:
        items.append(
            {
                "mission_id": m.mission_id,
                "title": m.title,
                "priority": m.priority.value if hasattr(m.priority, "value") else m.priority,
                "status": m.status.value if hasattr(m.status, "value") else m.status,
                "objective": m.objective[:160],
                "agent": m.winner.agent if m.winner else None,
                "updated_at": m.updated_at,
            }
        )
    if company.state.missions:
        latest = company.state.missions[0]
        for p in latest.proposals:
            if not p.lawful:
                items.append(
                    {
                        "mission_id": latest.mission_id,
                        "title": f"Rejected automatically: {p.title}",
                        "priority": Priority.REJECTED.value,
                        "status": "rejected",
                        "objective": "; ".join(p.violations[:3]),
                        "agent": p.agent,
                        "updated_at": latest.updated_at,
                    }
                )
        if latest.academy_lesson:
            items.append(
                {
                    "mission_id": latest.mission_id,
                    "title": "Learning: why the plan looks this way",
                    "priority": Priority.LEARNING.value,
                    "status": "learning",
                    "objective": latest.academy_lesson[:200],
                    "agent": "academy",
                    "updated_at": latest.updated_at,
                }
            )
    return {
        "schema": "thesis.company.inbox.v1",
        "n": len(items),
        "items": items[:30],
        "empty_hint": "Assign THESIS an objective to staff a mission.",
    }


def get_mission(mission_id: str) -> Dict[str, Any]:
    company = get_company()
    for m in company.state.missions:
        if m.mission_id == mission_id:
            return {
                "schema": "thesis.company.mission_room.v1",
                "mission": m.model_dump(mode="json"),
                "actions_allowed": ["approve", "reject", "simulate_again", "revise"],
            }
    return {"ok": False, "error": "mission not found"}


def act_on_mission(mission_id: str, decision: str, note: str = "") -> Dict[str, Any]:
    company = get_company()
    mission = next((m for m in company.state.missions if m.mission_id == mission_id), None)
    if not mission:
        return {"ok": False, "error": "mission not found"}
    decision = decision.lower().strip()
    if decision == "approve":
        if mission.status == MissionStatus.BLOCKED:
            return {"ok": False, "error": "blocked mission cannot be approved"}
        mission.user_decision = "approve"
        mission.status = MissionStatus.EXECUTING
        for tx in mission.transactions:
            tx["status"] = "authorized_pending_signature"
        mission.status = MissionStatus.COMPLETED
        mission.result = {
            "executed": "signature_queue",
            "note": note
            or "Owner approved. PRAXIS queued steps; chain still needs wallet signature.",
            "time_saved_minutes": 18,
        }
        company.state.metrics.missions_completed += 1
        company.state.metrics.time_saved_minutes += 18
        company.state.metrics.lessons_completed += 1
        company.state.metrics.agent_accuracy_total += 1
        company.state.metrics.agent_accuracy_hits += 1
    elif decision == "reject":
        mission.user_decision = "reject"
        mission.status = MissionStatus.REJECTED
        mission.result = {"note": note or "Owner rejected"}
        company.state.metrics.missions_rejected += 1
    elif decision == "simulate_again":
        mission.user_decision = "simulate_again"
        return run_objective(mission.objective)
    elif decision == "revise":
        mission.user_decision = "revise"
        mission.status = MissionStatus.DRAFT
        mission.result = {"note": note or "Owner requested revision"}
    else:
        return {"ok": False, "error": f"unknown decision {decision}"}

    mission.updated_at = time.time()
    nervus = run_nervus(
        {
            "mission_id": mission.mission_id,
            "decision": decision,
            "status": mission.status.value,
        }
    )
    mission.reports.append(nervus)
    mission.receipt_hash = (nervus.findings or {}).get("receipt", {}).get("receipt_hash", "")
    company.save()
    seal("company.decision", {"mission_id": mission_id, "decision": decision})
    return {
        "ok": True,
        "mission": mission.model_dump(mode="json"),
        "metrics": company.state.metrics.model_dump(mode="json"),
    }


def performance() -> Dict[str, Any]:
    company = get_company()
    m = company.state.metrics
    acc = (
        m.agent_accuracy_hits / m.agent_accuracy_total if m.agent_accuracy_total else None
    )
    return {
        "schema": "thesis.company.performance.v1",
        "company_name": company.state.company_name,
        "metrics": m.model_dump(mode="json"),
        "kpis": {
            "time_saved_minutes": m.time_saved_minutes,
            "policy_violations_blocked": m.policy_blocks,
            "missions_completed": m.missions_completed,
            "missions_rejected_by_owner": m.missions_rejected,
            "idle_capital_reduced_usdc": m.idle_capital_reduced_usdc,
            "unnecessary_tx_avoided": m.unnecessary_tx_avoided,
            "lessons_completed": m.lessons_completed,
            "agent_accuracy": acc,
        },
        "narrative": (
            f"Your miniature DeFi company blocked {m.policy_blocks} unlawful proposals, "
            f"saved ~{m.time_saved_minutes:.0f} minutes of multi-app work, "
            f"completed {m.missions_completed} missions, and taught {m.lessons_completed} live lessons."
        ),
        "scaling": {
            "now": "Individual — one wallet, one constitution",
            "next": ["Household multi-wallet", "Business treasury", "Agent economy roles"],
        },
    }


def headquarters() -> Dict[str, Any]:
    from ..ecosystem_laws import runtime_status

    return {
        "schema": "thesis.company.hq.v1",
        "brief": morning_brief(),
        "inbox": inbox(),
        "performance": performance(),
        "constitution": constitution_get(),
        "ecosystem_laws": runtime_status(),
        "pitch": {
            "one_liner": (
                "THESIS gives one person a miniature DeFi company for Monad: "
                "research, compete strategies, block unsafe actions, explain, "
                "execute with approval, and track the result."
            ),
            "roommate": (
                "A repetitive 20-minute workflow across multiple DeFi applications "
                "becomes one managed, explained mission from a single screen."
            ),
            "structure": {
                "engines": "Python workforce (departments)",
                "owner_laws": "Constitution (NOMOS)",
                "ecosystem_laws": "Runtime-embedded Monad + protocol + safety lawbook",
                "contracts": "Company laws on-chain",
                "app": "Headquarters",
                "owner": "Sovereign wallet owner",
            },
        },
    }
