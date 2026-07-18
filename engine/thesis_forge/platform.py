"""THESIS Platform kernel — not a pitch deck.

A platform is:
  1. Shared primitives every app can use (identity, law, capital, market, intel, forge)
  2. An app registry (first-party + forged packages)
  3. A runtime that invokes apps under the same lawbook
  4. Receipts for material acts

Competition/judge packs are optional views *on top of* the platform.
They are not the product.
"""

from __future__ import annotations

import time
from typing import Any, Callable, Dict, List, Optional

from . import __version__
from .academy import list_quests
from .ai_node import ai_chat, node_status
from .company.os import headquarters, morning_brief, run_objective
from .daily import home as daily_home
from .ecosystem_laws import embed_ecosystem_laws, enforce_on_department, runtime_status
from .gas_intel import gas_coach
from .marks import live_marks
from .receipts import recent, seal, tip
from .trading import desk_snapshot, load_desk, run_desk_arena
from .vault_route import simulate_vault_route
from .wallets import registry_snapshot, sync_twins_from_wallets
from .workspace import list_projects, load_project


def _cloud_pipeline(network: str = "monad-testnet", query: str = "", address: str = "", estimated_gas: int = 80_000, **_k):
    from .engines.orchestrator import run_cloud_pipeline

    return run_cloud_pipeline(
        network,
        address=address or "",
        query=query or "",
        estimated_gas=int(estimated_gas or 80_000),
    )


def _system_run(network: str = "monad-testnet", **kw):
    from .unified import run_system

    allowed = {
        "objective",
        "query",
        "address",
        "estimated_gas",
        "run_company",
        "run_desk",
        "run_cloud",
        "run_vault_route",
    }
    return run_system(network, **{k: v for k, v in kw.items() if k in allowed})


def _system_status(network: str = "monad-testnet", **_k):
    from .unified import system_status

    return system_status(network)


def _vault_address() -> str:
    try:
        from .vault_route import _load_vault_address

        return _load_vault_address() or ""
    except Exception:
        return ""


# ── Primitive definitions (what every app stands on) ──────────────

PRIMITIVES: Dict[str, Dict[str, Any]] = {
    "identity": {
        "id": "identity",
        "name": "Identity",
        "role": "Linked wallets — public address + attested balances only",
        "api": ["/wallets", "/wallets/link", "/wallets/sync-twins"],
        "laws": ["sys.no-real-keys", "sys.sandbox-first"],
        "status_fn": "wallets",
    },
    "law": {
        "id": "law",
        "name": "Law",
        "role": "Owner constitution + runtime ecosystem lawbook",
        "api": ["/laws", "/laws/full", "/company/constitution", "/evaluate"],
        "laws": ["sys.nomos-veto", "sys.owner-sovereign"],
        "status_fn": "laws",
    },
    "capital": {
        "id": "capital",
        "name": "Capital gate",
        "role": "SovereignVault + policy-gated execute simulation",
        "api": ["/desk/vault-route/{id}", "/deployment"],
        "laws": ["exec.no-silent-broadcast", "sys.mandatory-simulation"],
        "status_fn": "vault",
    },
    "market": {
        "id": "market",
        "name": "Market",
        "role": "Trading desk, marks, strategies, venues",
        "api": ["/desk", "/desk/arena", "/desk/marks", "/desk/strategies/{id}"],
        "laws": ["intel.explain-rejects", "proto.category-gate"],
        "status_fn": "desk",
    },
    "intel": {
        "id": "intel",
        "name": "Intelligence",
        "role": "AI node + sandbox twins (no real keys)",
        "api": ["/ai", "/ai/chat", "/sandbox"],
        "laws": ["sys.sandbox-first", "sys.no-real-keys"],
        "status_fn": "ai",
    },
    "forge": {
        "id": "forge",
        "name": "Forge",
        "role": "Pipeline → package → workspace apps",
        "api": ["/pipeline", "/workspace/projects", "/forge"],
        "laws": ["sys.receipt-every-material-act", "sys.adapter-honesty"],
        "status_fn": "forge",
    },
    "company": {
        "id": "company",
        "name": "Company OS",
        "role": "GM + departments staffed under dual law stacks",
        "api": ["/company", "/company/run", "/company/missions/{id}/act"],
        "laws": ["sys.owner-sovereign", "intel.compete-plans"],
        "status_fn": "company",
    },
    "learn": {
        "id": "learn",
        "name": "Learn",
        "role": "Academy + daily seatbelt (teach on action)",
        "api": ["/academy/*", "/home", "/intelligence/coach"],
        "laws": ["intel.teach-on-action"],
        "status_fn": "learn",
    },
    "local_ai": {
        "id": "local_ai",
        "name": "Local AI",
        "role": "Browser Transformers.js · memory · security · KG · research · docs",
        "api": ["browser://local-ai", "GET /platform (manifest only)"],
        "laws": ["sys.no-real-keys", "sys.sandbox-first", "intel.no-hallucinated-apy"],
        "status_fn": "local_ai",
    },
    "cloud": {
        "id": "cloud",
        "name": "Cloud engines",
        "role": "Server-side engines on the hosted API: chain RPC, gas, law, research, index, docs",
        "api": ["/engines", "/engines/{id}/run", "/engines/pipeline"],
        "laws": ["sys.no-real-keys", "monad.gas-bills-limit", "intel.no-hallucinated-apy"],
        "status_fn": "cloud",
    },
}


