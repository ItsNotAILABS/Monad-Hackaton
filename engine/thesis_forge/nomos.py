"""NOMOS — Auto multi-agent propose + arena. REJECT is a feature.

Company OS risk/law department: agents propose, dual law stacks decide,
owner signs, receipts remember.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .agents import propose_plans
from .ecosystem_laws import embed_ecosystem_laws, get_ecosystem_laws, runtime_status
from .models import Action, BuildRequest, Policy
from .policy import DOCTRINE as POLICY_DOCTRINE
from .policy import TAGLINE as POLICY_TAGLINE
from .policy import arena_report, evaluate, rule_catalog
from .receipts import seal, tip

DOCTRINE = POLICY_DOCTRINE
TAGLINE = POLICY_TAGLINE

DEPARTMENT_WORKFLOW: List[Dict[str, str]] = [
    {
        "id": "SENSUS",
        "role": "Research",
        "does": "Wallets, desk, markets, ecosystem, sandbox, gas pulse",
    },
    {
        "id": "AGORA",
        "role": "Strategy competition",
        "does": "Multi-agent proposals compete for the objective",
    },
    {
        "id": "NOMOS",
        "role": "Risk / law",
        "does": "Constitution + ecosystem PolicyKernel; evaluate; veto",
    },
    {
        "id": "MATHESIS",
        "role": "Quant / simulation",
        "does": "Cost, slip, worth-doing models on lawful plans",
    },
    {
        "id": "PRAXIS",
        "role": "Execution",
        "does": "Ordered tx missions — every irreversible step needs signature",
    },
    {
        "id": "CUSTOS",
        "role": "Security",
        "does": "Address, approval, gas hygiene checks",
    },
    {
        "id": "MEMORIA",
        "role": "Accounting",
        "does": "Company state continuity",
    },
    {
        "id": "ACADEMY",
        "role": "Teaching",
        "does": "Failure-first labs — rejections feed learning",
    },
    {
        "id": "NERVUS",
        "role": "Audit",
        "does": "Hash-linked ReceiptChain seal",
    },
]

DUAL_LAW_STACK: List[Dict[str, str]] = [
    {
        "layer": "owner_constitution",
        "name": "Owner constitution",
        "source": "LawBook / company constitution",
        "examples": "liquidity floor, leverage off, protocol exposure caps, max action value",
    },
    {
        "layer": "ecosystem_laws",
        "name": "Ecosystem laws",
        "source": "Runtime-embedded Monad + protocol + safety rules",
        "examples": "gas bills limit, exact approval, no real keys, no silent broadcast",
    },
]

ARENA_SURFACES: List[Dict[str, str]] = [
    {
        "id": "arena.auto",
        "method": "POST",
        "path": "/arena/auto",
        "role": "Propose agents + arbitrate under lawbook",
    },
    {
        "id": "arena.manual",
        "method": "POST",
        "path": "/arena",
        "role": "Score a provided action list under Policy",
    },
    {
        "id": "desk.arena",
        "method": "POST",
        "path": "/desk/arena",
        "role": "Trading-agent arena with machine scorecards",
    },
    {
        "id": "agents.propose",
        "method": "POST",
        "path": "/agents/propose",
        "role": "Generate competing plans only (no arbitration)",
    },
    {
        "id": "evaluate",
        "method": "POST",
        "path": "/evaluate",
        "role": "Single Action vs Policy",
    },
    {
        "id": "company.run",
        "method": "POST",
        "path": "/company/run",
        "role": "Full staffed pipeline including run_nomos dual stack",
    },
]

OWNER_ACTIONS: List[str] = ["approve", "reject", "simulate_again", "revise"]

ONCHAIN: List[Dict[str, str]] = [
    {"contract": "SovereignVault", "role": "Capital execute gated by PolicyKernel"},
    {"contract": "PolicyKernel", "role": "On-chain policy, agents, targets, daily cap"},
    {"contract": "LawBook", "role": "Ecosystem + owner law registry"},
    {"contract": "ReceiptChain", "role": "Hash-linked audit spine"},
    {"contract": "AgentRegistry", "role": "Registered agents / twins"},
    {"contract": "ProposalBook", "role": "On-chain proposal ledger concepts"},
    {"contract": "TwinLedger", "role": "Digital twin balances — no real keys"},
]

SAFETY_LAYERS: List[str] = [
    "Browser-local AI (Transformers.js) for offline teach/scan",
    "Sandbox isolation with kill switch",
    "AI secure wallet holds digital twins only",
    "No auto-broadcast; no seed export",
    "Owner signature required for PRAXIS irreversible steps",
    "REJECT is logged, explainable, and feeds ACADEMY",
]

DEFAULT_AGENTS: List[Dict[str, str]] = [
    {
        "id": "reckless-agent",
        "style": "Max yield + leverage",
        "expect": "REJECT under default constitution",
    },
    {
        "id": "balanced-agent",
        "style": "Conservative inside all bounds",
        "expect": "Often ACCEPT / high score",
    },
    {
        "id": "yield-agent",
        "style": "Vault yield within exposure caps",
        "expect": "ACCEPT if lawbook allows vaults",
    },
    {
        "id": "dust-agent",
        "style": "Small DEX rebalance",
        "expect": "ACCEPT for liquidity hygiene",
    },
]


def nomos_payload(network: str = "monad-testnet") -> Dict[str, Any]:
    """Catalog + doctrine for GET /nomos."""
    eco = get_ecosystem_laws()
    rt = runtime_status()
    return {
        "schema": "thesis.nomos.v1",
        "department": "NOMOS",
        "product": "THESIS Platform",
        "tagline": TAGLINE,
        "doctrine": DOCTRINE,
        "description": (
            "Specialized Company OS department for automated multi-agent proposal "
            "generation combined with an evaluation arena. Rejection is an explicit, "
            "valuable, logged outcome — not a failure. Tightly coupled with the trading "
            "desk: every ticket or proposed action is evaluated as a policy Action."
        ),
        "role_in_company_os": {
            "before": "AGORA generates competitive multi-agent proposals",
            "nomos": "Risk/law overlay, dual-stack policy enforcement, arena arbitration",
            "after": "MATHESIS simulates lawful winners; PRAXIS plans signed execution",
            "workflow": DEPARTMENT_WORKFLOW,
        },
        "dual_law_stack": DUAL_LAW_STACK,
        "ecosystem": {
            "law_count": eco.get("law_count"),
            "embedded_at": eco.get("embedded_at"),
            "domains": list((eco.get("domains") or {}).keys()),
            "runtime": rt,
            "veto_law": "sys.nomos-veto",
        },
        "how_it_works": [
            {
                "step": 1,
                "name": "Proposal generation",
                "detail": (
                    "Specialized agents / departmental AI twins auto-generate plans "
                    "(strategies, missions, build paths) via POST /arena/auto or AGORA."
                ),
            },
            {
                "step": 2,
                "name": "Arena evaluation",
                "detail": (
                    "Plans enter arena: scorecards, simulation, arbitration. "
                    "Desk arena evaluates trade tickets; studio arena evaluates forge plans."
                ),
            },
            {
                "step": 3,
                "name": "Policy & risk gate",
                "detail": (
                    "Owner constitution + ecosystem laws via LawBook / PolicyKernel. "
                    "Invalid or high-risk proposals are rejected with human reasons."
                ),
            },
            {
                "step": 4,
                "name": "Reject is a feature",
                "detail": (
                    "Rejection is deliberate and receipt-sealed. ACADEMY uses failure-first "
                    "labs so operators learn brakes, not just yields."
                ),
            },
            {
                "step": 5,
                "name": "Owner sovereignty",
                "detail": (
                    "Mission Room: approve | reject | simulate_again | revise. "
                    "AI never holds real keys — sandboxed digital twins only."
                ),
            },
            {
                "step": 6,
                "name": "Audit & receipts",
                "detail": "Every material step seals a hash-linked ReceiptChain entry.",
            },
        ],
        "agents": DEFAULT_AGENTS,
        "owner_actions": OWNER_ACTIONS,
        "apis": ARENA_SURFACES,
        "onchain": ONCHAIN,
        "safety": SAFETY_LAYERS,
        "reject_is_a_feature": True,
        "arena_core": {
            "file": "engine/thesis_forge/policy.py",
            "pipeline": ["evaluate", "arbitrate", "arena_report"],
            "rules": rule_catalog(),
        },
        "sla": {
            "id": "nomos",
            "name": "Risk SLA",
            "max_latency_ms": 1000,
            "description": "Hard policy gate under 1s — can veto all",
        },
        "network": network,
        "receipt_tip": tip()[:16] if tip() else None,
        "docs": "docs/NOMOS.md",
        "docs_arena": "docs/NOMOS_ARENA.md",
        "related": {
            "company": "docs/COMPANY_OS.md",
            "laws": "docs/ECOSYSTEM_LAWS.md",
            "platform": "docs/PLATFORM.md",
            "spark": "docs/SPARK.md",
            "arena_impl": "docs/NOMOS_ARENA.md",
        },
    }


def run_nomos_arena(
    request: Optional[BuildRequest] = None,
    policy: Optional[Policy] = None,
) -> Dict[str, Any]:
    """Propose + arbitrate and attach dual-stack metadata for NOMOS UI."""
    req = request or BuildRequest(
        name="NOMOS Arena",
        objective="Coordinate Monad portfolio under dual law stack; reject unlawful paths.",
        categories=["vault", "dex", "lending"],
        network="monad-testnet",
    )
    pol = policy or req.policy
    eco = embed_ecosystem_laws()
    plans = propose_plans(req, pol)
    report = arena_report(plans, pol)
    # Dual stack: map owner-policy violations → LawBook ids + optional ecosystem re-check
    from .lawbook import VIOLATION_TO_LAW
    from .ecosystem_laws import check_proposal_against_ecosystem

    eco_hits = 0
    for row in report.get("evaluations") or []:
        ev = row.get("evaluation") or {}
        action = row.get("action") or {}
        viol = list(ev.get("violations") or [])
        law_ids = [VIOLATION_TO_LAW.get(v, "sys.nomos-veto") for v in viol]
        ok_eco, eco_viol, eco_reasons = check_proposal_against_ecosystem(
            {
                "title": action.get("rationale") or action.get("action") or "",
                "thesis": action.get("rationale") or "",
                "actions": [action],
            },
            network=req.network,
        )
        if not ok_eco:
            eco_hits += 1
            for v in eco_viol:
                if v not in viol:
                    viol.append(v)
                    law_ids.append(v)
            reasons = list(ev.get("reasons") or [])
            for r in eco_reasons:
                if r not in reasons:
                    reasons.append(r)
            ev["reasons"] = reasons
            if viol:
                ev["accepted"] = False
                ev["violations"] = viol
                ev["human_summary"] = (
                    f"REJECTED plan by agent '{action.get('agent')}' "
                    f"(owner + ecosystem): " + "; ".join(reasons or viol)
                )
        ev["lawbook_ids"] = list(dict.fromkeys(law_ids))
        if not ev.get("accepted"):
            ev["layer"] = "dual_stack"
            ev["feature"] = "REJECT"
        else:
            ev["layer"] = "dual_stack_pass"
            ev["feature"] = "ACCEPT"

    # Recompute counts / winner after ecosystem layer
    evals = report.get("evaluations") or []
    n_acc = sum(1 for r in evals if (r.get("evaluation") or {}).get("accepted"))
    n_rej = len(evals) - n_acc
    report["n_accepted"] = n_acc
    report["n_rejected"] = n_rej
    lawful = [
        r
        for r in evals
        if (r.get("evaluation") or {}).get("accepted")
    ]
    if lawful:
        best = max(
            lawful,
            key=lambda r: float((r.get("evaluation") or {}).get("score") or 0),
        )
        report["winner"] = {
            "action": best.get("action"),
            "evaluation": best.get("evaluation"),
        }
    else:
        report["winner"] = None
    # Refresh scoreboard ranks
    board = []
    for r in evals:
        a, e = r.get("action") or {}, r.get("evaluation") or {}
        board.append(
            {
                "agent": a.get("agent"),
                "protocol": a.get("protocol"),
                "category": a.get("category"),
                "accepted": e.get("accepted"),
                "score": e.get("score"),
                "violations": e.get("violations") or [],
                "lawbook_ids": e.get("lawbook_ids") or [],
                "outcome": "ACCEPT" if e.get("accepted") else "REJECT",
            }
        )
    board.sort(key=lambda x: (0 if x["accepted"] else 1, -float(x.get("score") or 0)))
    for i, b in enumerate(board):
        b["rank"] = i + 1
    report["scoreboard"] = board

    receipt = seal(
        "nomos.arena.auto",
        {
            "project": req.name,
            "n_rejected": report["n_rejected"],
            "n_accepted": report["n_accepted"],
            "winner": (report.get("winner") or {}).get("action", {}).get("agent"),
            "ecosystem_law_count": eco.get("law_count"),
            "ecosystem_hits": eco_hits,
        },
    )
    report["receipt"] = receipt
    report["proposed"] = [p.model_dump(mode="json") for p in plans]
    report["department"] = "NOMOS"
    report["tagline"] = TAGLINE
    report["doctrine"] = DOCTRINE
    report["dual_law_stack"] = {
        "owner_policy": pol.model_dump(mode="json"),
        "ecosystem_law_count": eco.get("law_count"),
        "ecosystem_embedded_at": eco.get("embedded_at"),
        "ecosystem_domains": list((eco.get("domains") or {}).keys()),
        "ecosystem_hits": eco_hits,
        "veto_law": "sys.nomos-veto",
        "onchain": "LawBook.sol + PolicyKernel.sol",
    }
    report["reject_is_a_feature"] = True
    report["owner_next"] = (
        "Owner may approve winner path, reject all, simulate_again, or revise laws."
        if report.get("winner")
        else "No lawful winner — dual stack blocked all plans (REJECT is safety)."
    )
    return report


def evaluate_action_dict(action: dict, policy: Optional[Policy] = None) -> Dict[str, Any]:
    pol = policy or Policy()
    a = Action(**action)
    ev = evaluate(a, pol)
    return {
        "action": a.model_dump(mode="json"),
        "evaluation": ev.model_dump(mode="json"),
        "policy": pol.model_dump(mode="json"),
        "reject_is_a_feature": not ev.accepted,
        "doctrine": DOCTRINE,
    }
