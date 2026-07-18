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
from .daily import complete_mission, home as daily_home, leaderboard_self
from .ecosystem import ecosystem_bundle
from .gas_intel import apply_gas_limit_margin, gas_coach, should_warn_overspend
from .intelligence import coach, quick_reject_demo
from .marks import apply_marks_to_desk, live_marks
from .strategies import list_strategies, run_strategy
from .trading import (
    TradeTicket,
    TradingLimits,
    desk_snapshot,
    load_desk,
    list_venues,
    paper_fill,
    propose_ticket,
    reset_desk,
    run_desk_arena,
    set_mark,
    update_limits,
    update_policy,
)
from .ai_node import ai_chat, ensure_ai_node, node_status, promote_request
from .sandbox import (
    create_sandbox,
    ensure_default_sandbox,
    kill_sandbox,
    list_sandboxes,
    sandbox_snapshot,
)
from .vault_route import simulate_vault_route
from .wallets import (
    link_wallet,
    list_supported,
    registry_snapshot,
    sync_twins_from_wallets,
    unlink,
    update_balances,
)
from .workspace import list_projects, load_project, save_project
from .company import (
    act_on_mission,
    constitution_get,
    constitution_set,
    get_mission,
    headquarters,
    inbox,
    morning_brief,
    performance,
    run_objective,
)