# First-party platform apps (the product surface — not demos)
FIRST_PARTY_APPS: List[Dict[str, Any]] = [
    {
        "id": "app.shell",
        "name": "Platform shell",
        "kind": "system",
        "tab": "live",
        "primitives": ["identity", "law", "market", "capital", "intel", "forge", "company", "learn"],
        "description": "Operator shell — status of every primitive and installed app",
        "entry": "GET /platform",
        "actions": ["status", "health"],
    },
    {
        "id": "app.wallets",
        "name": "Wallets",
        "kind": "identity",
        "tab": "ai",
        "primitives": ["identity", "intel"],
        "description": "Link Phantom/MetaMask/watch-only; sync public balances into twins",
        "entry": "GET /wallets",
        "actions": ["list", "link", "sync_twins"],
    },
    {
        "id": "app.desk",
        "name": "Trading desk",
        "kind": "market",
        "tab": "desk",
        "primitives": ["market", "law", "capital"],
        "description": "Tickets, arena, paper PnL — rejects are first-class",
        "entry": "GET /desk",
        "actions": ["snapshot", "arena", "ticket", "vault_route"],
    },
    {
        "id": "app.vault",
        "name": "SovereignVault",
        "kind": "capital",
        "tab": "desk",
        "primitives": ["capital", "law"],
        "description": "Policy-gated execute path (simulate first, owner signs later)",
        "entry": "POST /desk/vault-route/{ticket_id}",
        "actions": ["route_sim", "deployment"],
    },
    {
        "id": "app.ai",
        "name": "AI node",
        "kind": "intel",
        "tab": "ai",
        "primitives": ["intel", "identity", "law"],
        "description": "Sandbox AI with twin wallet — cannot export keys or auto-broadcast",
        "entry": "GET /ai",
        "actions": ["status", "chat", "promote_request"],
    },
    {
        "id": "app.company",
        "name": "Company HQ",
        "kind": "company",
        "tab": "hq",
        "primitives": ["company", "law", "market", "learn"],
        "description": "Staff departments on one objective under constitution + ecosystem laws",
        "entry": "POST /company/run",
        "actions": ["hq", "run", "act"],
    },
    {
        "id": "app.studio",
        "name": "Studio forge",
        "kind": "forge",
        "tab": "studio",
        "primitives": ["forge", "law"],
        "description": "11-stage pipeline emits installable app packages into the workspace",
        "entry": "POST /pipeline",
        "actions": ["pipeline", "list_projects", "open_project"],
    },
    {
        "id": "app.academy",
        "name": "Academy",
        "kind": "learn",
        "tab": "academy",
        "primitives": ["learn", "law"],
        "description": "Failure-first labs that attach to live rejects",
        "entry": "GET /academy/quests",
        "actions": ["list_quests", "grade"],
    },
    {
        "id": "app.daily",
        "name": "Daily seatbelt",
        "kind": "learn",
        "tab": "home",
        "primitives": ["learn", "market", "law"],
        "description": "Missions, XP, streak, gas coach — habit loop on the platform",
        "entry": "GET /home",
        "actions": ["home", "complete_mission"],
    },
    {
        "id": "app.nomos",
        "name": "NOMOS arena",
        "kind": "law",
        "tab": "nomos",
        "primitives": ["law", "market"],
        "description": "Multi-agent propose + policy arbitration",
        "entry": "POST /arena/auto",
        "actions": ["arena"],
    },
    {
        "id": "app.local_ai",
        "name": "Local AI",
        "kind": "local_ai",
        "tab": "local",
        "primitives": ["local_ai", "intel", "law", "learn"],
        "description": (
            "Browser environment: Transformers.js (custom models), IndexedDB memory, "
            "security scan + teach curriculum, knowledge graph, research agents, "
            "PDF/Excel/Markdown export, packaged security extension download"
        ),
        "entry": "browser://local-ai",
        "actions": ["status"],
        "locality": "browser-only",
    },
    {
        "id": "app.cloud",
        "name": "Cloud engines",
        "kind": "cloud",
        "tab": "cloud",
        "primitives": ["cloud", "law", "market", "capital"],
        "description": (
            "Real server-side engines for the hosted web app: Monad RPC pulse, gas coach, "
            "law enforcement, research brief, package index, document export, security scan"
        ),
        "entry": "POST /engines/pipeline",
        "actions": ["pipeline", "run"],
        "locality": "cloud",
    },
]


