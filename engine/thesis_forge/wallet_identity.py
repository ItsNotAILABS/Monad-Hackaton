"""Normalized public wallet identities for MonadBuilder+ and THESIS.

Secrets never enter this registry. External wallets and custody systems remain the
signers; THESIS stores public identity/capability metadata and mirrors observable
balances into governed sandbox twins.
"""
from __future__ import annotations

import json
import re
import time
import uuid
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from .receipts import seal
from .sandbox import ensure_default_sandbox, get_sandbox, set_twin

_ROOT = Path(__file__).resolve().parents[2]
_PATH = _ROOT / "receipts" / "wallet_identities.json"
_SECRET_FIELDS = {"private_key", "privatekey", "seed", "seed_phrase", "mnemonic", "secret", "privkey", "recovery_phrase"}
_CHAIN_ALIASES = {
    "10143": "eip155:10143", "testnet": "eip155:10143", "monad-testnet": "eip155:10143",
    "143": "eip155:143", "mainnet": "eip155:143", "monad-mainnet": "eip155:143",
    "ethereum": "eip155:1", "solana": "solana:mainnet",
}

ADAPTERS: dict[str, dict[str, Any]] = {
    "metamask": {"name": "MetaMask", "custody": "self_custody", "account_type": "eoa", "family": "eip1193", "capabilities": ["read_balance", "sign_message", "sign_transaction", "typed_data"]},
    "phantom": {"name": "Phantom", "custody": "self_custody", "account_type": "eoa", "family": "multichain_browser", "capabilities": ["read_balance", "sign_message", "sign_transaction", "mobile"]},
    "walletconnect": {"name": "WalletConnect v2", "custody": "self_custody", "account_type": "eoa", "family": "caip_session", "capabilities": ["read_balance", "sign_message", "sign_transaction", "typed_data", "mobile"]},
    "injected_evm": {"name": "Injected EVM", "custody": "self_custody", "account_type": "eoa", "family": "eip6963", "capabilities": ["read_balance", "sign_message", "sign_transaction", "typed_data"]},
    "rabby": {"name": "Rabby", "custody": "self_custody", "account_type": "eoa", "family": "eip6963", "capabilities": ["read_balance", "sign_message", "sign_transaction", "typed_data"]},
    "rainbow": {"name": "Rainbow", "custody": "self_custody", "account_type": "eoa", "family": "walletconnect_or_injected", "capabilities": ["read_balance", "sign_message", "sign_transaction", "mobile"]},
    "coinbase": {"name": "Coinbase Wallet", "custody": "self_custody", "account_type": "eoa", "family": "eip1193", "capabilities": ["read_balance", "sign_message", "sign_transaction", "typed_data", "mobile"]},
    "coinbase_smart_wallet": {"name": "Coinbase Smart Wallet", "custody": "smart_account", "account_type": "smart_account", "family": "erc4337", "capabilities": ["read_balance", "sign_message", "sign_transaction", "batch", "sponsor_gas"]},
    "safe": {"name": "Safe", "custody": "multisig", "account_type": "multisig", "family": "safe", "capabilities": ["read_balance", "sign_transaction", "batch", "multisig"]},
    "ledger": {"name": "Ledger", "custody": "hardware", "account_type": "hardware", "family": "hardware", "capabilities": ["read_balance", "sign_message", "sign_transaction", "hardware"]},
    "trezor": {"name": "Trezor", "custody": "hardware", "account_type": "hardware", "family": "hardware", "capabilities": ["read_balance", "sign_message", "sign_transaction", "hardware"]},
    "privy": {"name": "Privy", "custody": "embedded", "account_type": "eoa", "family": "embedded", "capabilities": ["read_balance", "sign_message", "sign_transaction", "embedded", "mobile"]},
    "dynamic": {"name": "Dynamic", "custody": "embedded", "account_type": "eoa", "family": "embedded", "capabilities": ["read_balance", "sign_message", "sign_transaction", "embedded", "mobile"]},
    "turnkey": {"name": "Turnkey", "custody": "institutional", "account_type": "eoa", "family": "policy_signer", "capabilities": ["read_balance", "sign_message", "sign_transaction", "session_keys"]},
    "fireblocks": {"name": "Fireblocks", "custody": "institutional", "account_type": "eoa", "family": "institutional_custody", "capabilities": ["read_balance", "sign_transaction", "multisig"]},
    "embedded": {"name": "Embedded Wallet", "custody": "embedded", "account_type": "eoa", "family": "embedded", "capabilities": ["read_balance", "sign_message", "sign_transaction", "embedded"]},
    "manual": {"name": "Watch-only", "custody": "watch_only", "account_type": "watch_only", "family": "watch_only", "capabilities": ["read_balance", "watch_only"]},
}

