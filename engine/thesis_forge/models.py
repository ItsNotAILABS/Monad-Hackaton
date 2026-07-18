from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, Field
from typing import Literal

class Category(str, Enum):
    DEX = "dex"
    LENDING = "lending"
    VAULT = "vault"
    STAKING = "staking"
    PERPS = "perps"
    ANALYTICS = "analytics"
    AGENT = "agent"

class Protocol(BaseModel):
    id: str
    name: str
    category: Category
    capabilities: list[str]
    adapter_status: Literal["planned", "simulated", "live"] = "planned"

class Policy(BaseModel):
    max_slippage_bps: int = Field(default=50, ge=0, le=5000)
    max_protocol_exposure_bps: int = Field(default=2000, ge=0, le=10000)
    min_liquid_reserve_bps: int = Field(default=2500, ge=0, le=10000)
    max_leverage_bps: int = Field(default=12500, ge=10000, le=100000)
    max_action_value: float = Field(default=1000, gt=0)
    require_simulation: bool = True
    allowed_categories: list[Category] = list(Category)

class BuildRequest(BaseModel):
    name: str = Field(min_length=3, max_length=60)
    objective: str = Field(min_length=12, max_length=2000)
    categories: list[Category]
    policy: Policy = Policy()
    network: Literal["monad-testnet", "monad-mainnet"] = "monad-testnet"

class Action(BaseModel):
    agent: str
    category: Category
    protocol: str
    action: str
    value: float = Field(ge=0)
    slippage_bps: int = Field(ge=0)
    resulting_protocol_exposure_bps: int = Field(ge=0)
    resulting_liquid_reserve_bps: int = Field(ge=0)
    resulting_leverage_bps: int = Field(ge=0)
    expected_gain_bps: int = 0
    risk_bps: int = Field(default=0, ge=0)

class Evaluation(BaseModel):
    accepted: bool
    violations: list[str]
    score: float

class BuildManifest(BaseModel):
    project_id: str
    name: str
    objective: str
    network: str
    chain_id: int
    protocols: list[Protocol]
    policy: Policy
    contracts: list[str]
    engines: list[str]
    generated_at: str
    manifest_hash: str
