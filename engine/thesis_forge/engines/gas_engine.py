"""Gas engine — Monad gas-limit doctrine + live price pulse."""

from __future__ import annotations

from typing import Any, Dict, Optional

from ..gas_intel import apply_gas_limit_margin, gas_coach, should_warn_overspend
from ..network import get_network
from .base import CloudEngine
from .rpc import hex_to_int, rpc_call


class GasEngine(CloudEngine):
    id = "gas"
    name = "Gas Engine"
    kind = "policy"
    description = "Monad gas coach: pay limit not used, ~7.5% margin, 21k transfers, live gasPrice"
    requires_chain = True

    def run(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        p = params or {}
        network = p.get("network") or "monad-testnet"
        net = get_network(network)
        estimate = int(p.get("estimated_gas") or 80_000)
        gas_limit = p.get("gas_limit")
        chain_id = int(net["chain_id"])

        margin = apply_gas_limit_margin(chain_id, estimate)
        coach = gas_coach(int(__import__("time").time()) // 3600)

        live = rpc_call(net["rpc"], "eth_gasPrice", [])
        gas_price = hex_to_int(live.get("result")) if live.get("ok") else None

        recommended = int(margin.get("recommended_gas_limit") or estimate)
        warn = None
        if gas_limit is not None:
            warn = should_warn_overspend(chain_id, int(gas_limit), estimate)

        cost_wei = None
        cost_mon = None
        if gas_price is not None:
            cost_wei = recommended * gas_price
            cost_mon = cost_wei / 1e18

        return {
            "ok": True,
            "network": net["id"],
            "chain_id": chain_id,
            "doctrine": "Users pay gas_limit × price on Monad — not gas used.",
            "native_transfer_gas": 21_000,
            "estimated_gas": estimate,
            "recommended_gas_limit": recommended,
            "margin": margin,
            "overspend_warning": warn,
            "live_gas_price_wei": gas_price,
            "live_gas_price_gwei": (gas_price / 1e9) if gas_price is not None else None,
            "est_cost_at_recommended_mon": cost_mon,
            "coach": coach.get("tip"),
            "laws": ["monad.gas-bills-limit", "monad.native-transfer-gas"],
            "rpc_ok": live.get("ok"),
            "rpc_ms": live.get("ms"),
        }