class WalletIdentity(BaseModel):
    wallet_id: str
    kind: str
    provider: str
    address: str
    chain: str = "eip155:10143"
    label: str = ""
    role: str = "user"
    custody: str = "self_custody"
    account_type: str = "eoa"
    namespace: str = "personal"
    owner_ref: str = "local"
    policy_profile: str = "owner-controlled"
    capabilities: list[str] = Field(default_factory=list)
    session_ref: str = ""
    tags: list[str] = Field(default_factory=list)
    balances: dict[str, float] = Field(default_factory=dict)
    connected: bool = True
    last_seen: float = 0.0
    metadata: dict[str, Any] = Field(default_factory=dict)

class WalletStore(BaseModel):
    schema_version: str = "thesis.wallet-identities.v1"
    primary_id: str | None = None
    wallets: dict[str, WalletIdentity] = Field(default_factory=dict)

def normalize_chain(chain: str) -> str:
    raw = str(chain or "eip155:10143").strip().lower()
    return _CHAIN_ALIASES.get(raw, raw)

def _contains_secret(value: Any) -> bool:
    if isinstance(value, dict):
        return any(str(k).lower().replace("-", "_") in _SECRET_FIELDS or _contains_secret(v) for k, v in value.items())
    if isinstance(value, list):
        return any(_contains_secret(v) for v in value)
    return False

def _validate_address(address: str, chain: str) -> str:
    address = str(address or "").strip()
    if chain.startswith("eip155:") and not re.fullmatch(r"0x[a-fA-F0-9]{40}", address):
        raise ValueError("EVM address must be 0x followed by 40 hexadecimal characters")
    if chain.startswith("solana:") and not re.fullmatch(r"[1-9A-HJ-NP-Za-km-z]{32,44}", address):
        raise ValueError("Solana address must be a base58 public key")
    return address

def _load() -> WalletStore:
    if not _PATH.exists():
        return WalletStore()
    try:
        raw = json.loads(_PATH.read_text(encoding="utf-8"))
        raw["wallets"] = {k: WalletIdentity(**v) for k, v in (raw.get("wallets") or {}).items()}
        return WalletStore(**raw)
    except Exception:
        return WalletStore()

def _save(store: WalletStore) -> None:
    _PATH.parent.mkdir(parents=True, exist_ok=True)
    _PATH.write_text(json.dumps(store.model_dump(mode="json"), indent=2), encoding="utf-8")

def architecture() -> dict[str, Any]:
    return {
        "schema": "thesis.wallet-architecture.v1",
        "identity": "CAIP-2 chain identifiers and normalized public account records",
        "roles": ["user", "agent", "learner", "educator", "operator", "treasury", "auditor", "deployer", "multisig_signer"],
        "custody_modes": ["self_custody", "smart_account", "multisig", "hardware", "embedded", "institutional", "watch_only"],
        "adapters": [{"kind": kind, **profile} for kind, profile in ADAPTERS.items()],
        "boundary": {"stores_private_keys": False, "stores_seed_phrases": False, "agent_can_sign": False, "signer": "external wallet or custody system", "twin_mode": "read-only observed state"},
    }

