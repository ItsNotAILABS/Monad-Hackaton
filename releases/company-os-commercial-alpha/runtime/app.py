"""Standalone THESIS Company OS commercial API.

Run from the release directory with:
    uvicorn runtime.app:app --host 0.0.0.0 --port 8044
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .commercial_runtime import CompanyStore, MissionCreate, MissionDecision, MissionRun

DB = Path(os.environ.get("THESIS_COMPANY_DB", "receipts/company-commercial.sqlite3"))
store = CompanyStore(DB)
app = FastAPI(
    title="THESIS Company OS Commercial API",
    version="1.0.0-alpha",
    description="Durable missions, RBAC, approvals, and hash-linked audit for a miniature Monad DeFi company.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.environ.get("THESIS_CORS", "*").split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


def role(value: str | None) -> Literal["viewer", "analyst", "manager", "owner"]:
    candidate = (value or "viewer").lower()
    return candidate if candidate in {"viewer", "analyst", "manager", "owner"} else "viewer"  # type: ignore[return-value]


@app.get("/company/health")
def health():
    return {
        "status": "operational",
        "database": str(DB),
        "departments": len(store.departments()),
        "private_keys_loaded": False,
        "automatic_chain_broadcast": False,
    }


@app.get("/company")
def headquarters():
    return {
        "brief": store.brief(),
        "departments": store.departments(),
        "missions": store.missions(),
        "audit": store.audit(30),
    }


@app.get("/company/brief")
def brief():
    return store.brief()


@app.get("/company/departments")
def departments():
    return {"departments": store.departments()}


@app.get("/company/missions")
def missions(limit: int = Query(default=100, ge=1, le=500)):
    return {"missions": store.missions(limit)}


@app.post("/company/missions")
def create_mission(body: MissionCreate, x_thesis_role: str | None = Header(default=None)):
    try:
        return store.create(body, role(x_thesis_role))
    except (PermissionError, ValueError) as exc:
        raise HTTPException(status_code=403 if isinstance(exc, PermissionError) else 400, detail=str(exc)) from exc


@app.get("/company/missions/{mission_id}")
def get_mission(mission_id: str):
    try:
        return store.get(mission_id)
    except KeyError as exc:
        raise HTTPException(404, "mission not found") from exc


@app.post("/company/missions/{mission_id}/decision")
def decide_mission(mission_id: str, body: MissionDecision, x_thesis_role: str | None = Header(default=None)):
    try:
        return store.decide(mission_id, body, role(x_thesis_role))
    except KeyError as exc:
        raise HTTPException(404, "mission not found") from exc
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@app.post("/company/missions/{mission_id}/run")
def run_mission(mission_id: str, body: MissionRun, x_thesis_role: str | None = Header(default=None)):
    try:
        return store.run(mission_id, body, role(x_thesis_role))
    except KeyError as exc:
        raise HTTPException(404, "mission not found") from exc
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@app.get("/company/audit")
def audit(limit: int = Query(default=100, ge=1, le=500)):
    return {"events": store.audit(limit)}