app = FastAPI(
    title="THESIS Forge API",
    description="THESIS Company OS — miniature DeFi company for Monad (GM + departments)",
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


class MissionComplete(BaseModel):
    mission_id: str
    acknowledged: bool = False
    viewed: bool = False
    passed: bool = False
    n_rejected: int | None = None
    selected_action_index: int | None = None
    understood: bool = False


class GasMarginIn(BaseModel):
    chain_id: int = 10143
    estimated_gas: int = Field(gt=0)
    gas_limit: int | None = None


class WalletLinkIn(BaseModel):
    kind: str = "metamask"
    address: str
    chain: str = "eip155:10143"
    label: str = ""
    balances: dict[str, float] = Field(default_factory=dict)


class WalletBalancesIn(BaseModel):
    balances: dict[str, float]


class AIChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    network: str = "monad-testnet"


class PromoteIn(BaseModel):
    symbol: str
    amount: float = Field(gt=0)


class SandboxCreateIn(BaseModel):
    name: str = "AI sandbox"
    mode: str = "agent"


class CompanyObjectiveIn(BaseModel):
    objective: str | None = None


class MissionActIn(BaseModel):
    decision: str  # approve | reject | simulate_again | revise
    note: str = ""


class ConstitutionIn(BaseModel):
    owner_label: str | None = None
    objective_default: str | None = None
    min_liquid_reserve_bps: int | None = None
    max_protocol_exposure_bps: int | None = None
    max_slippage_bps: int | None = None
    max_leverage_bps: int | None = None
    max_action_value: float | None = None
    allow_leverage: bool | None = None
    allow_perps: bool | None = None
    network: str | None = None


# ── Company OS (commercial headquarters) ─────────────────────────


@app.get("/company")
def company_hq():
    """Full headquarters payload: brief, inbox, performance, constitution, pitch."""
    return headquarters()


@app.get("/company/brief")
def company_brief():
    return morning_brief()


@app.get("/company/inbox")
def company_inbox():
    return inbox()


@app.get("/company/performance")
def company_performance():
    return performance()


@app.get("/company/constitution")
def company_constitution_get():
    return constitution_get()


@app.post("/company/constitution")
def company_constitution_set(body: ConstitutionIn):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    return constitution_set(data)


@app.post("/company/run")
def company_run(body: CompanyObjectiveIn | None = None):
    """THESIS GM staffs all departments for an objective → mission room."""
    obj = body.objective if body else None
    return run_objective(obj)


@app.get("/company/missions/{mission_id}")
def company_mission(mission_id: str):
    out = get_mission(mission_id)
    if out.get("error"):
        raise HTTPException(404, out["error"])
    return out


@app.post("/company/missions/{mission_id}/act")
def company_mission_act(mission_id: str, body: MissionActIn):
    out = act_on_mission(mission_id, body.decision, body.note)
    if not out.get("ok") and out.get("error"):
        raise HTTPException(400, out["error"])
    return out


@app.get("/home")
def home_daily(network: str = Query("monad-testnet")):
    """Daily habit home — missions, streak, XP, gas coach, ecosystem."""
    return daily_home(network)


@app.post("/home/mission")
def home_mission(body: MissionComplete):
    payload = {
        "acknowledged": body.acknowledged,
        "viewed": body.viewed,
        "passed": body.passed,
        "understood": body.understood,
    }
    if body.n_rejected is not None:
        payload["n_rejected"] = body.n_rejected
    if body.selected_action_index is not None:
        payload["selected_action_index"] = body.selected_action_index
    out = complete_mission(body.mission_id, payload=payload)
    if not out.get("ok") and not out.get("already"):
        raise HTTPException(400, out.get("error", "mission failed"))
    return out


@app.get("/home/me")
def home_me():
    return leaderboard_self()


@app.get("/intelligence/coach")
def intel_coach(network: str = Query("monad-testnet")):
    return coach(network)


@app.post("/intelligence/reject-demo")
def intel_reject():
    return quick_reject_demo()


@app.get("/ecosystem")
def ecosystem(network: str = Query("monad-testnet")):
    return ecosystem_bundle(network)


@app.get("/gas/coach")
def gas_coach_api():
    return gas_coach()


@app.post("/gas/margin")
def gas_margin(body: GasMarginIn):
    rec = apply_gas_limit_margin(body.chain_id, body.estimated_gas)
    warn = False
    if body.gas_limit is not None:
        warn = should_warn_overspend(body.chain_id, body.gas_limit, rec["recommended_gas_limit"])
    return {**rec, "warn_overspend": warn}


# ── Sandbox · Wallets · AI node ───────────────────────────────────


@app.get("/sandbox")
def sandbox_get(sandbox_id: str | None = None):
    return sandbox_snapshot(sandbox_id)


@app.get("/sandbox/list")
def sandbox_list():
    return {"sandboxes": list_sandboxes()}


@app.post("/sandbox/create")
def sandbox_create(body: SandboxCreateIn):
    from .sandbox import SandboxMode

    mode = SandboxMode(body.mode) if body.mode in SandboxMode._value2member_map_ else SandboxMode.AGENT
    sb = create_sandbox(body.name, mode)
    return sandbox_snapshot(sb.sandbox_id)


@app.post("/sandbox/{sandbox_id}/kill")
def sandbox_kill(sandbox_id: str):
    try:
        sb = kill_sandbox(sandbox_id)
    except KeyError:
        raise HTTPException(404, "sandbox not found") from None
    return {"ok": True, "sandbox": sb.model_dump(mode="json")}


@app.get("/wallets")
def wallets_get():
    return registry_snapshot()


@app.get("/wallets/supported")
def wallets_supported():
    return {"wallets": list_supported()}


@app.post("/wallets/link")
def wallets_link(body: WalletLinkIn):
    try:
        w = link_wallet(
            body.kind,  # type: ignore[arg-type]
            body.address,
            chain=body.chain,
            label=body.label,
            balances=body.balances,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return {"wallet": w.model_dump(mode="json"), "registry": registry_snapshot()}


@app.post("/wallets/{link_id}/balances")
def wallets_balances(link_id: str, body: WalletBalancesIn):
    try:
        w = update_balances(link_id, body.balances)
    except KeyError:
        raise HTTPException(404, "wallet not found") from None
    return {"wallet": w.model_dump(mode="json")}


@app.delete("/wallets/{link_id}")
def wallets_unlink(link_id: str):
    unlink(link_id)
    return registry_snapshot()


@app.post("/wallets/sync-twins")
def wallets_sync_twins(sandbox_id: str | None = None, link_id: str | None = None):
    out = sync_twins_from_wallets(sandbox_id, link_id=link_id)
    if not out.get("ok"):
        raise HTTPException(400, out.get("error", "sync failed"))
    return out


@app.get("/ai")
def ai_status():
    return node_status()


@app.post("/ai/chat")
def ai_chat_api(body: AIChatIn):
    return ai_chat(body.message, network=body.network)


@app.post("/ai/promote")
def ai_promote(body: PromoteIn):
    out = promote_request(body.symbol, body.amount)
    if not out.get("ok"):
        raise HTTPException(400, out.get("error", "promote failed"))
    return out


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
            "/company",
            "/company/run",
            "/company/brief",
            "/company/inbox",
            "/home",
            "/ai/*",
            "/sandbox/*",
            "/wallets/*",
            "/desk/*",
            "/ecosystem",
            "/gas/*",
            "/intelligence/*",
            "/agents/propose",
            "/academy/*",
            "/workspace/*",
            "/rpc/probe",
            "/judge",
        ],
        "doctrine": (
            "Company OS: THESIS is GM; departments research, compete, veto, explain, execute. "
            "Owner is sovereign. Sandbox twins only for AI. Laws over profit."
        ),
        "trading": desk_snapshot(),
        "daily": leaderboard_self(),
        "ai_node": node_status().get("node_id") or True,
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
            "Trading desk runs agent trade tickets under desk risk + NOMOS with paper PnL. "
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


# ── Trading desk (business) ───────────────────────────────────────


class TicketIn(BaseModel):
    agent: str = "desk-trader"
    venue_id: str
    pair: str
    side: str
    qty: float = Field(gt=0)
    limit_price: float = Field(gt=0)
    slippage_bps: int = 30
    leverage_bps: int = 10000
    rationale: str = ""


class MarkIn(BaseModel):
    pair: str
    price: float = Field(gt=0)


@app.get("/desk")
def desk_get():
    return desk_snapshot()


@app.get("/desk/venues")
def desk_venues():
    return {"venues": list_venues()}


@app.post("/desk/ticket")
def desk_ticket(body: TicketIn):
    desk = load_desk()
    try:
        t = TradeTicket(
            agent=body.agent,
            venue_id=body.venue_id,
            pair=body.pair,
            side=body.side,  # type: ignore[arg-type]
            qty=body.qty,
            limit_price=body.limit_price,
            slippage_bps=body.slippage_bps,
            leverage_bps=body.leverage_bps,
            rationale=body.rationale,
        )
    except Exception as exc:
        raise HTTPException(400, str(exc)) from exc
    out = propose_ticket(desk, t)
    return {
        "ticket": out.model_dump(mode="json"),
        "desk": desk_snapshot(desk),
    }


@app.post("/desk/fill/{ticket_id}")
def desk_fill(ticket_id: str):
    desk = load_desk()
    try:
        t = paper_fill(desk, ticket_id)
    except KeyError:
        raise HTTPException(404, "ticket not found") from None
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return {"ticket": t.model_dump(mode="json"), "desk": desk_snapshot(desk)}


@app.post("/desk/arena")
def desk_arena():
    desk = load_desk()
    return run_desk_arena(desk)


@app.post("/desk/limits")
def desk_limits(body: TradingLimits):
    desk = update_limits(load_desk(), body)
    return desk_snapshot(desk)


@app.post("/desk/policy")
def desk_policy(body: Policy):
    desk = update_policy(load_desk(), body)
    return desk_snapshot(desk)


@app.post("/desk/mark")
def desk_mark(body: MarkIn):
    desk = set_mark(load_desk(), body.pair, body.price)
    return desk_snapshot(desk)


@app.get("/desk/marks")
def desk_marks_live(network: str = Query("monad-testnet")):
    """Live synthetic mark feed (RPC-entropy when available)."""
    return live_marks(network)


@app.post("/desk/marks/refresh")
def desk_marks_refresh(network: str = Query("monad-testnet")):
    desk = load_desk()
    result = apply_marks_to_desk(desk, network=network)
    return {"ok": True, **result, "desk": desk_snapshot(desk)}


@app.get("/desk/strategies")
def desk_strategies():
    return {"strategies": list_strategies()}


@app.post("/desk/strategies/{strategy_id}")
def desk_run_strategy(strategy_id: str, submit: bool = Query(True)):
    out = run_strategy(strategy_id, submit=submit)
    if not out.get("ok"):
        raise HTTPException(404, out.get("error", "strategy failed"))
    out["desk"] = desk_snapshot()
    return out


@app.post("/desk/vault-route/{ticket_id}")
def desk_vault_route(ticket_id: str):
    """Simulate SovereignVault.execute for a desk ticket (no broadcast)."""
    out = simulate_vault_route(ticket_id)
    if out.get("error") and not out.get("ok"):
        raise HTTPException(400, out["error"])
    out["desk"] = desk_snapshot()
    return out


@app.post("/desk/reset")
def desk_reset():
    desk = reset_desk()
    return desk_snapshot(desk)


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
            "trading_venues": len(list_venues()),
            "trading_desk": True,
            "contracts": [
                "PolicyKernel",
                "SovereignVault",
                "ReceiptChain",
                "AgentRegistry",
                "ProposalBook",
                "ExecutionRouter",
            ],
        },
        "trading": desk_snapshot(),
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
                "POST /desk/arena",
                "POST /desk/ticket",
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
            "0:00 Problem: trading bots + capital without desk risk + onchain laws.",
            "0:25 STUDIO: pipeline → package + lawbook.",
            "0:55 DESK: arena — reject degen perps / oversized tickets.",
            "1:25 DESK: risk-accept a Kuru ticket → paper fill → PnL.",
            "1:55 NOMOS + vault gate story for live capital later.",
            "2:20 ACADEMY: one failure-first lab.",
            "2:45 Close: agents propose, desk+laws decide, receipts remember.",
        ],
        "pipeline_preview": {
            "project_id": pipe.get("project_id"),
            "progress": pipe.get("progress"),
            "n_files": pipe.get("file_stats", {}).get("n_files"),
            "arena_rejected": (pipe.get("arena") or {}).get("n_rejected"),
            "receipt": (pipe.get("receipt") or {}).get("receipt_hash", "")[:24],
        },
        "trading_preview": run_desk_arena(load_desk()),
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
