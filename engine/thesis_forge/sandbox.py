"""Sandbox technology — isolated execution for AI + twin assets.

Doctrine
--------
1. Real user keys NEVER enter the sandbox or AI process.
2. AI may only mutate **digital twin** balances inside a named sandbox.
3. Sync pulls *observed* balances from connected wallets (user-attested or RPC read).
4. Promote-to-chain requires explicit user signature outside this module.
5. Every sandbox action is receipt-sealed and can be frozen/killed.

Sandboxes are first-class technology in THESIS — not an afterthought demo flag.
"""

from __future__ import annotations

import json
import time
import uuid
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .receipts import seal

_ROOT = Path(__file__).resolve().parents[2]
_PATH = _ROOT / "receipts" / "sandboxes.json"


class SandboxMode(str, Enum):
    LEARN = "learn"  # academy / teach-by-doing
    TRADE = "trade"  # desk paper + twin trades
    AGENT = "agent"  # AI node free exploration under policy
    FROZEN = "frozen"  # kill switch


class TwinBalance(BaseModel):
    symbol: str
    amount: float = 0.0
    twin_of: str = ""  # source wallet asset key e.g. phantom:SOL or eip155:10143:native
    source_chain: str = ""
    last_sync_at: float = 0.0
    synced: bool = False


class SandboxEvent(BaseModel):
    event_id: str
    kind: str
    detail: str
    ts: float
    ok: bool = True


class Sandbox(BaseModel):
    sandbox_id: str
    name: str
    mode: SandboxMode = SandboxMode.LEARN
    owner_session: str = "local"
    created_at: float = 0.0
    updated_at: float = 0.0
    twins: Dict[str, TwinBalance] = Field(default_factory=dict)
    events: List[SandboxEvent] = Field(default_factory=list)
    policy_tags: List[str] = Field(default_factory=lambda: ["no-real-keys", "twin-only", "user-promote"])
    ai_node_id: Optional[str] = None
    killed: bool = False
    meta: Dict[str, Any] = Field(default_factory=dict)

    def log(self, kind: str, detail: str, ok: bool = True) -> None:
        self.events.insert(
            0,
            SandboxEvent(
                event_id=f"se-{uuid.uuid4().hex[:10]}",
                kind=kind,
                detail=detail,
                ts=time.time(),
                ok=ok,
            ),
        )
        self.events = self.events[:100]
        self.updated_at = time.time()


class SandboxStore(BaseModel):
    schema_version: str = "thesis.sandbox.v1"
    sandboxes: Dict[str, Sandbox] = Field(default_factory=dict)
    active_id: Optional[str] = None


def _load() -> SandboxStore:
    if _PATH.exists():
        try:
            raw = json.loads(_PATH.read_text(encoding="utf-8"))
            sbs = {}
            for k, v in (raw.get("sandboxes") or {}).items():
                if "twins" in v and isinstance(v["twins"], dict):
                    v["twins"] = {
                        tk: TwinBalance(**tv) if isinstance(tv, dict) else tv
                        for tk, tv in v["twins"].items()
                    }
                if "events" in v:
                    v["events"] = [
                        SandboxEvent(**e) if isinstance(e, dict) else e for e in v["events"]
                    ]
                sbs[k] = Sandbox(**v)
            raw["sandboxes"] = sbs
            return SandboxStore(**raw)
        except Exception:
            pass
    return SandboxStore()


def _save(store: SandboxStore) -> None:
    _PATH.parent.mkdir(parents=True, exist_ok=True)
    _PATH.write_text(json.dumps(store.model_dump(mode="json"), indent=2), encoding="utf-8")


def create_sandbox(
    name: str = "Primary sandbox",
    mode: SandboxMode = SandboxMode.AGENT,
    *,
    ai_node_id: Optional[str] = None,
) -> Sandbox:
    store = _load()
    sid = f"sbx-{uuid.uuid4().hex[:12]}"
    sb = Sandbox(
        sandbox_id=sid,
        name=name,
        mode=mode,
        created_at=time.time(),
        updated_at=time.time(),
        ai_node_id=ai_node_id,
        meta={
            "technology": "THESIS Sandbox Runtime",
            "isolation": "process-logical + twin ledger + policy tags",
            "real_keys": False,
        },
    )
    sb.log("create", f"Sandbox created mode={mode.value}")
    store.sandboxes[sid] = sb
    store.active_id = sid
    _save(store)
    seal("sandbox.create", {"sandbox_id": sid, "mode": mode.value})
    return sb