def register(payload: dict[str, Any]) -> WalletIdentity:
    kind = str(payload.get("kind") or "metamask")
    if kind not in ADAPTERS:
        raise ValueError(f"unsupported wallet kind: {kind}")
    profile = ADAPTERS[kind]
    chain = normalize_chain(str(payload.get("chain") or "eip155:10143"))
    address = _validate_address(str(payload.get("address") or ""), chain)
    if _contains_secret(payload):
        raise ValueError("secret material is forbidden; submit public identity and external session references only")
    store = _load()
    current = next((w for w in store.wallets.values() if w.kind == kind and w.chain == chain and w.address.lower() == address.lower()), None)
    wallet = current or WalletIdentity(wallet_id=f"wid-{uuid.uuid4().hex[:12]}", kind=kind, provider=profile["name"], address=address)
    wallet.provider = str(payload.get("provider") or wallet.provider or profile["name"])
    wallet.chain = chain
    wallet.label = str(payload.get("label") or wallet.label or f"{wallet.provider}:{address[:6]}…{address[-4:]}")
    wallet.role = str(payload.get("role") or wallet.role)
    wallet.custody = str(payload.get("custody") or profile["custody"])
    wallet.account_type = str(payload.get("account_type") or profile["account_type"])
    wallet.namespace = str(payload.get("namespace") or wallet.namespace)
    wallet.owner_ref = str(payload.get("owner_ref") or wallet.owner_ref)
    wallet.policy_profile = str(payload.get("policy_profile") or wallet.policy_profile)
    wallet.capabilities = sorted(set(profile["capabilities"] + list(payload.get("capabilities") or [])))
    wallet.session_ref = str(payload.get("session_ref") or wallet.session_ref)
    wallet.tags = sorted(set(wallet.tags + list(payload.get("tags") or [])))
    wallet.balances.update({str(k).upper(): float(v) for k, v in (payload.get("balances") or {}).items()})
    wallet.metadata = {**wallet.metadata, **(payload.get("metadata") or {}), "provider_family": profile["family"], "keys_received": False}
    wallet.connected = True
    wallet.last_seen = time.time()
    store.wallets[wallet.wallet_id] = wallet
    if not store.primary_id:
        store.primary_id = wallet.wallet_id
    _save(store)
    seal("wallet.identity.register", {"wallet_id": wallet.wallet_id, "kind": kind, "chain": chain, "role": wallet.role, "custody": wallet.custody})
    return wallet

def snapshot() -> dict[str, Any]:
    store = _load()
    wallets = list(store.wallets.values())
    return {"schema": "thesis.wallet-identities.snapshot.v1", "primary_id": store.primary_id, "wallets": [w.model_dump(mode="json") for w in wallets], "total": len(wallets), "architecture": architecture()}

def set_primary(wallet_id: str) -> WalletIdentity:
    store = _load()
    if wallet_id not in store.wallets:
        raise KeyError(wallet_id)
    store.primary_id = wallet_id
    _save(store)
    seal("wallet.identity.primary", {"wallet_id": wallet_id})
    return store.wallets[wallet_id]

def update_balances(wallet_id: str, balances: dict[str, float]) -> WalletIdentity:
    store = _load()
    if wallet_id not in store.wallets:
        raise KeyError(wallet_id)
    wallet = store.wallets[wallet_id]
    wallet.balances = {str(k).upper(): float(v) for k, v in balances.items()}
    wallet.last_seen = time.time()
    _save(store)
    seal("wallet.identity.balances", {"wallet_id": wallet_id, "symbols": sorted(wallet.balances)})
    return wallet

def remove(wallet_id: str) -> dict[str, Any]:
    store = _load()
    found = store.wallets.pop(wallet_id, None) is not None
    if store.primary_id == wallet_id:
        store.primary_id = next(iter(store.wallets), None)
    _save(store)
    seal("wallet.identity.remove", {"wallet_id": wallet_id, "found": found})
    return snapshot()

def sync_twins(wallet_id: str | None = None, sandbox_id: str | None = None) -> dict[str, Any]:
    store = _load()
    targets = [store.wallets[wallet_id]] if wallet_id and wallet_id in store.wallets else list(store.wallets.values())
    if not targets:
        raise ValueError("no wallet identities are registered")
    sandbox = get_sandbox(sandbox_id) or ensure_default_sandbox()
    synced: list[dict[str, Any]] = []
    for wallet in targets:
        for symbol, amount in wallet.balances.items():
            set_twin(sandbox.sandbox_id, symbol, amount, twin_of=f"{wallet.wallet_id}:{symbol}", source_chain=wallet.chain, synced=True)
            synced.append({"wallet_id": wallet.wallet_id, "symbol": symbol, "amount": amount, "role": wallet.role, "namespace": wallet.namespace, "policy_profile": wallet.policy_profile})
    seal("wallet.identity.sync_twins", {"sandbox_id": sandbox.sandbox_id, "wallets": len(targets), "assets": len(synced)})
    refreshed = get_sandbox(sandbox.sandbox_id)
    return {"ok": True, "sandbox_id": sandbox.sandbox_id, "synced": synced, "twins": {k: v.model_dump(mode="json") for k, v in (refreshed.twins if refreshed else {}).items()}, "boundary": "THESIS can model these balances but cannot sign or move the real funds."}
