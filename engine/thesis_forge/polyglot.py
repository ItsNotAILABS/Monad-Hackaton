"""Polyglot intelligence bridge — Julia + Node + Python embedded agents.

Called by the FastAPI host. Never raises out of process helpers (soft-fail).
"""

from __future__ import annotations

import json
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from .receipts import seal

_ROOT = Path(__file__).resolve().parents[2]
_JULIA = _ROOT / "polyglot" / "julia" / "ThesisIntel.jl"
_NODE = _ROOT / "polyglot" / "node" / "thesis-bridge.mjs"


def _which(cmd: str) -> Optional[str]:
    return shutil.which(cmd)


def _run(cmd: List[str], timeout: float = 45.0) -> Dict[str, Any]:
    t0 = time.time()
    try:
        r = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(_ROOT),
        )
        lines = [ln for ln in (r.stdout or "").strip().splitlines() if ln.strip()]
        last = lines[-1] if lines else "{}"
        try:
            data = json.loads(last)
        except json.JSONDecodeError:
            data = {
                "ok": False,
                "error": "non-json output",
                "stdout": (r.stdout or "")[:500],
                "stderr": (r.stderr or "")[:300],
            }
        data.setdefault("ok", True)
        data["_meta"] = {
            "ms": (time.time() - t0) * 1000,
            "returncode": r.returncode,
            "cmd0": cmd[0],
        }
        return data
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "timeout", "_meta": {"ms": timeout * 1000}}
    except Exception as exc:
        return {"ok": False, "error": str(exc)[:400], "_meta": {"ms": (time.time() - t0) * 1000}}


def julia_available() -> bool:
    return bool(_which("julia") and _JULIA.exists())


def node_available() -> bool:
    return bool(_which("node") and _NODE.exists())


