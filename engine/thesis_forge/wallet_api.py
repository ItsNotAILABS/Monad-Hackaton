"""FastAPI routes for normalized wallet identities."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from .wallet_identity import architecture, register, remove, set_primary, snapshot, sync_twins, update_balances

router = APIRouter()


class WalletIdentityIn(BaseModel):
    kind: str = "metamask"
    address: str
    chain: str = "eip155:10143"
    label: str = ""
    provider: str = ""
    role: str = "user"
    custody: str | None = None
    account_type: str | None = None
    namespace: str = "personal"
    owner_ref: str = "local"
    policy_profile: str = "owner-controlled"
    capabilities: list[str] = Field(default_factory=list)
    session_ref: str = ""
    tags: list[str] = Field(default_factory=list)
    balances: dict[str, float] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class BalanceIn(BaseModel):
    balances: dict[str, float]


@router.get("/wallets/architecture")
def wallet_architecture():
    return architecture()


@router.get("/wallets/v2")
def wallet_list():
    return snapshot()


@router.post("/wallets/v2/link")
def wallet_link(body: WalletIdentityIn):
    try:
        wallet = register(body.model_dump())
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return {"wallet": wallet.model_dump(mode="json"), "registry": snapshot()}


@router.post("/wallets/v2/{wallet_id}/primary")
def wallet_primary(wallet_id: str):
    try:
        wallet = set_primary(wallet_id)
    except KeyError:
        raise HTTPException(404, "wallet identity not found") from None
    return {"wallet": wallet.model_dump(mode="json"), "registry": snapshot()}


@router.post("/wallets/v2/{wallet_id}/balances")
def wallet_balances(wallet_id: str, body: BalanceIn):
    try:
        wallet = update_balances(wallet_id, body.balances)
    except KeyError:
        raise HTTPException(404, "wallet identity not found") from None
    return {"wallet": wallet.model_dump(mode="json")}


@router.delete("/wallets/v2/{wallet_id}")
def wallet_delete(wallet_id: str):
    return remove(wallet_id)


@router.post("/wallets/v2/sync-twins")
def wallet_sync(wallet_id: str | None = Query(None), sandbox_id: str | None = Query(None)):
    try:
        return sync_twins(wallet_id=wallet_id, sandbox_id=sandbox_id)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
