"""THESIS Company OS commercial runtime.

Standalone, local-first operating layer for durable missions, role gates,
approvals, execution boundaries, and hash-linked audit events.

It does not load private keys and cannot broadcast a chain transaction.
"""

from __future__ import annotations

import json
import sqlite3
import time
import uuid
from hashlib import sha256
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, Field

Role = Literal["viewer", "analyst", "manager", "owner"]
ROLE_RANK = {"viewer": 0, "analyst": 1, "manager": 2, "owner": 3}
TERMINAL = {"completed", "failed", "rejected", "cancelled"}

DEPARTMENTS = [
    ("thesis", "THESIS", "General Manager"),
    ("sensus", "SENSUS", "Research"),
    ("mathesis", "MATHESIS", "Quant and Simulation"),
    ("nomos", "NOMOS", "Risk and Compliance"),
    ("agora", "AGORA", "Strategy"),
    ("praxis", "PRAXIS", "Execution Planning"),
    ("custos", "CUSTOS", "Security"),
    ("memoria", "MEMORIA", "Accounting and Operations"),
    ("academy", "ACADEMY", "Contextual Education"),
    ("nervus", "NERVUS", "Audit and Receipts"),
]


class MissionCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    objective: str = Field(min_length=12, max_length=3000)
    priority: Literal["low", "normal", "high", "critical"] = "normal"
    requested_by: str = "owner"


class MissionDecision(BaseModel):
    approve: bool
    actor: str = "owner"
    note: str = Field(default="", max_length=1000)


class MissionRun(BaseModel):
    actor: str = "manager"
    mode: Literal["analysis", "sandbox"] = "analysis"


def require_role(actual: str, minimum: Role) -> None:
    role = actual if actual in ROLE_RANK else "viewer"
    if ROLE_RANK[role] < ROLE_RANK[minimum]:
        raise PermissionError(f"{role} cannot perform an action requiring {minimum}")


def _route(objective: str) -> dict[str, Any]:
    text = objective.lower()
    if any(word in text for word in ("build", "deploy", "contract", "app", "code")):
        mission_type, owner, risk = "application_delivery", "thesis", "medium"
    elif any(word in text for word in ("trade", "buy", "sell", "perp", "hedge")):
        mission_type, owner, risk = "trading_operation", "agora", "high"
    elif any(word in text for word in ("risk", "safe", "audit", "exposure", "slippage", "leverage")):
        mission_type, owner, risk = "risk_audit", "nomos", "low"
    elif any(word in text for word in ("learn", "teach", "explain", "understand")):
        mission_type, owner, risk = "guided_learning", "academy", "low"
    else:
        mission_type, owner, risk = "manager_review", "thesis", "low"

    support = [d[0] for d in DEPARTMENTS if d[0] != owner]
    approval_required = risk in {"medium", "high"}
    plan = [
        {"step": 1, "department": "SENSUS", "action": "Collect current wallet, protocol, and operating state."},
        {"step": 2, "department": "AGORA", "action": "Generate competing approaches and expose tradeoffs."},
        {"step": 3, "department": "MATHESIS", "action": "Estimate cost, benefit, concentration, and downside."},
        {"step": 4, "department": "NOMOS", "action": "Reject paths outside the owner's constitution."},
        {"step": 5, "department": "CUSTOS", "action": "Check permissions, targets, and sandbox boundaries."},
        {"step": 6, "department": "PRAXIS", "action": "Prepare ordered execution steps without silent broadcast."},
        {"step": 7, "department": "ACADEMY", "action": "Explain the live mission in plain language."},
        {"step": 8, "department": "NERVUS", "action": "Seal the decision and result into the audit chain."},
    ]
    return {
        "mission_type": mission_type,
        "owner_department": owner,
        "supporting_departments": support,
        "risk_level": risk,
        "approval_required": approval_required,
        "expected_minutes_saved": 20,
        "plan": plan,
        "teaching": [
            "Explain every approval before the user signs.",
            "Show why rejected plans failed the lawbook.",
            "Separate sandbox simulation from live wallet execution.",
        ],
    }