def run_julia(cmd: str = "pulse", params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if not julia_available():
        return {
            "ok": False,
            "error": "julia not available",
            "engine": "julia",
            "hint": "Install Julia and ensure ThesisIntel.jl exists",
        }
    payload = json.dumps(params or {})
    return _run(
        ["julia", "--startup-file=no", "--compile=min", "-O0", str(_JULIA), cmd, payload],
        timeout=60.0,
    )


def run_node(cmd: str = "pulse", params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if not node_available():
        return {"ok": False, "error": "node not available", "engine": "node"}
    if cmd == "julia":
        # node thesis-bridge.mjs julia spectral '{}'
        jcmd = (params or {}).get("cmd") or "pulse"
        jparams = json.dumps((params or {}).get("params") or {})
        return _run(["node", str(_NODE), "julia", jcmd, jparams], timeout=70.0)
    return _run(["node", str(_NODE), cmd, json.dumps(params or {})], timeout=45.0)


def python_intel(params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Embedded Python intelligence (no external process)."""
    p = params or {}
    series = p.get("series") or []
    xs = []
    for v in series:
        try:
            xs.append(float(v))
        except (TypeError, ValueError):
            pass
    if len(xs) < 2:
        # synthetic marks walk
        import math
        import random

        random.seed(int(p.get("seed", 42)))
        x = 1.0
        for _ in range(48):
            x *= math.exp(0.002 * random.gauss(0, 1))
            xs.append(x)
    n = len(xs)
    mean = sum(xs) / n
    var = sum((x - mean) ** 2 for x in xs) / max(n - 1, 1)
    std = var**0.5
    rets = [(xs[i] / xs[i - 1] - 1) for i in range(1, n)]
    sharpe = (sum(rets) / len(rets)) / (max((sum((r - sum(rets)/len(rets))**2 for r in rets)/max(len(rets)-1,1))**0.5, 1e-9)) if rets else 0.0
    return {
        "ok": True,
        "engine": "python.intel",
        "locality": "python-embedded",
        "n": n,
        "mean": mean,
        "std": std,
        "last": xs[-1],
        "sharpe_like": sharpe,
        "z": (xs[-1] - mean) / std if std else 0.0,
        "agents_hint": "Combine with Julia agent_score + Node agent-rank",
    }


def polyglot_catalog() -> Dict[str, Any]:
    return {
        "schema": "thesis.polyglot.v1",
        "julia": {
            "available": julia_available(),
            "path": str(_JULIA),
            "commands": ["pulse", "spectral", "monte_carlo", "portfolio", "agent_score", "gas"],
        },
        "node": {
            "available": node_available(),
            "path": str(_NODE),
            "commands": [
                "pulse",
                "agent-rank",
                "wasm-hash",
                "wasm-native",
                "webgpu-info",
                "hybrid-worker",
                "julia",
            ],
        },
        "python": {
            "available": True,
            "commands": ["intel", "embed_agents"],
        },
        "browser": {
            "webgpu": "navigator.gpu in React Polyglot hub",
            "wasm": "WebAssembly.instantiate in browser + Node native add",
            "transformers": "LOCAL AI tab",
        },
        "solidity": {
            "contracts": "contracts/src — SovereignVault, PolicyKernel, LawBook…",
        },
        "powershell": {
            "scripts": [
                "scripts/run_polyglot.ps1",
                "scripts/run_workstation.ps1",
                "scripts/setup-transformers-assets.ps1",
            ]
        },
    }


def run_polyglot(lang: str, cmd: str = "pulse", params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    lang = (lang or "python").lower()
    params = params or {}
    if lang in ("julia", "jl"):
        out = run_julia(cmd, params)
    elif lang in ("node", "js", "javascript"):
        out = run_node(cmd, params)
    elif lang in ("python", "py"):
        if cmd in ("intel", "pulse", "spectral"):
            out = python_intel(params)
        else:
            out = python_intel(params)
            out["cmd"] = cmd
    else:
        out = {"ok": False, "error": f"unknown lang {lang}"}
    seal(
        "polyglot.run",
        {
            "lang": lang,
            "cmd": cmd,
            "ok": bool(out.get("ok")),
        },
    )
    return out


def polyglot_mesh(params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Run Julia + Node + Python together — full polyglot intelligence mesh."""
    p = params or {}
    t0 = time.time()
    series = p.get("series")
    equity = float(p.get("equity") or 10000)
    jl_pulse = run_julia("pulse", {})
    jl_mc = run_julia(
        "monte_carlo",
        {"equity": equity, "vol": float(p.get("vol") or 0.02), "n": int(p.get("n") or 2000)},
    )
    jl_gas = run_julia("gas", {"estimated_gas": int(p.get("estimated_gas") or 80000)})
    jl_spec = run_julia("spectral", {"series": series} if series else {})
    node_pulse = run_node("pulse", {})
    node_agents = run_node(
        "agent-rank",
        {
            "agents": p.get("agents")
            or [
                {"name": "yield", "return": 0.08, "risk": 0.03, "lawful": True, "gas_score": 0.9},
                {"name": "degen", "return": 0.5, "risk": 0.3, "lawful": False, "gas_score": 0.2},
                {"name": "mm", "return": 0.04, "risk": 0.012, "lawful": True, "gas_score": 0.95},
            ]
        },
    )
    node_wasm = run_node("wasm-native", {})
    node_hybrid = run_node("hybrid-worker", {"op": "pulse"})
    py = python_intel({"series": series} if series else {})
    seal("polyglot.mesh", {"ok": True})
    return {
        "ok": True,
        "schema": "thesis.polyglot.mesh.v1",
        "elapsed_ms": (time.time() - t0) * 1000,
        "catalog": polyglot_catalog(),
        "julia": {
            "pulse": jl_pulse,
            "monte_carlo": jl_mc,
            "gas": jl_gas,
            "spectral": jl_spec,
        },
        "node": {
            "pulse": node_pulse,
            "agents": node_agents,
            "wasm": node_wasm,
            "hybrid_worker": node_hybrid,
        },
        "python": py,
        "novel_tech": "blockchain + web-worker / worker_threads hybrid",
        "synthesis": {
            "winner_agent": (node_agents.get("winner") or (jl_mc.get("ok") and "mc-risk-aware")),
            "recommended_gas_limit": jl_gas.get("recommended_limit") or jl_gas.get("recommended_gas_limit"),
            "var": jl_mc.get("var"),
            "cvar": jl_mc.get("cvar"),
            "hybrid_worker_ok": bool(node_hybrid.get("ok")),
            "python_z": py.get("z"),
            "wasm_ok": node_wasm.get("ok"),
            "message": (
                "Polyglot mesh: Julia risk/gas/spectral + Node agents/WASM + Python intel"
            ),
        },
        "locality": "polyglot",
    }
