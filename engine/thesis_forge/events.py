"""Explainability events — one object for human, agent, and judge surfaces.

See docs/EXPLAINABILITY_CONTRACT.md
"""

from __future__ import annotations

import time
import uuid
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

EventStatus = Literal["pending", "running", "complete", "blocked", "failed"]


class BuildEvent(BaseModel):
    id: str
    name: str
    actor: str
    status: EventStatus
    plain_language: str
    technical_detail: str = ""
    why_it_matters: str = ""
    inputs: list[str] = Field(default_factory=list)
    outputs: list[str] = Field(default_factory=list)
    checks: list[str] = Field(default_factory=list)
    evidence: list[str] = Field(default_factory=list)
    agent_instruction: str = ""
    next_step: str = ""
    resolution: str = ""
    ts: float = Field(default_factory=time.time)
    event_uid: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump(mode="json")


def make_event(
    id: str,
    name: str,
    actor: str,
    status: EventStatus,
    plain_language: str,
    **kwargs: Any,
) -> BuildEvent:
    return BuildEvent(
        id=id,
        name=name,
        actor=actor,
        status=status,
        plain_language=plain_language,
        **kwargs,
    )


def pipeline_stages() -> List[Dict[str, str]]:
    return [
        {"id": "intent", "name": "Intent normalization", "actor": "THESIS"},
        {"id": "ecosystem-map", "name": "Ecosystem mapping", "actor": "SENSUS"},
        {"id": "architecture", "name": "Architecture composition", "actor": "MATHESIS"},
        {"id": "policy", "name": "Policy boundary", "actor": "NOMOS"},
        {"id": "codegen", "name": "Source package generation", "actor": "CODEX"},
        {"id": "validate", "name": "Static validation", "actor": "TEST"},
        {"id": "arena", "name": "Agent arena simulation", "actor": "AGORA"},
        {"id": "readiness", "name": "Wallet & network readiness", "actor": "PRAXIS"},
        {"id": "deploy", "name": "Contract deployment", "actor": "PRAXIS"},
        {"id": "verify", "name": "Contract verification", "actor": "CUSTOS"},
        {"id": "release", "name": "Release receipt", "actor": "NERVUS"},
    ]