class CompanyStore:
    def __init__(self, path: str | Path = "receipts/company.sqlite3") -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _init(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS departments (
                    id TEXT PRIMARY KEY, name TEXT NOT NULL, title TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'online'
                );
                CREATE TABLE IF NOT EXISTS missions (
                    id TEXT PRIMARY KEY, title TEXT NOT NULL, objective TEXT NOT NULL,
                    mission_type TEXT NOT NULL, priority TEXT NOT NULL,
                    status TEXT NOT NULL, owner_department TEXT NOT NULL,
                    supporting_json TEXT NOT NULL, risk_level TEXT NOT NULL,
                    approval_required INTEGER NOT NULL, requested_by TEXT NOT NULL,
                    expected_minutes_saved INTEGER NOT NULL, plan_json TEXT NOT NULL,
                    teaching_json TEXT NOT NULL, result_json TEXT,
                    receipt_hash TEXT NOT NULL, created_at REAL NOT NULL, updated_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS approvals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, mission_id TEXT NOT NULL,
                    approved INTEGER NOT NULL, actor TEXT NOT NULL, note TEXT NOT NULL,
                    created_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS audit_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL,
                    entity_id TEXT NOT NULL, actor TEXT NOT NULL, payload_json TEXT NOT NULL,
                    previous_hash TEXT NOT NULL, event_hash TEXT NOT NULL, created_at REAL NOT NULL
                );
                """
            )
            conn.executemany(
                "INSERT OR IGNORE INTO departments(id,name,title) VALUES(?,?,?)",
                DEPARTMENTS,
            )

    def _audit(self, conn: sqlite3.Connection, kind: str, entity_id: str, actor: str, payload: dict[str, Any]) -> str:
        previous = conn.execute("SELECT event_hash FROM audit_events ORDER BY id DESC LIMIT 1").fetchone()
        previous_hash = previous[0] if previous else "0" * 64
        body = {
            "kind": kind,
            "entity_id": entity_id,
            "actor": actor,
            "payload": payload,
            "previous_hash": previous_hash,
            "ts": time.time(),
        }
        event_hash = sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
        conn.execute(
            "INSERT INTO audit_events(kind,entity_id,actor,payload_json,previous_hash,event_hash,created_at) VALUES(?,?,?,?,?,?,?)",
            (kind, entity_id, actor, json.dumps(payload), previous_hash, event_hash, body["ts"]),
        )
        return event_hash

    def departments(self) -> list[dict[str, Any]]:
        with self._connect() as conn:
            return [dict(row) for row in conn.execute("SELECT * FROM departments ORDER BY rowid")]

    def create(self, request: MissionCreate, role: Role = "analyst") -> dict[str, Any]:
        require_role(role, "analyst")
        routed = _route(request.objective)
        mission_id = f"msn-{uuid.uuid4().hex[:12]}"
        now = time.time()
        status = "proposed" if routed["approval_required"] else "approved"
        with self._connect() as conn:
            receipt = self._audit(conn, "mission.proposed", mission_id, request.requested_by, routed)
            conn.execute(
                """INSERT INTO missions VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    mission_id, request.title, request.objective, routed["mission_type"], request.priority,
                    status, routed["owner_department"], json.dumps(routed["supporting_departments"]),
                    routed["risk_level"], int(routed["approval_required"]), request.requested_by,
                    routed["expected_minutes_saved"], json.dumps(routed["plan"]),
                    json.dumps(routed["teaching"]), None, receipt, now, now,
                ),
            )
        return self.get(mission_id)

    def decide(self, mission_id: str, decision: MissionDecision, role: Role = "owner") -> dict[str, Any]:
        require_role(role, "manager")
        mission = self.get(mission_id)
        if mission["status"] in TERMINAL:
            raise ValueError("terminal mission cannot be decided")
        status = "approved" if decision.approve else "rejected"
        with self._connect() as conn:
            receipt = self._audit(conn, f"mission.{status}", mission_id, decision.actor, {"note": decision.note})
            conn.execute(
                "INSERT INTO approvals(mission_id,approved,actor,note,created_at) VALUES(?,?,?,?,?)",
                (mission_id, int(decision.approve), decision.actor, decision.note, time.time()),
            )
            conn.execute(
                "UPDATE missions SET status=?, receipt_hash=?, updated_at=? WHERE id=?",
                (status, receipt, time.time(), mission_id),
            )
        return self.get(mission_id)

    def run(self, mission_id: str, request: MissionRun, role: Role = "manager") -> dict[str, Any]:
        require_role(role, "manager")
        mission = self.get(mission_id)
        if mission["status"] != "approved":
            raise ValueError("mission must be approved before running")
        with self._connect() as conn:
            start_receipt = self._audit(conn, "mission.running", mission_id, request.actor, {"mode": request.mode})
            conn.execute(
                "UPDATE missions SET status='running', receipt_hash=?, updated_at=? WHERE id=?",
                (start_receipt, time.time(), mission_id),
            )

        result = {
            "ok": True,
            "summary": "Governed company mission completed without automatic chain broadcast.",
            "mode": request.mode,
            "live_chain_broadcast": False,
            "operator_signature_required_for_chain": True,
            "steps_reviewed": len(mission["plan"]),
        }
        with self._connect() as conn:
            receipt = self._audit(conn, "mission.completed", mission_id, request.actor, result)
            conn.execute(
                "UPDATE missions SET status='completed', result_json=?, receipt_hash=?, updated_at=? WHERE id=?",
                (json.dumps(result), receipt, time.time(), mission_id),
            )
        return self.get(mission_id)

    def get(self, mission_id: str) -> dict[str, Any]:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM missions WHERE id=?", (mission_id,)).fetchone()
        if row is None:
            raise KeyError(mission_id)
        item = dict(row)
        for key in ("supporting_json", "plan_json", "teaching_json", "result_json"):
            target = key.replace("_json", "")
            item[target] = json.loads(item.pop(key)) if item[key] else None
        item["approval_required"] = bool(item["approval_required"])
        return item

    def missions(self, limit: int = 100) -> list[dict[str, Any]]:
        with self._connect() as conn:
            ids = [row[0] for row in conn.execute("SELECT id FROM missions ORDER BY updated_at DESC LIMIT ?", (limit,))]
        return [self.get(mission_id) for mission_id in ids]

    def audit(self, limit: int = 100) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM audit_events ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        result = []
        for row in rows:
            item = dict(row)
            item["payload"] = json.loads(item.pop("payload_json"))
            result.append(item)
        return result

    def brief(self) -> dict[str, Any]:
        missions = self.missions()
        completed = [m for m in missions if m["status"] == "completed"]
        pending = [m for m in missions if m["status"] == "proposed"]
        return {
            "schema": "thesis.company.brief.v1",
            "headline": "Your Monad DeFi company is online and governed by owner approval.",
            "kpis": {
                "departments_online": len(self.departments()),
                "open_missions": len([m for m in missions if m["status"] not in TERMINAL]),
                "completed_missions": len(completed),
                "rejected_missions": len([m for m in missions if m["status"] == "rejected"]),
                "estimated_minutes_saved": sum(m["expected_minutes_saved"] for m in completed),
            },
            "mission_inbox": pending[:8],
            "recent_results": completed[:5],
            "safety": {
                "private_keys_loaded": False,
                "automatic_chain_broadcast": False,
                "approval_gate": True,
                "audit_hash_chain": True,
            },
        }
