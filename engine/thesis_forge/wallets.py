"""User wallet linking — Phantom, MetaMask/EVM, WalletConnect-style sessions.

Security
--------
- We store **public** connection metadata + user-attested balances only.
- No private keys, seed phrases, or Phantom encrypted key material.
- Browser injects public address + optional balance snapshot after user approves.
- Backend can optionally RPC-read EVM native balance for sync proof.
"""

from __future__ import annotations

import json
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from .receipts import seal
from .rpc_probe import probe_network
from .sandbox import ensure_default_sandbox, set_twin

_ROOT = Path(__file__).resolve().parents[2]
_PATH = _ROOT / "receipts" / "wallet_links.json"

WalletKind = Literal["phantom", "metamask", "walletconnect", "injected_evm", "manual"]


class LinkedWallet(BaseModel):
    link_id: str
    kind: WalletKind
    address: str
    label: str = ""
    chain: str = "solana"  # solana | eip155:10143 | eip155:143
    connected: bool = True
    balances: Dict[str, float] = Field(default_factory=dict)  # symbol -> amount (attested)
    last_seen: float = 0.0
    meta: Dict[str, Any] = Field(default_factory=dict)


class WalletRegistry(BaseModel):
    schema_version: str = "thesis.wallets.v1"
    links: Dict[str, LinkedWallet] = Field(default_factory=dict)
    primary_id: Optional[str] = None


SUPPORTED = [
    {
        "kind": "phantom",
        "name": "Phantom",
        "chains": ["solana", "eip155:10143", "eip155:143"],
        "note": "Browser extension — user approves connect; we only receive public pubkey + attested balances.",
        "connect": "window.phantom?.solana or multi-chain provider",
    },
    {
        "kind": "metamask",
        "name": "MetaMask",
        "chains": ["eip155:10143", "eip155:143", "eip155:1"],
        "note": "EVM injected provider eth_requestAccounts. Monad: chain 10143 / 143.",
        "connect": "window.ethereum",
    },
    {
        "kind": "walletconnect",
        "name": "WalletConnect",
        "chains": ["eip155:10143", "eip155:143"],
        "note": "Mobile wallets via WC session — public accounts only on backend.",
        "connect": "WalletConnect v2 (frontend)",
    },
    {
        "kind": "injected_evm",
        "name": "Injected EVM",
        "chains": ["eip155:10143", "eip155:143"],
        "note": "Rabby, Rainbow, Coinbase Wallet inject, etc.",
        "connect": "window.ethereum",
    },
    {
        "kind": "manual",
        "name": "Watch-only / manual",
        "chains": ["solana", "eip155:10143", "eip155:143"],
        "note": "Paste address + attested balances for twin sync without extension.",
        "connect": "manual form",
    },
]


def _load() -> WalletRegistry:
    if _PATH.exists():
        try:
            raw = json.loads(_PATH.read_text(encoding="utf-8"))
            links = {
                k: LinkedWallet(**v) if isinstance(v, dict) else v
                for k, v in (raw.get("links") or {}).items()
            }
            raw["links"] = links
            return WalletRegistry(**raw)
        except Exception:
            pass
    return WalletRegistry()


def _save(reg: WalletRegistry) -> None:
    _PATH.parent.mkdir(parents=True, exist_ok=True)
    _PATH.write_text(json.dumps(reg.model_dump(mode="json"), indent=2), encoding="utf-8")


def list_supported() -> List[Dict[str, Any]]:
    return list(SUPPORTED)


