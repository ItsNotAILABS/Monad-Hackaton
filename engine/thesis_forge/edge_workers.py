"""Cloudflare Workers edge agents — catalog + local edge simulator.

Production: deploy edge/ with wrangler → Workers run in ~300+ cities,
each small agent calls ORIGIN_API (this FastAPI) for dual-stack truth.

Local: simulate edge routing without Cloudflare account.
"""

from __future__ import annotations

import os
import time
from typing import Any, Dict, List, Optional

from . import __version__
from .brand import DOCTRINE, PRODUCT
from .receipts import seal

EDGE_AGENTS: List[Dict[str, Any]] = [
    {
        "id": "seatbelt",
        "name": "Seatbelt edge agent",
        "path": "/agent/seatbelt",
        "actions": ["brief", "morning", "reject"],
        "logic": "Daily text brief, one-tap morning, reject demo",
        "origin": ["GET /builder/brief", "POST /builder/morning", "POST /tools/reject_demo/run"],
    },
    {
        "id": "signals",
        "name": "Signals edge agent",
        "path": "/agent/signals",
        "actions": ["board", "auto"],
        "logic": "Alpha board + paper auto loop",
        "origin": ["GET /signals", "POST /auto/loop"],
    },
    {
        "id": "nomos",
        "name": "NOMOS edge agent",
        "path": "/agent/nomos",
        "actions": ["run", "arena"],
        "logic": "Dual-stack arena / evaluate",
        "origin": ["POST /nomos/run", "POST /desk/arena"],
    },
    {
        "id": "x",
        "name": "X marketing edge agent",
        "path": "/agent/x",
        "actions": ["draft"],
        "logic": "Draft ecosystem posts from real actions",
        "origin": ["POST /x/from-actions"],
    },
    {
        "id": "horizon",
        "name": "Long-horizon edge agent",
        "path": "/agent/horizon",
        "actions": ["step"],
        "logic": "Delta attention agent step",
        "origin": ["POST /agent/step"],
    },
]


def edge_catalog() -> Dict[str, Any]:
    edge_url = os.environ.get("MONADBUILDER_EDGE_URL") or os.environ.get("CF_EDGE_URL") or ""
    return {
        "schema": "monadbuilder.edge.catalog.v1",
        "version": __version__,
        "product": PRODUCT,
        "doctrine": DOCTRINE,
        "novel_tech": "Cloudflare Workers edge AI agents + central API",
        "description": (
            "Cloudflare Workers are serverless functions on Cloudflare's global edge "
            "(~300+ cities). Instead of one fat AI box, MonadBuilder deploys many small "
            "agents as Workers. Each holds agent routing logic, optional LLM calls "
            "(Grok/OpenAI/Workers AI), and talks to the central FastAPI dashboard. "
            "Cloudflare runs the Worker in the colo closest to the request."
        ),
        "architecture": {
            "edge": "Cloudflare Workers (multi-agent)",
            "origin": "FastAPI MonadBuilder HQ (laws, desk, vault, receipts)",
            "browser": "Web Workers + STT (no TTS)",
            "node": "worker_threads hybrid",
            "chain": "PolicyKernel · LawBook · SovereignVault",
        },
        "agents": EDGE_AGENTS,
        "deploy": {
            "path": "edge/",
            "wrangler": "edge/wrangler.toml",
            "commands": [
                "cd edge && npm i",
                "npx wrangler secret put XAI_API_KEY   # optional",
                "npx wrangler deploy",
                "# set ORIGIN_API to public FastAPI URL in wrangler.toml [vars]",
            ],
        },
        "edge_url": edge_url or None,
        "local_simulator": "POST /edge/run — same agent routing without Cloudflare",
        "apis": {
            "catalog": "GET /edge",
            "local_run": "POST /edge/run",
            "deployed_health": "{EDGE_URL}/health",
            "deployed_run": "{EDGE_URL}/v1/run",
        },
        "docs": "docs/EDGE_WORKERS.md",
        "why": [
            "Latency: agent logic near the user",
            "Scale: many small agents, not one mega-process",
            "Truth: dual-stack law still on origin — edge never bypasses NOMOS",
            "Optional LLM at edge for copy polish; core tools stay origin-bound",
        ],
    }


