"""Monad gas intelligence for everyday wallet safety.

From official wallet developer guide + MONSKILLS gas skill:
users pay gas_limit * price, not gas used.
"""

from __future__ import annotations

from typing import Any, Dict

# Category Labs / docs: ~7.5% buffer on Monad (bps)
MONAD_GAS_MARGIN_BPS = 10_750  # 1.075x
DEFAULT_OTHER_MARGIN_BPS = 15_000  # 1.5x

GAS_TIPS = [
    {
        "id": "limit-not-used",
        "title": "You pay the gas limit",
        "body": "On Monad, gas_paid = gas_limit × price. A huge MetaMask fallback limit can overcharge you even if the tx is cheap.",
        "roommate": "Saved you from a 10× gas bill on a simple call.",
        "do": "Always set a tight limit; use estimate × 1.075 on Monad.",
    },
    {
        "id": "buffer-75",
        "title": "Use ~7.5% buffer, not 2×",
        "body": "Category Labs analysis recommends a modest buffer on Monad (chain 143 / 10143), not Ethereum-style fat safety multiples.",
        "roommate": "Same success rate, less wasted MON.",
        "do": "applyGasLimitMargin(chainId, estimate) with 10750 bps.",
    },
    {
        "id": "no-global-mempool",
        "title": "No global pending pool",
        "body": "Don't wait on network-wide pending lists. Track your nonces and receipts. Finality is ~800ms after inclusion.",
        "roommate": "Stops you staring at a fake 'pending forever' state.",
        "do": "Poll eth_getTransactionReceipt every ~400ms; then wait for finalized tag if bridging.",
    },
    {
        "id": "reserve-10-mon",
        "title": "10 MON reserve balance",
        "body": "Spending that would drop an undelegated account below 10 MON can fail. Plan gas + value with reserve in mind.",
        "roommate": "Avoid mysterious reverts when 'cleaning out' a wallet.",
        "do": "Leave ≥10 MON headroom unless you know EIP-7702 / reserve rules.",
    },
    {
        "id": "priority-fee",
        "title": "eth_maxPriorityFeePerGas is not live advice",
        "body": "It may return a hardcoded 2 gwei. Quote from real fee history / base fee on Monad.",
        "roommate": "Don't tip like it's 2021 Ethereum defaults.",
        "do": "Read base fee; set modest priority tip for Priority Gas Auction.",
    },
]


def apply_gas_limit_margin(chain_id: int, estimated_gas: int) -> Dict[str, Any]:
    margin = MONAD_GAS_MARGIN_BPS if chain_id in (143, 10143) else DEFAULT_OTHER_MARGIN_BPS
    limited = (estimated_gas * margin + 9_999) // 10_000
    return {
        "chain_id": chain_id,
        "estimated_gas": estimated_gas,
        "margin_bps": margin,
        "recommended_gas_limit": limited,
        "overcharge_if_2x": estimated_gas * 2 - limited,
        "note": "Monad charges the limit — keep buffers tight.",
    }


def should_warn_overspend(chain_id: int, gas_limit: int, recommended: int) -> bool:
    if chain_id not in (143, 10143):
        return False
    if recommended <= 0 or gas_limit < 21_000:
        return False
    return gas_limit > recommended * 10


def gas_coach(day_index: int = 0) -> Dict[str, Any]:
    tip = GAS_TIPS[day_index % len(GAS_TIPS)]
    demo = apply_gas_limit_margin(10143, 80_000)
    return {
        "schema": "thesis.gas_coach.v1",
        "tip": tip,
        "demo_margin": demo,
        "chains_billing_limit": [143, 10143],
        "native_transfer_gas": 21_000,
        "docs": [
            "https://docs.monad.xyz/developer-essentials/gas-pricing",
            "https://www.category.xyz/blogs/setting-your-gas-limit-on-monad",
        ],
    }
