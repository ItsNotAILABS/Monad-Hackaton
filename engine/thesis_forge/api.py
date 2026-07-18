"""THESIS Forge HTTP API — full workstation surface v0.3."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from . import __version__
from .academy import get_quest, grade_quest, list_quests
from .agents import propose_plans
from .atlas import all_protocols, get_protocol
from .codegen import generate_package, package_stats
from .compiler import compile_manifest, studio_scaffold_files
from .events import pipeline_stages
from .models import (
    AcademyGradeRequest,
    Action,
    ArenaRequest,
    BuildRequest,
    DeploymentRecord,
    Policy,
)
from .network import PILLARS, get_network
from .pipeline import run_pipeline
from .policy import arena_report, evaluate
from .receipts import recent, seal, tip
from .rpc_probe import probe_network
from .workspace import list_projects, load_project, save_project

app = FastAPI(
    title="THESIS Forge API",
    description="Monad AI Workstation v0.3 — Studio · Codex · Nomos · Academy · Pipeline",
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
        "hint": "Run ./scripts/deploy.sh testnet after funding a deployer.",
        "primary_submission_address": "",
        "network": "monad-testnet",
        "chainId": 10143,
    }


class PipelineRequest(BuildRequest):
    persist: bool = True


class ProposeRequest(BaseModel):
    request: BuildRequest
    policy: Policy | None = None


class JudgeBundle(BaseModel):
    repo: str = "https://github.com/ItsNotAILABS/Monad-Hackaton"
    hosted_url: str = ""
    demo_video_url: str = ""
    social_post_url: str = ""


# ── Core ──────────────────────────────────────────────────────────


@app.get("/health")
def health():
    dep = _load_deployment()
    return {
        "status": "operational",
        "product": "THESIS",
        "version": __version__,
        "network_default": "monad-testnet",
        "pillars": PILLARS,
        "stages": pipeline_stages(),
        "receipt_tip": tip()[:16],
        "deployment": {
            "status": dep.get("status", "unknown"),
            "primary_submission_address": dep.get("primary_submission_address")
            or (dep.get("contracts") or {}).get("SovereignVault", ""),
            "chainId": dep.get("chainId") or dep.get("chain_id"),
        },
        "endpoints": [
            "/health",
            "/pipeline",
            "/forge",
            "/arena",
            "/agents/propose",
            "/academy/*",
            "/workspace/*",
            "/rpc/probe",
            "/judge",
        ],
        "doctrine": "Agents propose. Laws decide. Receipts remember.",
    }


@app.get("/charter")
def charter_summary():
    return {
        "name": "THESIS — Monad AI Workstation",
        "version": __version__,
        "pillars": PILLARS,
        "stages": pipeline_stages(),
        "problem": (
            "AI + crypto is fast but reckless; ecosystem knowledge is scattered; "
            "tutorials skip failure modes that keep capital safe."
        ),
        "solution": (
            "Full pipeline: intent → map → architecture → policy → codegen → validate → "
            "arena → readiness → (operator) deploy/verify → release receipt. "
            "Academy teaches humans and AI by failing safely."
        ),
        "spark": {
            "contract": "SovereignVault",
            "category_hint": "Testnet unless mainnet deployed",
            "repo": "https://github.com/ItsNotAILABS/Monad-Hackaton",
        },
        "charter_path": "CHARTER.md",
        "explainability": "docs/EXPLAINABILITY_CONTRACT.md",
    }


@app.get("/networks")
def networks():
    return {
        "testnet": get_network("monad-testnet"),
        "mainnet": get_network("monad-mainnet"),
    }


@app.get("/rpc/probe")
def rpc_probe(network: str = Query("monad-testnet")):
    result = probe_network(network)
    seal("rpc.probe", {"network": network, "ok": result.get("ok")})
    return result


@app.get("/protocols")
def protocols():
    return [p.model_dump(mode="json") for p in all_protocols()]


@app.get("/protocols/{protocol_id}")
def protocol_one(protocol_id: str):
    p = get_protocol(protocol_id)
    if not p:
        raise HTTPException(404, "protocol not found")
    return p.model_dump(mode="json")


@app.get("/pillars")
def pillars():
    return PILLARS


@app.get("/stages")
def stages():
    return pipeline_stages()


# ── Studio / Pipeline ─────────────────────────────────────────────


@app.post("/pipeline")
def pipeline(body: PipelineRequest):
    """Full 11-stage build with explainability events + package + arena."""
    if not body.categories:
        raise HTTPException(400, "select at least one ecosystem category")
    result = run_pipeline(body, persist=body.persist)
    return result


@app.post("/forge")
def forge(request: BuildRequest):
    """Lightweight forge (manifest + scaffold). Prefer /pipeline for full product path."""
    if not request.categories:
        raise HTTPException(400, "select at least one ecosystem category")
    manifest = compile_manifest(request)
    files = generate_package(manifest)
    scaffold = studio_scaffold_files(manifest)
    receipt = seal(
        "studio.build-manifest",
        {
            "project_id": manifest.project_id,
            "manifest_hash": manifest.manifest_hash,
            "network": manifest.network,
            "chain_id": manifest.chain_id,
            "n_files": len(files),
        },
    )
    saved = save_project(
        manifest.project_id,
        manifest=manifest.model_dump(mode="json"),
        files=files,
    )
    return {
        "manifest": manifest.model_dump(mode="json"),
        "scaffold": scaffold,
        "files": files,
        "file_stats": package_stats(files),
        "receipt": receipt,
        "workspace": saved,
    }


@app.post("/agents/propose")
def agents_propose(body: ProposeRequest):
    plans = propose_plans(body.request, body.policy or body.request.policy)
    return {
        "n": len(plans),
        "actions": [p.model_dump(mode="json") for p in plans],
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


@app.post("/arena/auto")
def arena_auto(request: BuildRequest):
    """Propose agent plans from objective, then arbitrate under lawbook."""
    plans = propose_plans(request, request.policy)
    report = arena_report(plans, request.policy)
    receipt = seal(
        "nomos.arena.auto",
        {
            "project": request.name,
            "n_rejected": report["n_rejected"],
            "winner": (report.get("winner") or {}).get("action", {}).get("agent"),
        },
    )
    report["receipt"] = receipt
    report["proposed"] = [p.model_dump(mode="json") for p in plans]
    return report


@app.post("/evaluate")
def evaluate_one(action: Action, policy: Policy | None = None):
    pol = policy or Policy()
    ev = evaluate(action, pol)
    return {"action": action, "evaluation": ev, "policy": pol}


# ── Academy ───────────────────────────────────────────────────────


@app.get("/academy/quests")
def academy_quests():
    return {"quests": list_quests(), "doctrine": "Failure-first education."}


@app.get("/academy/quests/{quest_id}")
def academy_quest(quest_id: str):
    q = get_quest(quest_id)
    if not q:
        raise HTTPException(404, "quest not found")
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


@app.post("/academy/curriculum")
def academy_curriculum():
    """Grade all quests with correct answers (smoke / CI helper)."""
    results = []
    for q in list_quests():
        full = get_quest(q["id"])
        assert full
        idx = full["correct_index"]
        results.append(grade_quest(q["id"], idx, understood=True))
    passed = sum(1 for r in results if r.get("passed"))
    return {"passed": passed, "total": len(results), "results": results}


# ── Workspace ─────────────────────────────────────────────────────


@app.get("/workspace/projects")
def workspace_list():
    return {"projects": list_projects()}


@app.get("/workspace/projects/{project_id}")
def workspace_get(project_id: str):
    proj = load_project(project_id)
    if not proj:
        raise HTTPException(404, "project not found")
    return proj


# ── Receipts / deploy / judge ─────────────────────────────────────


@app.get("/receipts/recent")
def receipts_recent(n: int = 25):
    return {"tip": tip(), "receipts": recent(min(n, 100))}


@app.get("/deployment")
def deployment():
    return _load_deployment()


@app.post("/deployment/record")
def deployment_record(record: DeploymentRecord):
    net = get_network(record.network)
    payload = {
        "schema": "thesis.deployment.v1",
        "status": "recorded" if record.sovereign_vault else "not_deployed",
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
    receipt = seal(
        "deploy.record",
        {"vault": record.sovereign_vault, "chain": payload["chainId"]},
    )
    return {"ok": True, "deployment": payload, "receipt": receipt}


@app.get("/judge")
def judge_panel():
    """Compact proof panel for Spark judges / AI judging agent."""
    dep = _load_deployment()
    projects = list_projects()[:5]
    return {
        "schema": "thesis.judge.v1",
        "product": "THESIS — Monad AI Workstation",
        "version": __version__,
        "repo": "https://github.com/ItsNotAILABS/Monad-Hackaton",
        "doctrine": "Agents propose. Laws decide. Receipts remember.",
        "live_api": True,
        "vaporware": False,
        "features": {
            "pipeline_stages": len(pipeline_stages()),
            "academy_quests": len(list_quests()),
            "protocols": len(all_protocols()),
            "contracts": [
                "PolicyKernel",
                "SovereignVault",
                "ReceiptChain",
                "AgentRegistry",
                "ProposalBook",
                "ExecutionRouter",
            ],
        },
        "deployment": dep,
        "recent_projects": projects,
        "receipt_tip": tip(),
        "checklist": {
            "public_github": True,
            "contract_address": bool(
                dep.get("primary_submission_address")
                or (dep.get("contracts") or {}).get("SovereignVault")
            ),
            "hosted_url": "set after deploy web",
            "demo_video": "operator",
            "real_api_paths": [
                "POST /pipeline",
                "POST /arena/auto",
                "POST /academy/grade",
            ],
        },
    }


@app.get("/demo/pack")
def demo_pack():
    from .models import Category

    policy = Policy()
    req = BuildRequest(
        name="Spark Demo Vault",
        objective="Coordinate Monad portfolio under user-owned laws with agent proposals only.",
        categories=[Category.VAULT, Category.DEX, Category.LENDING],
        policy=policy,
    )
    pipe = run_pipeline(req, persist=True)
    return {
        "script": [
            "0:00 Problem: I won't give agents a blank check on Monad.",
            "0:20 STUDIO: Run full pipeline → events + package files.",
            "1:00 NOMOS: Arena auto — show REJECT reasons + winner.",
            "1:40 ACADEMY: Pass slippage lab with understanding checked.",
            "2:10 IDE: Open generated docs/AGENT.md + lawbook.",
            "2:30 CODEX/JUDGE: Explorer vault address when deployed.",
            "2:50 Close: agents propose, laws decide, receipts remember.",
        ],
        "pipeline_preview": {
            "project_id": pipe.get("project_id"),
            "progress": pipe.get("progress"),
            "n_files": pipe.get("file_stats", {}).get("n_files"),
            "arena_rejected": (pipe.get("arena") or {}).get("n_rejected"),
            "receipt": (pipe.get("receipt") or {}).get("receipt_hash", "")[:24],
        },
        "deployment": _load_deployment(),
        "quests": list_quests(),
        "judge": "/judge",
    }


@app.get("/events/stream-demo")
def events_stream_demo():
    """NDJSON-ish stream sample for agent view (single shot stream)."""

    def gen():
        for stage in pipeline_stages():
            line = json.dumps({"type": "stage", **stage}) + "\n"
            yield line

    return StreamingResponse(gen(), media_type="application/x-ndjson")