def _primitive_status(network: str = "monad-testnet") -> Dict[str, Any]:
    laws = runtime_status()
    wallets = registry_snapshot()
    desk = desk_snapshot()
    ai = node_status()
    vault_addr = _vault_address()
    projects = list_projects()
    home = daily_home(network)
    try:
        hq = headquarters()
    except Exception:
        hq = {}

    return {
        "identity": {
            "ok": True,
            "linked": len(wallets.get("links") or []),
            "primary": wallets.get("primary_id"),
            "stores_keys": (wallets.get("security") or {}).get("stores_private_keys") is True,
        },
        "law": {
            "ok": int(laws.get("law_count") or 0) >= 15,
            "law_count": laws.get("law_count"),
            "domains": laws.get("domains"),
            "embedded": laws.get("embedded"),
        },
        "capital": {
            "ok": True,  # sim path always available; deploy optional
            "vault": vault_addr or None,
            "deployed": bool(vault_addr),
            "route_api": "POST /desk/vault-route/{ticket_id}",
        },
        "market": {
            "ok": True,
            "equity": desk.get("equity"),
            "cash": desk.get("cash_usdc"),
            "day_pnl": desk.get("day_pnl"),
            "tickets": len(desk.get("tickets_recent") or []),
            "paper_mode": desk.get("paper_mode"),
        },
        "intel": {
            "ok": ai.get("online") is True,
            "real_key_access": (ai.get("capabilities") or {}).get("real_key_access"),
            "node_id": (ai.get("node") or {}).get("node_id"),
            "sandbox_id": (ai.get("node") or {}).get("sandbox_id"),
        },
        "forge": {
            "ok": True,
            "installed_packages": len(projects),
            "projects_preview": [
                {
                    "project_id": p.get("project_id"),
                    "n_files": p.get("n_files"),
                    "network": p.get("network"),
                }
                for p in projects[:8]
            ],
        },
        "company": {
            "ok": True,
            "inbox": len(hq.get("inbox") or []) if isinstance(hq.get("inbox"), list) else 0,
            "pitch": (hq.get("pitch") or {}).get("one_liner"),
        },
        "learn": {
            "ok": bool(home.get("missions")),
            "xp": home.get("xp"),
            "level": home.get("level"),
            "streak": home.get("streak"),
            "quests": len(list_quests()),
        },
        "local_ai": {
            "ok": True,
            "locality": "browser-only",
            "engine": "transformers.js",
            "model": "Xenova/all-MiniLM-L6-v2",
            "capabilities": [
                "feature-extraction",
                "custom-models",
                "local-memory",
                "security-monitor",
                "security-teach",
                "knowledge-graph",
                "research-agents",
                "pdf-excel-markdown",
                "extension-package",
            ],
            "tab": "local",
            "note": "Runtime lives in the browser app — server only advertises the surface",
        },
        "cloud": {
            "ok": True,
            "locality": "cloud",
            "engines": [
                "chain",
                "gas",
                "law",
                "research",
                "index",
                "docs",
                "security",
            ],
            "api": "/engines",
            "pipeline": "/engines/pipeline",
            "tab": "cloud",
            "note": "Runs on API host; talks to Monad RPC + platform modules",
        },
    }


