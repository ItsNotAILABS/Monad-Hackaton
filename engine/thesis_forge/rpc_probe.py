"""Optional live Monad RPC probe (stdlib only)."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Dict

from .network import get_network


def probe_network(network: str = "monad-testnet", timeout: float = 8.0) -> Dict[str, Any]:
    net = get_network(network)
    rpc = net["rpc"]
    body = json.dumps(
        {"jsonrpc": "2.0", "id": 1, "method": "eth_chainId", "params": []}
    ).encode()
    req = urllib.request.Request(
        rpc,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode())
        hex_id = (data.get("result") or "0x0").lower()
        chain_id = int(hex_id, 16)
        ok = chain_id == int(net["chain_id"])
        return {
            "ok": ok,
            "rpc": rpc,
            "expected_chain_id": net["chain_id"],
            "observed_chain_id": chain_id,
            "network": net["id"],
            "explorer": net["explorer"],
            "latency_hint": "ok" if ok else "chain mismatch",
        }
    except Exception as exc:
        return {
            "ok": False,
            "rpc": rpc,
            "expected_chain_id": net["chain_id"],
            "error": str(exc)[:300],
            "network": net["id"],
            "resolution": "Check network connectivity or use a provider RPC.",
        }
