"""Monad network constants — official docs alignment.

https://docs.monad.xyz/developer-essentials/network-information
https://docs.monad.xyz/guides/deploy-smart-contract/foundry
"""

from __future__ import annotations

from typing import Any, Dict, Literal

NetworkId = Literal["monad-testnet", "monad-mainnet"]

NETWORKS: Dict[NetworkId, Dict[str, Any]] = {
    "monad-testnet": {
        "id": "monad-testnet",
        "name": "Monad Testnet",
        "chain_id": 10143,
        "currency": "MON",
        "rpc": "https://testnet-rpc.monad.xyz",
        "explorer": "https://testnet.monadvision.com",
        "explorer_alt": "https://testnet.monadscan.com",
        "faucet": "https://testnet.monad.xyz",
        "docs_deploy": "https://docs.monad.xyz/guides/deploy-smart-contract/foundry",
        "docs_verify": "https://docs.monad.xyz/guides/verify-smart-contract/foundry",
        "sourcify_url": "https://sourcify-api-monad.blockvision.org/",
    },
    "monad-mainnet": {
        "id": "monad-mainnet",
        "name": "Monad Mainnet",
        "chain_id": 143,
        "currency": "MON",
        "rpc": "https://rpc.monad.xyz",
        "explorer": "https://monadvision.com",
        "explorer_alt": "https://monadscan.com",
        "faucet": None,
        "docs_deploy": "https://docs.monad.xyz/guides/deploy-smart-contract/foundry",
        "docs_verify": "https://docs.monad.xyz/guides/verify-smart-contract/foundry",
        "sourcify_url": "https://sourcify-api-monad.blockvision.org/",
    },
}

CONTRACT_ORDER = [
    "PolicyKernel",
    "ReceiptChain",
    "AgentRegistry",
    "ProposalBook",
    "ExecutionRouter",
    "SovereignVault",
]

PILLARS = [
    {
        "id": "studio",
        "name": "STUDIO",
        "role": "AI IDE path — objective → manifest → deploy plan",
    },
    {
        "id": "codex",
        "name": "CODEX",
        "role": "Ecosystem atlas — protocols, RPC, explorers",
    },
    {
        "id": "nomos",
        "name": "NOMOS",
        "role": "Policy kernel — agents propose, laws decide",
    },
    {
        "id": "academy",
        "name": "ACADEMY",
        "role": "Failure-first school for humans and AI agents",
    },
]


def get_network(network: NetworkId | str) -> Dict[str, Any]:
    key: NetworkId = "monad-testnet"
    if network in NETWORKS:
        key = network  # type: ignore[assignment]
    elif str(network) in ("mainnet", "monad-mainnet", "143"):
        key = "monad-mainnet"
    return dict(NETWORKS[key])


def explorer_address(network: NetworkId | str, address: str) -> str:
    net = get_network(network)
    return f"{net['explorer']}/address/{address}"