def _forged_apps() -> List[Dict[str, Any]]:
    """Workspace packages installed as platform apps."""
    out = []
    for p in list_projects()[:40]:
        pid = p.get("project_id") or p.get("id")
        if not pid:
            continue
        out.append(
            {
                "id": f"pkg.{pid}",
                "name": p.get("name") or pid,
                "kind": "forged",
                "tab": "ide",
                "primitives": ["forge", "law", "capital"],
                "description": f"Forged package · {p.get('n_files') or '?'} files · {p.get('network') or 'monad'}",
                "entry": f"GET /workspace/projects/{pid}",
                "actions": ["open", "inspect"],
                "project_id": pid,
                "meta": {
                    "n_files": p.get("n_files"),
                    "network": p.get("network"),
                    "chain_id": p.get("chain_id"),
                    "saved_at": p.get("saved_at"),
                },
            }
        )
    return out


def list_apps(*, include_forged: bool = True) -> List[Dict[str, Any]]:
    apps = [dict(a) for a in FIRST_PARTY_APPS]
    if include_forged:
        apps.extend(_forged_apps())
    return apps


def get_app(app_id: str) -> Optional[Dict[str, Any]]:
    for a in list_apps():
        if a["id"] == app_id or a.get("project_id") == app_id:
            return a
    return None