def link_wallet(
    kind: WalletKind,
    address: str,
    *,
    chain: str = "eip155:10143",
    label: str = "",
    balances: Optional[Dict[str, float]] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> LinkedWallet:
    if not address or len(address) < 8:
        raise ValueError("address required")
    # Never accept fields that look like secrets
    m = meta or {}
    for bad in ("private_key", "seed", "mnemonic", "secret", "privkey"):
        if bad in m or bad in (balances or {}):
            raise ValueError("refusing secret material — public address + balances only")

    reg = _load()
    lid = f"w-{uuid.uuid4().hex[:10]}"
    w = LinkedWallet(
        link_id=lid,
        kind=kind,
        address=address,
        label=label or f"{kind}:{address[:6]}…{address[-4:]}",
        chain=chain,
        connected=True,
        balances=dict(balances or {}),
        last_seen=time.time(),
        meta={**(meta or {}), "keys_received": False},
    )
    reg.links[lid] = w
    if not reg.primary_id:
        reg.primary_id = lid
    _save(reg)
    seal("wallet.link", {"link_id": lid, "kind": kind, "address": address[:10] + "…"})
    return w


def update_balances(link_id: str, balances: Dict[str, float]) -> LinkedWallet:
    reg = _load()
    w = reg.links.get(link_id)
    if not w:
        raise KeyError(link_id)
    w.balances = {str(k).upper(): float(v) for k, v in balances.items()}
    w.last_seen = time.time()
    _save(reg)
    return w


def unlink(link_id: str) -> None:
    reg = _load()
    reg.links.pop(link_id, None)
    if reg.primary_id == link_id:
        reg.primary_id = next(iter(reg.links), None)
    _save(reg)


def registry_snapshot() -> Dict[str, Any]:
    reg = _load()
    return {
        "schema": "thesis.wallets.snapshot.v1",
        "supported": list_supported(),
        "links": [w.model_dump(mode="json") for w in reg.links.values()],
        "primary_id": reg.primary_id,
        "security": {
            "stores_private_keys": False,
            "stores_seeds": False,
            "ai_can_export_keys": False,
            "sync_mode": "user-attested balances and optional EVM eth_getBalance",
        },
    }


def sync_twins_from_wallets(
    sandbox_id: Optional[str] = None,
    *,
    link_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Mirror linked wallet balances into AI sandbox digital twins."""
    from .sandbox import get_sandbox

    reg = _load()
    sb = get_sandbox(sandbox_id) or ensure_default_sandbox()
    targets = [reg.links[link_id]] if link_id and link_id in reg.links else list(reg.links.values())
    if not targets:
        return {"ok": False, "error": "no linked wallets — connect Phantom/MetaMask first", "sandbox_id": sb.sandbox_id}

    synced = []
    for w in targets:
        for sym, amt in (w.balances or {}).items():
            twin_of = f"{w.kind}:{w.chain}:{sym}"
            set_twin(
                sb.sandbox_id,
                sym,
                float(amt),
                twin_of=twin_of,
                source_chain=w.chain,
                synced=True,
            )
            synced.append({"symbol": sym, "amount": amt, "from": w.label})
        # Optional: try EVM native balance if chain is monad and balance missing
        if w.chain.startswith("eip155:") and "MON" not in {k.upper() for k in (w.balances or {})}:
            try:
                bal = _rpc_eth_balance(w.address, w.chain)
                if bal is not None:
                    set_twin(
                        sb.sandbox_id,
                        "MON",
                        bal,
                        twin_of=f"{w.kind}:{w.chain}:native",
                        source_chain=w.chain,
                        synced=True,
                    )
                    synced.append({"symbol": "MON", "amount": bal, "from": w.label, "via": "rpc"})
            except Exception:
                pass

    seal("wallet.sync_twins", {"sandbox_id": sb.sandbox_id, "n": len(synced)})
    sb = get_sandbox(sb.sandbox_id)
    return {
        "ok": True,
        "sandbox_id": sb.sandbox_id if sb else None,
        "synced": synced,
        "twins": {k: v.model_dump(mode="json") for k, v in (sb.twins if sb else {}).items()},
        "note": "Twins are sandbox mirrors. AI cannot move real Phantom/MetaMask funds.",
    }


def _rpc_eth_balance(address: str, chain: str) -> Optional[float]:
    """Read native balance via public RPC when possible."""
    import urllib.request

    if "143" in chain and "10143" not in chain:
        rpc = "https://rpc.monad.xyz"
    else:
        rpc = "https://testnet-rpc.monad.xyz"
    body = json.dumps(
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_getBalance",
            "params": [address, "latest"],
        }
    ).encode()
    req = urllib.request.Request(rpc, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=6) as resp:
        data = json.loads(resp.read().decode())
    hex_bal = data.get("result")
    if not hex_bal:
        return None
    wei = int(hex_bal, 16)
    return wei / 1e18
