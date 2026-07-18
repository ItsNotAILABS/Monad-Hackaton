"""Chain engine — live Monad JSON-RPC (real network)."""

from __future__ import annotations

from typing import Any, Dict, Optional

from ..network import get_network
from .base import CloudEngine
from .rpc import hex_to_int, rpc_batch, rpc_call, wei_to_eth


class ChainEngine(CloudEngine):
    id = "chain"
    name = "Chain Engine"
    kind = "rpc"
    description = "Live Monad RPC: chain id, block, gas, balances, code, batch eth_call"
    requires_chain = True

    def run(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        p = params or {}
        network = p.get("network") or "monad-testnet"
        net = get_network(network)
        rpc = p.get("rpc") or net["rpc"]
        address = (p.get("address") or "").strip()
        op = (p.get("op") or "pulse").lower()

        if op == "balance" and address:
            r = rpc_call(rpc, "eth_getBalance", [address, "latest"])
            if not r["ok"]:
                return {"ok": False, "error": r.get("error"), "rpc": rpc}
            wei = hex_to_int(r["result"])
            return {
                "ok": True,
                "op": "balance",
                "network": net["id"],
                "chain_id": net["chain_id"],
                "address": address,
                "wei": wei,
                "mon": wei_to_eth(wei),
                "explorer": f"{net['explorer']}/address/{address}",
                "ms": r["ms"],
            }

        if op == "code" and address:
            r = rpc_call(rpc, "eth_getCode", [address, "latest"])
            code = r.get("result") or "0x"
            return {
                "ok": r["ok"],
                "op": "code",
                "address": address,
                "has_code": len(code) > 2,
                "code_bytes": max(0, (len(code) - 2) // 2),
                "ms": r["ms"],
                "error": r.get("error"),
            }

        if op == "call" and p.get("to") and p.get("data"):
            r = rpc_call(
                rpc,
                "eth_call",
                [{"to": p["to"], "data": p["data"]}, "latest"],
            )
            return {
                "ok": r["ok"],
                "op": "call",
                "to": p["to"],
                "result": r.get("result"),
                "error": r.get("error"),
                "ms": r["ms"],
            }

        # Default: network pulse (batched)
        calls = [
            {"id": 1, "method": "eth_chainId", "params": []},
            {"id": 2, "method": "eth_blockNumber", "params": []},
            {"id": 3, "method": "eth_gasPrice", "params": []},
            {"id": 4, "method": "eth_maxPriorityFeePerGas", "params": []},
        ]
        if address:
            calls.append({"id": 5, "method": "eth_getBalance", "params": [address, "latest"]})
            calls.append({"id": 6, "method": "eth_getCode", "params": [address, "latest"]})

        batch = rpc_batch(rpc, calls)
        by_method = {b["method"]: b for b in batch}
        chain_hex = (by_method.get("eth_chainId") or {}).get("result")
        block_hex = (by_method.get("eth_blockNumber") or {}).get("result")
        gas_hex = (by_method.get("eth_gasPrice") or {}).get("result")
        tip_hex = (by_method.get("eth_maxPriorityFeePerGas") or {}).get("result")

        observed = hex_to_int(chain_hex)
        out: Dict[str, Any] = {
            "ok": all(b.get("ok") for b in batch[:3]),
            "op": "pulse",
            "network": net["id"],
            "rpc": rpc,
            "explorer": net["explorer"],
            "expected_chain_id": net["chain_id"],
            "observed_chain_id": observed,
            "chain_match": observed == int(net["chain_id"]),
            "block_number": hex_to_int(block_hex),
            "gas_price_wei": hex_to_int(gas_hex),
            "gas_price_gwei": hex_to_int(gas_hex) / 1e9,
            "max_priority_fee_wei": hex_to_int(tip_hex),
            "note": (
                "On Monad, eth_maxPriorityFeePerGas may be hardcoded (~2 gwei) — "
                "not always live tip advice. You pay gas_limit × price."
            ),
            "batch_ms": batch[0]["ms"] if batch else None,
            "hosted_on_chain": True,
        }
        if address:
            bal = by_method.get("eth_getBalance") or {}
            code = by_method.get("eth_getCode") or {}
            wei = hex_to_int(bal.get("result"))
            c = code.get("result") or "0x"
            out["address"] = address
            out["balance_wei"] = wei
            out["balance_mon"] = wei_to_eth(wei)
            out["has_code"] = len(c) > 2
            out["explorer_address"] = f"{net['explorer']}/address/{address}"
        return out
