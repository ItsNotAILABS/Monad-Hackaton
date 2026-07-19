"""Orchestrate multiple cloud engines for the hosted web app."""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from ..receipts import seal
from .registry import run_engine


def run_cloud_pipeline(
    network: str = "monad-testnet",
    *,
    address: str = "",
    query: str = "",
    estimated_gas: int = 80_000,
) -> Dict[str, Any]:
    """Real multi-engine pipeline used by PLATFORM / CLOUD UI."""
    t0 = time.time()
    steps: List[Dict[str, Any]] = []

    def step(engine_id: str, params: dict) -> dict:
        out = run_engine(engine_id, params)
        steps.append(
            {
                "engine": engine_id,
                "ok": out.get("ok"),
                "ms": out.get("elapsed_ms"),
                "error": out.get("error"),
            }
        )
        return out

    chain = step("chain", {"network": network, "op": "pulse", "address": address or None})
    gas = step("gas", {"network": network, "estimated_gas": estimated_gas})
    law = step("law", {"op": "status"})
    index = step("index", {"op": "all"})
    research = None
    if query:
        research = step("research", {"network": network, "query": query})
    docs = step(
        "docs",
        {
            "kind": "ops",
            "network": network,
        },
    )

    seal(
        "cloud.pipeline",
        {
            "network": network,
            "steps": len(steps),
            "ok": all(s.get("ok") for s in steps),
        },
    )
    return {
        "ok": all(s.get("ok") for s in steps if s["engine"] != "research" or research),
        "schema": "thesis.cloud.pipeline.v1",
        "network": network,
        "locality": "cloud",
        "hosted_web_app": True,
        "on_chain": True,
        "steps": steps,
        "chain": (chain.get("result") if chain.get("ok") else chain),
        "gas": (gas.get("result") if gas.get("ok") else gas),
        "law": (law.get("result") if law.get("ok") else law),
        "index": (index.get("result") if index.get("ok") else index),
        "research": (research.get("result") if research and research.get("ok") else research),
        "docs": (docs.get("result") if docs.get("ok") else docs),
        "elapsed_ms": (time.time() - t0) * 1000,
        "summary": _summary(steps, chain, gas),
    }


def _summary(steps: list, chain: dict, gas: dict) -> str:
    c = chain.get("result") or {}
    g = gas.get("result") or {}
    return (
        f"Cloud pipeline · {len(steps)} engines · "
        f"block {c.get('block_number', '—')} · "
        f"gas ~{g.get('live_gas_price_gwei', '—')} gwei · "
        f"limit {g.get('recommended_gas_limit', '—')}"
    )