def _invoke_handlers() -> Dict[str, Callable[..., Dict[str, Any]]]:
    def status(**_kw):
        return platform_status(_kw.get("network") or "monad-testnet")

    def health(**_kw):
        return {"ok": True, "version": __version__, "tip": tip()[:16]}

    def wallets_list(**_kw):
        return registry_snapshot()

    def wallets_sync(**_kw):
        return sync_twins_from_wallets()

    def desk_snapshot_fn(**_kw):
        return desk_snapshot()

    def desk_arena(**_kw):
        return run_desk_arena(load_desk())

    def vault_route(ticket_id: str = "", **_kw):
        if not ticket_id:
            desk = desk_snapshot()
            for t in desk.get("tickets_recent") or []:
                if t.get("status") in ("risk_accepted", "paper_filled", "routed_sim"):
                    ticket_id = t["ticket_id"]
                    break
        if not ticket_id:
            return {"ok": False, "error": "no routable ticket — run desk arena first"}
        return simulate_vault_route(ticket_id)

    def ai_status(**_kw):
        return node_status()

    def ai_chat_fn(message: str = "platform status and gas tip", network: str = "monad-testnet", **_kw):
        return ai_chat(message, network=network)

    def company_hq(**_kw):
        return headquarters()

    def company_run(objective: str = "", network: str = "monad-testnet", **_kw):
        obj = objective or (
            "Grow my Monad position, keep 30% liquid, avoid leverage, and teach me what is happening."
        )
        return run_objective(obj)

    def forge_list(**_kw):
        return {"projects": list_projects()[:20]}

    def forge_open(project_id: str = "", **_kw):
        if not project_id:
            projs = list_projects()
            if not projs:
                return {"ok": False, "error": "no forged packages — run studio pipeline"}
            project_id = projs[0].get("project_id")
        data = load_project(project_id)
        if not data:
            return {"ok": False, "error": f"project {project_id} not found"}
        return {"ok": True, "project": data, "n_files": len(data.get("files") or {})}

    def academy_list(**_kw):
        return {"quests": list_quests()}

    def daily_home_fn(network: str = "monad-testnet", **_kw):
        return daily_home(network)

    def laws_status(**_kw):
        return runtime_status()

    def enforce(department: str = "THESIS", **kw):
        return enforce_on_department(department, kw.get("context") or {"network": kw.get("network") or "monad-testnet"})

    return {
        ("app.shell", "status"): status,
        ("app.shell", "health"): health,
        ("app.wallets", "list"): wallets_list,
        ("app.wallets", "sync_twins"): wallets_sync,
        ("app.desk", "snapshot"): desk_snapshot_fn,
        ("app.desk", "arena"): desk_arena,
        ("app.desk", "vault_route"): vault_route,
        ("app.vault", "route_sim"): vault_route,
        ("app.vault", "deployment"): lambda **_k: {"vault": _vault_address() or None},
        ("app.ai", "status"): ai_status,
        ("app.ai", "chat"): ai_chat_fn,
        ("app.company", "hq"): company_hq,
        ("app.company", "run"): company_run,
        ("app.studio", "list_projects"): forge_list,
        ("app.studio", "open_project"): forge_open,
        ("app.academy", "list_quests"): academy_list,
        ("app.daily", "home"): daily_home_fn,
        ("app.nomos", "arena"): desk_arena,  # desk arena is the live reject surface
        ("app.cloud", "pipeline"): _cloud_pipeline,
        ("app.cloud", "run"): _system_run,
        ("app.shell", "system"): _system_status,
        ("app.shell", "run"): _system_run,
    }