def list_sandboxes() -> List[Dict[str, Any]]:
    store = _load()
    return [
        {
            "sandbox_id": s.sandbox_id,
            "name": s.name,
            "mode": s.mode.value,
            "killed": s.killed,
            "twin_count": len(s.twins),
            "ai_node_id": s.ai_node_id,
            "updated_at": s.updated_at,
        }
        for s in store.sandboxes.values()
    ]


def get_sandbox(sandbox_id: Optional[str] = None) -> Optional[Sandbox]:
    store = _load()
    sid = sandbox_id or store.active_id
    if not sid:
        return None
    return store.sandboxes.get(sid)


def save_sandbox(sb: Sandbox) -> None:
    store = _load()
    store.sandboxes[sb.sandbox_id] = sb
    store.active_id = sb.sandbox_id
    _save(store)


def kill_sandbox(sandbox_id: str) -> Sandbox:
    sb = get_sandbox(sandbox_id)
    if not sb:
        raise KeyError(sandbox_id)
    sb.killed = True
    sb.mode = SandboxMode.FROZEN
    sb.log("kill", "Sandbox frozen — AI cannot mutate twins", ok=True)
    save_sandbox(sb)
    seal("sandbox.kill", {"sandbox_id": sandbox_id})
    return sb


def ensure_default_sandbox() -> Sandbox:
    store = _load()
    if store.active_id and store.active_id in store.sandboxes:
        sb = store.sandboxes[store.active_id]
        if not sb.killed:
            return sb
    return create_sandbox("Daily AI sandbox", SandboxMode.AGENT)


def set_twin(
    sandbox_id: str,
    symbol: str,
    amount: float,
    *,
    twin_of: str,
    source_chain: str,
    synced: bool = True,
) -> Sandbox:
    sb = get_sandbox(sandbox_id)
    if not sb:
        raise KeyError(sandbox_id)
    if sb.killed:
        raise RuntimeError("sandbox frozen")
    key = symbol.upper()
    sb.twins[key] = TwinBalance(
        symbol=key,
        amount=float(amount),
        twin_of=twin_of,
        source_chain=source_chain,
        last_sync_at=time.time(),
        synced=synced,
    )
    sb.log("twin_set", f"{key}={amount} twin_of={twin_of} synced={synced}")
    save_sandbox(sb)
    return sb


def mutate_twin(
    sandbox_id: str,
    symbol: str,
    delta: float,
    *,
    reason: str,
) -> Sandbox:
    """AI-only mutation path — twins only, never real chain."""
    sb = get_sandbox(sandbox_id)
    if not sb:
        raise KeyError(sandbox_id)
    if sb.killed or sb.mode == SandboxMode.FROZEN:
        raise RuntimeError("sandbox frozen")
    key = symbol.upper()
    twin = sb.twins.get(key)
    if not twin:
        raise ValueError(f"no twin for {key} — sync wallet first")
    new_amt = twin.amount + delta
    if new_amt < -1e-12:
        raise ValueError("insufficient twin balance")
    twin.amount = max(0.0, new_amt)
    twin.synced = False  # diverged until next mirror sync
    sb.twins[key] = twin
    sb.log("twin_mutate", f"{key} delta={delta} reason={reason} → {twin.amount}")
    save_sandbox(sb)
    seal(
        "sandbox.twin_mutate",
        {"sandbox_id": sandbox_id, "symbol": key, "delta": delta, "reason": reason},
    )
    return sb


def sandbox_snapshot(sandbox_id: Optional[str] = None) -> Dict[str, Any]:
    sb = get_sandbox(sandbox_id) or ensure_default_sandbox()
    return {
        "schema": "thesis.sandbox.snapshot.v1",
        "sandbox": sb.model_dump(mode="json"),
        "doctrine": [
            "Real keys never enter the sandbox",
            "AI spends only digital twins",
            "Sync mirrors user-attested or RPC-observed balances",
            "Chain promote requires user signature outside sandbox",
            "Kill switch freezes all AI mutations",
        ],
        "technology": "sandbox-as-platform",
    }
