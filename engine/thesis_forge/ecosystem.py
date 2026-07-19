"""Monad ecosystem catalog — tokens, infra, gas facts from MONSKILLS / docs.

Addresses sourced from monskill `addresses` skill (mainnet). Never invent.
"""

from __future__ import annotations

from typing import Any, Dict, List

# Mainnet canonical + liquid assets (from MONSKILLS addresses skill)
TOKENS_MAINNET: List[Dict[str, Any]] = [
    {"symbol": "WMON", "name": "Wrapped MON", "address": "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A", "kind": "native-wrap"},
    {"symbol": "USDC", "name": "USD Coin", "address": "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", "kind": "stable"},
    {"symbol": "USDT0", "name": "Tether USD", "address": "0xe7cd86e13AC4309349F30B3435a9d337750fC82D", "kind": "stable"},
    {"symbol": "AUSD", "name": "Agora USD", "address": "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a", "kind": "stable"},
    {"symbol": "WETH", "name": "Wrapped Ether", "address": "0xEE8c0E9f1BFFb4Eb878d8f15f368A02a35481242", "kind": "eth"},
    {"symbol": "wstETH", "name": "Lido Wrapped Staked ETH", "address": "0x10Aeaf63194db8d453d4D85a06E5eFE1dd0b5417", "kind": "eth"},
    {"symbol": "WBTC", "name": "Wrapped Bitcoin", "address": "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c", "kind": "btc"},
    {"symbol": "cbBTC", "name": "Coinbase Wrapped BTC", "address": "0xd18B7EC58Cdf4876f6AFebd3Ed1730e4Ce10414b", "kind": "btc"},
]

CANONICAL_MAINNET: List[Dict[str, str]] = [
    {"name": "Multicall3", "address": "0xcA11bde05977b3631167028862bE2a173976CA11"},
    {"name": "Permit2", "address": "0x000000000022d473030f116ddee9f6b43ac78ba3"},
    {"name": "Create2Deployer", "address": "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2"},
    {"name": "ERC-4337 EntryPoint v0.7", "address": "0x0000000071727De22E5E9d8BAf0edAc6f37da032"},
    {"name": "Safe", "address": "0x69f4D1788e39c87893C980c06EdF4b7f686e2938"},
]

# Agent standards (same mainnet + testnet per monskills)
AGENT_STANDARDS = [
    {"name": "ERC-8004 IdentityRegistry", "address": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"},
    {"name": "ERC-8004 ReputationRegistry", "address": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63"},
]

INFRA: List[Dict[str, str]] = [
    {"id": "rpc", "name": "Public RPC", "mainnet": "https://rpc.monad.xyz", "testnet": "https://testnet-rpc.monad.xyz"},
    {"id": "explorer", "name": "MonadVision", "mainnet": "https://monadvision.com", "testnet": "https://testnet.monadvision.com"},
    {"id": "explorer2", "name": "Monadscan", "mainnet": "https://monadscan.com", "testnet": "https://testnet.monadscan.com"},
    {"id": "faucet", "name": "Testnet faucet", "mainnet": "", "testnet": "https://testnet.monad.xyz"},
    {"id": "docs", "name": "Monad docs", "mainnet": "https://docs.monad.xyz", "testnet": "https://docs.monad.xyz"},
    {"id": "protocols", "name": "Protocols repo", "mainnet": "https://github.com/monad-crypto/protocols", "testnet": "https://github.com/monad-crypto/protocols"},
    {"id": "tokens", "name": "Token list", "mainnet": "https://github.com/monad-crypto/token-list", "testnet": "https://github.com/monad-crypto/token-list"},
]

# Everyday workflow pain → THESIS surface
EVERYDAY_PROBLEMS: List[Dict[str, str]] = [
    {
        "id": "gas-confusion",
        "problem": "I never know if my wallet will overcharge me on Monad.",
        "roommate": "This stops you paying 10× gas because Monad bills the limit, not used gas.",
        "surface": "HOME · gas coach",
        "action": "Read today's gas tip + set tight limits on any cast/deploy.",
    },
    {
        "id": "agent-blank-check",
        "problem": "I want bots to trade but I'm scared they'll blow up the account.",
        "roommate": "20 minutes of re-checking every bot step → one lawbook + desk reject.",
        "surface": "DESK + NOMOS",
        "action": "Run desk arena; celebrate each REJECT as a win.",
    },
    {
        "id": "defi-jargon",
        "problem": "Slippage / leverage / exposure feel abstract until I lose money.",
        "roommate": "Learn by failing safely in 3 minutes, not after a liquidations tweet.",
        "surface": "ACADEMY",
        "action": "Complete today's teach-by-doing lab.",
    },
    {
        "id": "tab-hell",
        "problem": "I open explorer + docs + Discord + 4 DEXes every morning.",
        "roommate": "One home feed: marks, risk, missions, ecosystem links.",
        "surface": "HOME",
        "action": "Open HOME first — streak keeps you honest.",
    },
]


def ecosystem_bundle(network: str = "monad-testnet") -> Dict[str, Any]:
    is_main = network in ("monad-mainnet", "mainnet", "143")
    return {
        "schema": "thesis.ecosystem.v1",
        "network": "monad-mainnet" if is_main else "monad-testnet",
        "chain_id": 143 if is_main else 10143,
        "tokens": TOKENS_MAINNET if is_main else [
            {"symbol": "MON", "name": "Testnet MON", "address": "native", "kind": "native", "note": "Use faucet; mainnet token addresses differ."},
            {"symbol": "see-mainnet-list", "name": "Mainnet assets in CODEX when on 143", "address": "", "kind": "meta"},
        ],
        "canonical": CANONICAL_MAINNET if is_main else [],
        "agent_standards": AGENT_STANDARDS,
        "infra": INFRA,
        "problems": EVERYDAY_PROBLEMS,
        "sources": {
            "monskills_addresses": "local monskill/addresses",
            "protocols_repo": "https://github.com/monad-crypto/protocols",
            "token_list": "https://github.com/monad-crypto/token-list",
            "wallet_guide": "https://docs.monad.xyz (gas limit billing)",
        },
        "warning": "Verify every address on explorer before signing. Never invent addresses.",
    }
