"""JSON-RPC client for Monad (stdlib only)."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Sequence, Union


def rpc_call(
    rpc_url: str,
    method: str,
    params: Optional[list] = None,
    *,
    timeout: float = 12.0,
    req_id: int = 1,
) -> Dict[str, Any]:
    body = json.dumps(
        {"jsonrpc": "2.0", "id": req_id, "method": method, "params": params or []}
    ).encode()
    req = urllib.request.Request(
        rpc_url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode())
        return {
            "ok": "error" not in data,
            "result": data.get("result"),
            "error": data.get("error"),
            "ms": (time.time() - t0) * 1000,
            "method": method,
        }
    except Exception as exc:
        return {
            "ok": False,
            "result": None,
            "error": {"message": str(exc)[:400]},
            "ms": (time.time() - t0) * 1000,
            "method": method,
        }


def rpc_batch(
    rpc_url: str,
    calls: Sequence[Dict[str, Any]],
    *,
    timeout: float = 15.0,
) -> List[Dict[str, Any]]:
    """Batch JSON-RPC (Monad-friendly — one round trip)."""
    payload = []
    for i, c in enumerate(calls):
        payload.append(
            {
                "jsonrpc": "2.0",
                "id": c.get("id", i + 1),
                "method": c["method"],
                "params": c.get("params") or [],
            }
        )
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        rpc_url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode())
        ms = (time.time() - t0) * 1000
        if not isinstance(data, list):
            data = [data]
        by_id = {item.get("id"): item for item in data if isinstance(item, dict)}
        out = []
        for i, c in enumerate(calls):
            item = by_id.get(c.get("id", i + 1), {})
            out.append(
                {
                    "ok": "error" not in item,
                    "result": item.get("result"),
                    "error": item.get("error"),
                    "ms": ms,
                    "method": c["method"],
                }
            )
        return out
    except Exception as exc:
        return [
            {
                "ok": False,
                "result": None,
                "error": {"message": str(exc)[:400]},
                "ms": (time.time() - t0) * 1000,
                "method": c["method"],
            }
            for c in calls
        ]


def hex_to_int(h: Optional[str]) -> int:
    if not h:
        return 0
    if isinstance(h, int):
        return h
    return int(h, 16)


def wei_to_eth(wei: int, decimals: int = 18) -> float:
    return wei / float(10**decimals)