def edge_run_local(agent: str = "seatbelt", action: str = "brief", **params) -> Dict[str, Any]:
    """Simulate edge agent on the origin host (no CF account needed)."""
    t0 = time.time()
    agent = (agent or "seatbelt").lower()
    action = (action or "brief").lower()
    network = params.get("network") or "monad-testnet"
    result: Dict[str, Any]

    if agent == "seatbelt":
        if action == "morning":
            from .builder import run_morning

            r = run_morning(network)
            result = {"agent": "seatbelt", "action": "morning", "data": r, "summary": r.get("headline")}
        elif action == "reject":
            from .tools import run_tool

            r = run_tool("reject_demo", {})
            result = {"agent": "seatbelt", "action": "reject", "data": r, "summary": (r.get("result") or {}).get("proof")}
        else:
            from .builder import daily_ai_brief

            r = daily_ai_brief(network)
            result = {
                "agent": "seatbelt",
                "action": "brief",
                "data": r,
                "brief_text": r.get("brief_text"),
                "format": "text",
                "tts": False,
                "summary": r.get("brief_text"),
            }
    elif agent == "signals":
        if action in ("auto", "loop"):
            from .auto_exec import auto_loop

            r = auto_loop(network)
            result = {"agent": "signals", "action": "auto", "data": r, "summary": r.get("headline")}
        else:
            from .signals import generate_signals

            r = generate_signals(network)
            result = {"agent": "signals", "action": "board", "data": r, "summary": f"n={r.get('n')}"}
    elif agent == "nomos":
        if action in ("arena", "desk"):
            from .trading import load_desk, run_desk_arena

            r = run_desk_arena(load_desk())
            result = {
                "agent": "nomos",
                "action": "desk_arena",
                "data": r,
                "n_rejected": r.get("n_rejected"),
                "summary": f"reject={r.get('n_rejected')}",
            }
        else:
            from .nomos import run_nomos_arena

            r = run_nomos_arena()
            result = {
                "agent": "nomos",
                "action": "nomos_run",
                "data": {"n_rejected": r.get("n_rejected"), "n_accepted": r.get("n_accepted")},
                "summary": f"reject={r.get('n_rejected')}",
            }
    elif agent in ("x", "xpost"):
        from .x_marketing import draft_from_recent_actions

        r = draft_from_recent_actions(network=network)
        result = {
            "agent": "x",
            "action": "draft",
            "data": r,
            "text": r.get("text"),
            "intent_url": r.get("intent_url"),
            "summary": (r.get("text") or "")[:120],
        }
    elif agent in ("horizon", "agent"):
        from .delta_ai import long_horizon_step

        r = long_horizon_step(
            params.get("goal") or params.get("message") or "safe daily ops",
            network=network,
            note=params.get("note") or "",
            stt=params.get("stt") or "",
            execute=params.get("execute", True),
        )
        result = {
            "agent": "horizon",
            "action": "step",
            "data": r,
            "intent": r.get("intent"),
            "answer": r.get("answer"),
            "summary": r.get("answer", "")[:160],
        }
    else:
        return {
            "ok": False,
            "error": f"unknown agent {agent}",
            "agents": [a["id"] for a in EDGE_AGENTS],
        }

    seal("edge.local_run", {"agent": agent, "action": action})
    return {
        "schema": "monadbuilder.edge.local_run.v1",
        "ok": True,
        "mode": "local_edge_simulator",
        "note": "Same routing as Cloudflare Worker; deploy edge/ for real multi-colo",
        "product": PRODUCT,
        "edge": {
            "runtime": "local-simulator",
            "production": "cloudflare-workers",
            "cities_hint": "300+",
        },
        "result": result,
        "elapsed_ms": (time.time() - t0) * 1000,
        "doctrine": DOCTRINE,
    }
