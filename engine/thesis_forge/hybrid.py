"""Blockchain + Web Worker / Node worker_threads hybrid catalog.

Novel tech surface:
  - Browser: Web Workers (web/src/workers) score/arena/crawl off UI thread
  - Node: worker_threads via polyglot thesis-bridge hybrid-worker
  - Chain: API host still owns dual-stack laws + vault sim + auto paper
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from . import __version__
from .polyglot import run_polyglot
from .receipts import seal

DOCTRINE = "Workers propose/score. Laws decide. Owner signs. Receipts remember."


def hybrid_catalog() -> Dict[str, Any]:
    return {
        "schema": "thesis.hybrid.v1",
        "version": __version__,
        "novel_tech": "blockchain + web-worker hybrid",
        "doctrine": DOCTRINE,
        "description": (
            "Web Workers are background JavaScript processes that run in parallel "
            "(outside the main UI thread) so agent scoring, signal boards, catalog crawls, "
            "and crypto fingerprints never freeze the HQ. Node worker_threads do the same "
            "on the server bridge. Blockchain enforcement stays on PolicyKernel / LawBook / vault."
        ),
        "layers": [
            {
                "id": "browser_worker",
                "runtime": "Web Worker (module)",
                "path": "web/src/workers/thesis.worker.js",
                "ops": ["pulse", "arena", "evaluate", "signals", "crawl", "agents", "fingerprint", "bench"],
                "freezes_ui": False,
            },
            {
                "id": "node_worker",
                "runtime": "node:worker_threads",
                "path": "polyglot/node/hybrid-worker.mjs",
                "ops": ["pulse", "arena", "agents", "evaluate", "fingerprint", "bench"],
                "entry": "node thesis-bridge.mjs hybrid-worker",
            },
            {
                "id": "api_chain",
                "runtime": "FastAPI + Monad contracts",
                "ops": ["auto/loop", "signals", "nomos", "vault route", "lawbook"],
                "note": "Source of truth for laws + paper auto-exec + owner-gated chain",
            },
        ],
        "why_novel": [
            "Most hackathon AI bots run all scoring on the main thread or only on server",
            "THESIS splits: parallel workers for intelligence UX + dual-stack chain for final law",
            "Same reject-is-a-feature mirror in the browser worker for instant feedback",
        ],
        "apis": {
            "catalog": "GET /hybrid",
            "node_run": "POST /hybrid/run",
            "browser": "HybridHub tab · runHybrid(op) in web/src/workers/hybrid.js",
        },
        "docs": "docs/HYBRID_WORKERS.md",
    }


def run_hybrid_node(op: str = "pulse", params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Invoke Node hybrid worker via polyglot bridge."""
    params = params or {}
    # polyglot node bridge: hybrid-worker
    out = run_polyglot(
        "node",
        "hybrid-worker",
        {"op": op, "payload": params},
    )
    seal("hybrid.node", {"op": op, "ok": out.get("ok")})
    return {
        "schema": "thesis.hybrid.run.v1",
        "op": op,
        "novel_tech": "blockchain + node-worker_threads hybrid",
        "result": out,
        "ok": bool(out.get("ok", True)),
    }
