"""Company OS domain models — commercial mission lifecycle."""

from __future__ import annotations

import time
import uuid
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class Dept(str, Enum):
    THESIS = "THESIS"  # General Manager
    SENSUS = "SENSUS"
    MATHESIS = "MATHESIS"
    NOMOS = "NOMOS"
    AGORA = "AGORA"
    PRAXIS = "PRAXIS"
    CUSTOS = "CUSTOS"
    MEMORIA = "MEMORIA"
    ACADEMY = "ACADEMY"
    NERVUS = "NERVUS"


class MissionStatus(str, Enum):
    DRAFT = "draft"
    RESEARCHING = "researching"
    SIMULATING = "simulating"
    RISK_REVIEW = "risk_review"
    STRATEGY = "strategy"
    SECURITY = "security"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    EXECUTING = "executing"
    COMPLETED = "completed"
    REJECTED = "rejected"
    BLOCKED = "blocked"
    SUPERSEDED = "superseded"


class Priority(str, Enum):
    URGENT = "urgent"
    RECOMMENDED = "recommended"
    OPTIONAL = "optional"
    LEARNING = "learning"
    REJECTED = "rejected"


class ServiceLevel(BaseModel):
    """Commercial SLA for a department or mission class."""

    id: str
    name: str
    max_latency_ms: int = 5000
    requires_simulation: bool = True
    requires_user_approval: bool = True
    requires_custos: bool = True
    max_retries: int = 2
    description: str = ""


class Constitution(BaseModel):
    """Owner's financial laws — NOMOS constitution."""

    owner_label: str = "Wallet Owner"
    objective_default: str = (
        "Grow my Monad position, keep 30% liquid, avoid leverage, and teach me what is happening."
    )
    min_liquid_reserve_bps: int = 3000  # 30%
    max_protocol_exposure_bps: int = 2000  # 20%
    max_slippage_bps: int = 50
    max_leverage_bps: int = 10000  # 1x
    max_action_value: float = 500.0
    allow_leverage: bool = False
    allow_perps: bool = False
    approved_assets: List[str] = Field(
        default_factory=lambda: ["MON", "USDC", "USDT", "WETH", "WMON", "SOL"]
    )
    mandatory_simulation: bool = True
    mandatory_explanation: bool = True
    agent_budget_usdc: float = 1000.0
    network: Literal["monad-testnet", "monad-mainnet"] = "monad-testnet"


class DepartmentReport(BaseModel):
    department: Dept
    status: Literal["ok", "warn", "block", "skip"] = "ok"
    summary: str
    findings: Dict[str, Any] = Field(default_factory=dict)
    latency_ms: float = 0.0
    sla_id: str = "default"
    sla_met: bool = True


class StrategyProposal(BaseModel):
    agent: str
    title: str
    thesis: str
    expected_return_bps: int = 0
    risk_bps: int = 0
    steps: List[str] = Field(default_factory=list)
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    score: float = 0.0
    lawful: bool = True
    violations: List[str] = Field(default_factory=list)


class Mission(BaseModel):
    mission_id: str = Field(default_factory=lambda: f"m-{uuid.uuid4().hex[:12]}")
    title: str
    objective: str
    status: MissionStatus = MissionStatus.DRAFT
    priority: Priority = Priority.RECOMMENDED
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    departments_involved: List[Dept] = Field(default_factory=list)
    reports: List[DepartmentReport] = Field(default_factory=list)
    proposals: List[StrategyProposal] = Field(default_factory=list)
    winner: Optional[StrategyProposal] = None
    expected_outcome: str = ""
    risks: List[str] = Field(default_factory=list)
    transactions: List[Dict[str, Any]] = Field(default_factory=list)
    explanation: str = ""
    academy_lesson: str = ""
    simulation: Dict[str, Any] = Field(default_factory=dict)
    security: Dict[str, Any] = Field(default_factory=dict)
    user_decision: Optional[Literal["approve", "reject", "revise", "simulate_again"]] = None
    result: Dict[str, Any] = Field(default_factory=dict)
    receipt_hash: str = ""
    sla: ServiceLevel = Field(
        default_factory=lambda: ServiceLevel(
            id="mission-standard",
            name="Standard mission",
            max_latency_ms=15000,
            description="Full company pipeline under 15s for research path",
        )
    )
    tags: List[str] = Field(default_factory=list)


class CompanyMetrics(BaseModel):
    missions_total: int = 0
    missions_completed: int = 0
    missions_rejected: int = 0
    policy_blocks: int = 0
    time_saved_minutes: float = 0.0
    idle_capital_reduced_usdc: float = 0.0
    yield_earned_bps_est: float = 0.0
    unnecessary_tx_avoided: int = 0
    gas_saved_estimate: float = 0.0
    lessons_completed: int = 0
    agent_accuracy_hits: int = 0
    agent_accuracy_total: int = 0


class CompanyState(BaseModel):
    schema_version: str = "thesis.company.os.v1"
    company_name: str = "THESIS — Your Monad DeFi Company"
    constitution: Constitution = Field(default_factory=Constitution)
    missions: List[Mission] = Field(default_factory=list)
    metrics: CompanyMetrics = Field(default_factory=CompanyMetrics)
    last_brief_at: float = 0.0
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