def invoke_app(
    app_id: str,
    action: str,
    *,
    network: str = "monad-testnet",
    params: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Run an app action under the platform (laws embedded, receipt sealed)."""
    t0 = time.time()
    embed_ecosystem_laws()
    app = get_app(app_id)
    if not app:
        return {"ok": False, "error": f"unknown app {app_id}"}

    # Forged packages: open is the primary action
    if app.get("kind") == "forged":
        if action in ("open", "inspect", "open_project"):
            data = load_project(app.get("project_id") or "")
            if not data:
                return {"ok": False, "error": "package missing"}
            seal("platform.invoke", {"app": app_id, "action": action})
            return {
                "ok": True,
                "app_id": app_id,
                "action": action,
                "result": {"project_id": app.get("project_id"), "n_files": len(data.get("files") or {})},
                "elapsed_ms": (time.time() - t0) * 1000,
            }
        return {"ok": False, "error": f"forged app supports open/inspect only, not {action}"}

    handlers = _invoke_handlers()
    key = (app_id, action)
    # allow short action aliases
    fn = handlers.get(key)
    if not fn:
        # try first matching action name across app
        for (aid, act), f in handlers.items():
            if aid == app_id and act == action:
                fn = f
                break
    if not fn:
        return {
            "ok": False,
            "error": f"action {action} not registered for {app_id}",
            "available": app.get("actions"),
        }

    params = dict(params or {})
    params.setdefault("network", network)
    try:
        result = fn(**params)
    except TypeError:
        # strip unknown kwargs for strict handlers
        result = fn()
    except Exception as exc:
        return {"ok": False, "error": str(exc), "app_id": app_id, "action": action}

    # Law consult stamp
    law_stamp = enforce_on_department(
        "THESIS",
        {
            "network": network,
            "proposal": {
                "title": f"platform invoke {app_id}.{action}",
                "actions": [],
            },
        },
    )
    seal(
        "platform.invoke",
        {
            "app": app_id,
            "action": action,
            "laws_consulted": law_stamp.get("laws_consulted"),
        },
    )
    return {
        "ok": True,
        "schema": "thesis.platform.invoke.v1",
        "app_id": app_id,
        "action": action,
        "result": result,
        "law": {
            "ok": law_stamp.get("ok"),
            "laws_consulted": law_stamp.get("laws_consulted"),
            "sample": law_stamp.get("law_ids_sample"),
        },
        "elapsed_ms": (time.time() - t0) * 1000,
    }


def platform_status(network: str = "monad-testnet") -> Dict[str, Any]:
    """Kernel status — the real platform surface."""
    t0 = time.time()
    embed_ecosystem_laws()
    prim = _primitive_status(network)
    apps = list_apps(include_forged=True)
    first_party = [a for a in apps if a.get("kind") != "forged"]
    forged = [a for a in apps if a.get("kind") == "forged"]

    # health of primitives
    prim_ok = sum(1 for v in prim.values() if v.get("ok"))
    prim_total = len(prim)

    marks = live_marks(network)
    gas = gas_coach(int(time.time()) // 3600)
    brief = morning_brief()

    return {
        "schema": "thesis.platform.v1",
        "product": "THESIS Platform",
        "version": __version__,
        "what_this_is": (
            "A Monad DeFi platform hosted as a web app: shared primitives, first-party apps, "
            "cloud engines on the API host (chain/gas/law/research/index/docs), and browser-local AI. "
            "Onchain contracts live on Monad; the UI is the headquarters."
        ),
        "doctrine": (
            "Apps share one lawbook. Cloud engines hit real Monad RPC. "
            "Agents propose. Laws decide. Owner signs. Receipts remember. Never keys in cloud."
        ),
        "network": network,
        "kernel": {
            "ok": prim_ok == prim_total,
            "primitives_ok": prim_ok,
            "primitives_total": prim_total,
            "receipt_tip": tip()[:20],
            "recent_receipts": len(recent(8)),
        },
        "primitives": [
            {
                **PRIMITIVES[k],
                "status": prim.get(k),
            }
            for k in PRIMITIVES
        ],
        "apps": {
            "first_party": first_party,
            "forged": forged[:20],
            "total": len(apps),
            "first_party_count": len(first_party),
            "forged_count": len(forged),
        },
        "pulse": {
            "brief": brief.get("narrative"),
            "desk_equity": prim["market"].get("equity"),
            "wallets": prim["identity"].get("linked"),
            "laws": prim["law"].get("law_count"),
            "packages": prim["forge"].get("installed_packages"),
            "marks": marks.get("marks"),
            "gas_tip": (gas.get("tip") or {}).get("title"),
        },
        "how_to_use": [
            "1. Platform shell shows primitive health + installed apps",
            "2. Open any app (desk, wallets, AI, company, studio…)",
            "3. Forge installs new packages into the app registry",
            "4. Every invoke consults the ecosystem lawbook",
            "5. Vault route is the capital gate — sim first, you sign later",
        ],
        "api": {
            "status": "GET /platform",
            "apps": "GET /platform/apps",
            "app": "GET /platform/apps/{id}",
            "invoke": "POST /platform/apps/{id}/invoke",
            "primitives": "GET /platform/primitives",
        },
        "elapsed_ms": (time.time() - t0) * 1000,
    }
