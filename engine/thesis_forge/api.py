"""THESIS Forge HTTP API — production workstation surface."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .academy import get_quest, grade_quest, list_quests
from .atlas import all_protocols
from .compiler import compile_manifest, studio_scaffold_files
from .models import (
    AcademyGradeRequest,
    Action,
    ArenaRequest,
    BuildRequest,
    DeploymentRecord,
    Policy,
)
from .network import PILLARS, get_network
from .policy import arena_report, evaluate
from .receipts import recent, seal, tip

app = FastAPI(
    title="THESIS Forge API",
    description="Monad AI Workstation — Studio · Codex · Nomos · Academy",
    version=__version__,
)

_origins = os.environ.get("THESIS_CORS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_ROOT = Path(__file__).resolve().parents[2]
_DEPLOY_PATH = _ROOT / "receipts" / "deployment.json"


def _load_deployment() -> dict[str, Any]:
    if _DEPLOY_PATH.exists():
        try:
            return json.loads(_DEPLOY_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "schema": "thesis.deployment.v1",
        "status": "not_deployed",
        "hint": "Run ./scripts/deploy.sh testnet after funding a deployer on Monad testnet.",
        "primary_submission_address": "",
        "network": "monad-testnet",
        "chainId": 10143,
    }


@app.get("/health")
def health():
    dep = _load_deployment()
    return {
        "status": "operational",
        "product": "THESIS",
        "version": __version__,
        "network_default": "monad-testnet",
        "pillars": PILLARS,
        "receipt_tip": tip()[:16],
        "deployment": {
            "status": dep.get("status", "unknown"),
            "primary_submission_address": dep.get("primary_submission_address")
            or dep.get("contracts", {}).get("SovereignVault", ""),
            "chainId": dep.get("chainId") or dep.get("chain_id"),
        },
        "doctrine": "Agents propose. Laws decide. Receipts remember.",
    }


@app.get("/charter")
def charter_summary():
    return {
        "name": "THESIS — Monad AI Workstation",
        "pillars": PILLARS,
        "problem": (
            "AI + crypto is fast but reckless; ecosystem knowledge is scattered; "
            "tutorials skip failure modes that keep capital safe."
        ),
        "solution": (
            "Studio generates manifests and deploy plans; Codex maps the ecosystem; "
            "Nomos rejects unlawful agent plans; Academy teaches humans and AI by failing safely."
        ),
        "spark": {
            "contract": "SovereignVault",
            "category_hint": "Testnet unless mainnet deployed",
            "repo": "https://github.com/ItsNotAILABS/Monad-Hackaton",
        },
        "charter_path": "CHARTER.md",
    }


@app.get("/networks")
def networks():
    return {
        "testnet": get_network("monad-testnet"),
        "mainnet": get_network("monad-mainnet"),
    }


@app.get("/protocols")
def protocols():
    return [p.model_dump(mode="json") for p in all_protocols()]


@app.get("/pillars")
def pillars():
    return PILLARS


@app.post("/forge")
def forge(request: BuildRequest):
    if not request.categories:
        raise HTTPException(400, "select at least one ecosystem category")
    manifest = compile_manifest(request)
    files = studio_scaffold_files(manifest)
    receipt = seal(
        "studio.build-manifest",
        {
            "project_id": manifest.project_id,
            "manifest_hash": manifest.manifest_hash,
            "network": manifest.network,
            "chain_id": manifest.chain_id,
        },
    )
    return {
        "manifest": manifest.model_dump(mode="json"),
        "scaffold": files,
        "receipt": receipt,
    }


@app.post("/arena")
def arena(body: ArenaRequest):
    if not body.actions:
        raise HTTPException(400, "actions required")
    report = arena_report(body.actions, body.policy)
    receipt = seal(
        "nomos.arena",
        {
            "n_plans": report["n_plans"],
            "n_accepted": report["n_accepted"],
            "n_rejected": report["n_rejected"],
            "winner_agent": (report.get("winner") or {})
            .get("action", {})
            .get("agent"),
        },
    )
    report["receipt"] = receipt
    return report


@app.post("/evaluate")
def evaluate_one(action: Action, policy: Policy = Policy()):
    ev = evaluate(action, policy)
    return {"action": action, "evaluation": ev}


@app.get("/academy/quests")
def academy_quests():
    return {"quests": list_quests(), "doctrine": "Failure-first education."}


@app.get("/academy/quests/{quest_id}")
def academy_quest(quest_id: str):
    q = get_quest(quest_id)
    if not q:
        raise HTTPException(404, "quest not found")
    # hide correct_index from casual peek? show for transparency in hackathon
    return q


@app.post("/academy/grade")
def academy_grade(body: AcademyGradeRequest):
    result = grade_quest(body.quest_id, body.selected_action_index, body.understood)
    if not result.get("ok"):
        raise HTTPException(400, result.get("error", "grade failed"))
    receipt = seal(
        "academy.grade",
        {
            "quest_id": body.quest_id,
            "passed": result["passed"],
            "selected_index": body.selected_action_index,
        },
    )
    result["receipt"] = receipt
    return result


@app.get("/receipts/recent")
def receipts_recent(n: int = 15):
    return {"tip": tip(), "receipts": recent(min(n, 50))}


@app.get("/deployment")
def deployment():
    return _load_deployment()


@app.post("/deployment/record")
def deployment_record(record: DeploymentRecord):
    """Operator records deployed addresses (no private keys)."""
    net = get_network(record.network)
    payload = {
        "schema": "thesis.deployment.v1",
        "status": "recorded",
        "network": record.network,
        "chainId": record.chain_id or net["chain_id"],
        "rpc": net["rpc"],
        "explorer": net["explorer"],
        "primary_submission_address": record.sovereign_vault,
        "contracts": {
            "PolicyKernel": record.policy_kernel,
            "ReceiptChain": record.receipt_chain,
            "AgentRegistry": record.agent_registry,
            "ProposalBook": record.proposal_book,
            "ExecutionRouter": record.execution_router,
            "SovereignVault": record.sovereign_vault,
        },
        "explorer_vault": record.explorer_vault
        or (
            f"{net['explorer']}/address/{record.sovereign_vault}"
            if record.sovereign_vault
            else ""
        ),
        "notes": record.notes,
    }
    _DEPLOY_PATH.parent.mkdir(parents=True, exist_ok=True)
    _DEPLOY_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    receipt = seal("deploy.record", {"vault": record.sovereign_vault, "chain": payload["chainId"]})
    return {"ok": True, "deployment": payload, "receipt": receipt}


@app.get("/demo/pack")
def demo_pack():
    """Curated demo payload for 3-minute Spark video / judges."""
    from .models import Category

    policy = Policy()
    bad = Action(
        agent="reckless",
        category=Category.PERPS,
        protocol="perpl",
        action="open",
        value=5000,
        slippage_bps=900,
        resulting_protocol_exposure_bps=9000,
        resulting_liquid_reserve_bps=100,
        resulting_leverage_bps=50000,
        expected_gain_bps=900,
        risk_bps=400,
        rationale="Max degen",
    )
    good = Action(
        agent="balanced",
        category=Category.VAULT,
        protocol="beefy",
        action="deposit",
        value=100,
        slippage_bps=10,
        resulting_protocol_exposure_bps=1200,
        resulting_liquid_reserve_bps=4000,
        resulting_leverage_bps=10000,
        expected_gain_bps=400,
        risk_bps=60,
        rationale="Lawful vault deposit",
    )
    report = arena_report([bad, good], policy)
    return {
        "script": [
            "0:00 Problem: I won't give agents a blank check on Monad.",
            "0:25 Studio: forge objective → sealed manifest + deploy plan.",
            "1:00 Nomos: show REJECT on reckless plan with reasons.",
            "1:40 Academy: complete slippage or rogue-category lab.",
            "2:20 Explorer: SovereignVault address on Monad testnet.",
            "2:50 Doctrine: agents propose, laws decide, receipts remember.",
        ],
        "arena_preview": report,
        "deployment": _load_deployment(),
        "quests": list_quests()[:3],
    }
