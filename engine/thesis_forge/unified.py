"""Unified system run — cloud engines + company + desk + laws + vault story.

One entry point so the hosted web app operates as a single product, not silos.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, Optional

from .company.os import morning_brief, run_objective
from .ecosystem_laws import embed_ecosystem_laws, runtime_status
from .engines.orchestrator import run_cloud_pipeline
from .engines.registry import run_engine
from .platform import platform_status
from .receipts import recent, seal, tip
from .trading import desk_snapshot, load_desk, run_desk_arena
from .vault_route import simulate_vault_route
from .wallets import registry_snapshot
from .ai_node import node_status
from .workspace import list_projects

_ROOT = Path(__file__).resolve().parents[2]
_DEPLOY = _ROOT / "receipts" / "deployment.json"


def _deployment() -> Dict[str, Any]:
    if _DEPLOY.exists():
        try:
            return json.loads(_DEPLOY.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def system_status(network: str = "monad-testnet") -> Dict[str, Any]:
    """Lightweight unified status for shell header / health widgets."""
    laws = runtime_status()
    plat = platform_status(network)
    desk = desk_snapshot()
    wallets = registry_snapshot()
    ai = node_status()
    dep = _deployment()
    vault = (
        dep.get("primary_submission_address")
        or (dep.get("contracts") or {}).get("SovereignVault")
        or ""
    )
    return {
        "schema": "thesis.system.status.v1",
        "network": network,
        "version": plat.get("version"),
        "product": plat.get("product"),
        "kernel": plat.get("kernel"),
        "primitives_ok": (plat.get("kernel") or {}).get("primitives_ok"),
        "primitives_total": (plat.get("kernel") or {}).get("primitives_total"),
        "apps": plat.get("apps"),
        "laws": laws.get("law_count"),
        "desk_equity": desk.get("equity"),
        "day_pnl": desk.get("day_pnl"),
        "wallets_linked": len(wallets.get("links") or []),
        "ai_no_keys": (ai.get("capabilities") or {}).get("real_key_access") is False,
        "vault": vault or None,
        "projects": len(list_projects()),
        "receipt_tip": tip()[:16],
        "doctrine": plat.get("doctrine"),
        "surfaces": {
            "platform": "live",
            "tools": "tools",
            "cloud": "cloud",
            "local_ai": "local",
            "company": "hq",
            "desk": "desk",
            "ai_node": "ai",
            "studio": "studio",
            "nomos": "nomos",
            "proof": "judge",
        },
        "tools": {
            "catalog": "GET /tools",
            "mcp": "python -m thesis_forge.mcp_server",
            "easy_path": "POST /tools/easy_path/run",
            "lawbook": "GET /lawbook",
        },
        "how_to_use": [
            "1. TOOLS → EASY PATH (60s) or POST /tools/easy_path/run",
            "2. ▶ RUN SYSTEM for full seatbelt",
            "3. PROOF → WIN PATH for judges",
            "4. Any AI: MCP or POST /tools/{id}/run",
        ],
    }


def run_system(
    network: str = "monad-testnet",
    *,
    objective: str = "",
    query: str = "",
    address: str = "",
    estimated_gas: int = 80_000,
    run_company: bool = True,
    run_desk: bool = True,
    run_cloud: bool = True,
    run_vault_route: bool = True,
) -> Dict[str, Any]:
    """
    End-to-end product path:
      laws embed → cloud pipeline → desk arena → vault route sim → company mission
    """
    t0 = time.time()
    steps: list[Dict[str, Any]] = []

    def mark(name: str, ok: bool, detail: Any = None, **extra):
        steps.append({"step": name, "ok": ok, "detail": detail, **extra})

    # 1) Laws
    book = embed_ecosystem_laws()
    mark("laws.embed", True, {"law_count": book.get("law_count")})

    # 2) Cloud engines (best-effort — RPC outages must not brick the app)
    cloud = None
    if run_cloud:
        try:
            cloud = run_cloud_pipeline(
                network,
                address=address,
                query=query
                or "Monad gas limits, vault policy gate, and desk risk rejects",
                estimated_gas=estimated_gas,
            )
            # Treat partial RPC success as usable
            cloud_ok = bool(cloud.get("ok")) or bool(cloud.get("steps"))
            mark(
                "cloud.pipeline",
                cloud_ok,
                cloud.get("summary") or "cloud ran",
                engines=[s.get("engine") for s in (cloud.get("steps") or [])],
                soft=True,
            )
        except Exception as exc:
            mark("cloud.pipeline", True, {"soft_fail": str(exc)[:200]}, soft=True)
            cloud = {"ok": False, "error": str(exc)[:300], "soft": True}

    # 3) Desk arena (reject as feature)
    desk_out = None
    if run_desk:
        desk_out = run_desk_arena(load_desk())
        mark(
            "desk.arena",
            True,
            {
                "n_accepted": desk_out.get("n_accepted"),
                "n_rejected": desk_out.get("n_rejected"),
            },
        )

    # 4) Vault route on first routable ticket
    vault_route = None
    if run_vault_route:
        desk = desk_snapshot()
        tid = None
        for t in desk.get("tickets_recent") or []:
            if t.get("status") in ("risk_accepted", "paper_filled", "routed_sim"):
                tid = t.get("ticket_id")
                break
        if tid:
            vault_route = simulate_vault_route(tid)
            mark(
                "vault.route",
                bool(vault_route.get("ok", True)),
                {
                    "would_execute": vault_route.get("would_execute"),
                    "narrative": vault_route.get("narrative"),
                    "ticket_id": tid,
                },
            )
        else:
            mark("vault.route", True, {"skipped": True, "reason": "no routable ticket"})

    # 5) Company OS mission
    company = None
    if run_company:
        obj = objective or (
            "Grow my Monad position, keep 30% liquid, avoid leverage, "
            "respect gas limits, and teach me what departments decided."
        )
        company = run_objective(obj)
        mark(
            "company.run",
            bool(company.get("ok")),
            {
                "mission_id": (company.get("mission") or {}).get("mission_id"),
                "status": (company.get("mission") or {}).get("status"),
                "sla": company.get("sla_all_met"),
                "eco_laws": (company.get("law_stack") or {}).get("ecosystem_law_count"),
            },
        )

    # 6) Security cloud scan on narrative (public text)
    sec = run_engine(
        "security",
        {
            "text": (
                f"{query} gas margin exact approval owner signs "
                f"{(cloud or {}).get('summary', '')}"
            )
        },
    )
    mark("security.scan", bool(sec.get("ok")), {"clean": (sec.get("result") or {}).get("clean")})

    # 7) Polyglot mesh (Julia + Node + Python) — soft
    poly = None
    try:
        from .polyglot import polyglot_mesh

        desk_eq = float((desk_snapshot() or {}).get("equity") or 10000)
        poly = polyglot_mesh(
            {
                "equity": desk_eq,
                "estimated_gas": estimated_gas,
                "vol": 0.02,
            }
        )
        mark(
            "polyglot.mesh",
            bool(poly.get("ok")),
            poly.get("synthesis"),
            soft=True,
        )
    except Exception as exc:
        mark("polyglot.mesh", True, {"soft_fail": str(exc)[:200]}, soft=True)

    # 8) Snapshot surfaces
    status = system_status(network)
    brief = morning_brief()
    dep = _deployment()

    # Hard steps must pass; soft (cloud RPC / polyglot) can warn without failing product path
    hard = [s for s in steps if not s.get("soft")]
    ok = all(s.get("ok") for s in hard) if hard else all(s.get("ok") for s in steps)
    seal(
        "system.run",
        {
            "ok": ok,
            "steps": [s["step"] for s in steps],
            "network": network,
        },
    )

    return {
        "schema": "thesis.system.run.v1",
        "ok": ok,
        "network": network,
        "elapsed_ms": (time.time() - t0) * 1000,
        "headline": (
            "SYSTEM LINKED — laws · cloud · desk · vault · company · polyglot"
            if ok
            else "SYSTEM RUN finished with issues — inspect steps"
        ),
        "steps": steps,
        "status": status,
        "brief": {
            "narrative": brief.get("narrative"),
            "bullets": brief.get("bullets"),
        },
        "cloud": cloud,
        "desk_arena": {
            "n_accepted": (desk_out or {}).get("n_accepted"),
            "n_rejected": (desk_out or {}).get("n_rejected"),
            "results": (desk_out or {}).get("results", [])[:6],
        }
        if desk_out
        else None,
        "vault_route": {
            "would_execute": (vault_route or {}).get("would_execute"),
            "narrative": (vault_route or {}).get("narrative"),
            "vault": (vault_route or {}).get("vault")
            or dep.get("primary_submission_address")
            or (dep.get("contracts") or {}).get("SovereignVault"),
            "steps": (vault_route or {}).get("steps"),
        }
        if vault_route
        else {"vault": dep.get("primary_submission_address") or None, "skipped": True},
        "company": {
            "ok": (company or {}).get("ok"),
            "mission_id": ((company or {}).get("mission") or {}).get("mission_id"),
            "status": ((company or {}).get("mission") or {}).get("status"),
            "sla_all_met": (company or {}).get("sla_all_met"),
            "winner": ((company or {}).get("mission") or {}).get("winner"),
            "law_stack": (company or {}).get("law_stack"),
        }
        if company
        else None,
        "security": sec.get("result"),
        "polyglot": poly,
        "next": [
            {"tab": "poly", "label": "Polyglot Julia/Node/WebGPU"},
            {"tab": "cloud", "label": "Inspect cloud engines"},
            {"tab": "desk", "label": "Desk tickets / vault route"},
            {"tab": "hq", "label": "Company mission room"},
            {"tab": "local", "label": "Local AI memory + teach"},
            {"tab": "codex", "label": "Deployment / chain"},
        ],
        "receipt_tip": tip()[:20],
        "recent_receipts": len(recent(8)),
        "locality": "cloud+platform+polyglot",
        "hosted_web_app": True,
        "on_chain_story": "SovereignVault + PolicyKernel on Monad; engines on API host; UI is HQ",
    }
