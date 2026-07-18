"""CODEX — Monad ecosystem protocol atlas."""

from __future__ import annotations

from .models import Category, Protocol

PROTOCOLS: list[Protocol] = [
    Protocol(
        id="uniswap",
        name="Uniswap",
        category=Category.DEX,
        capabilities=["quote", "swap", "liquidity"],
        adapter_status="simulated",
        notes="EVM DEX pattern; verify Monad deployment addresses before live swaps.",
    ),
    Protocol(
        id="pancake",
        name="PancakeSwap",
        category=Category.DEX,
        capabilities=["quote", "swap", "liquidity"],
        adapter_status="planned",
    ),
    Protocol(
        id="kuru",
        name="Kuru",
        category=Category.DEX,
        capabilities=["orderbook", "swap"],
        adapter_status="simulated",
        notes="Monad-native orderbook DEX — prefer official docs for addresses.",
    ),
    Protocol(
        id="aave",
        name="Aave",
        category=Category.LENDING,
        capabilities=["supply", "borrow", "repay", "withdraw"],
        adapter_status="planned",
    ),
    Protocol(
        id="morpho",
        name="Morpho",
        category=Category.LENDING,
        capabilities=["supply", "borrow", "repay", "withdraw"],
        adapter_status="planned",
    ),
    Protocol(
        id="euler",
        name="Euler",
        category=Category.LENDING,
        capabilities=["supply", "borrow", "repay", "withdraw"],
        adapter_status="planned",
    ),
    Protocol(
        id="pendle",
        name="Pendle",
        category=Category.VAULT,
        capabilities=["yield-market", "deposit", "withdraw"],
        adapter_status="planned",
    ),
    Protocol(
        id="beefy",
        name="Beefy",
        category=Category.VAULT,
        capabilities=["deposit", "withdraw", "compound"],
        adapter_status="simulated",
    ),
    Protocol(
        id="magma",
        name="Magma",
        category=Category.STAKING,
        capabilities=["stake", "unstake", "claim"],
        adapter_status="simulated",
        notes="Monad staking liquid path — confirm live contracts on explorer.",
    ),
    Protocol(
        id="kintsu",
        name="Kintsu",
        category=Category.STAKING,
        capabilities=["stake", "unstake", "lst"],
        adapter_status="planned",
    ),
    Protocol(
        id="perpl",
        name="Perpl",
        category=Category.PERPS,
        capabilities=["open", "close", "hedge"],
        adapter_status="planned",
    ),
    Protocol(
        id="leverup",
        name="LeverUp",
        category=Category.PERPS,
        capabilities=["open", "close", "leverage"],
        adapter_status="planned",
    ),
    Protocol(
        id="birdeye",
        name="Birdeye",
        category=Category.ANALYTICS,
        capabilities=["prices", "markets"],
        adapter_status="simulated",
    ),
    Protocol(
        id="monadvision",
        name="MonadVision",
        category=Category.ANALYTICS,
        capabilities=["positions", "transactions", "verify"],
        adapter_status="live",
        docs_url="https://monadvision.com",
        notes="Block explorer — live for mainnet; testnet at testnet.monadvision.com",
    ),
    Protocol(
        id="fere",
        name="FereAI",
        category=Category.AGENT,
        capabilities=["proposal", "analysis"],
        adapter_status="planned",
    ),
    Protocol(
        id="monad-agent-hub",
        name="Monad Agent Hub",
        category=Category.AGENT,
        capabilities=["identity", "discovery", "wallet"],
        adapter_status="planned",
    ),
    Protocol(
        id="thesis-vault",
        name="THESIS SovereignVault",
        category=Category.VAULT,
        capabilities=["policy-execute", "receipt", "emergency-withdraw"],
        adapter_status="live",
        notes="This product's policy-gated vault — primary Spark contract.",
    ),
]


def by_categories(categories: list[Category]) -> list[Protocol]:
    wanted = set(categories)
    return [p for p in PROTOCOLS if p.category in wanted]


def all_protocols() -> list[Protocol]:
    return list(PROTOCOLS)


def get_protocol(protocol_id: str) -> Protocol | None:
    for p in PROTOCOLS:
        if p.id == protocol_id:
            return p
    return None
