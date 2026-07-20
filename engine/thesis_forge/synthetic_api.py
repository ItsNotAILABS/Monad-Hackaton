"""FastAPI surface for live synthetic users."""
from __future__ import annotations
import os,time
from typing import Any
from fastapi import APIRouter,Header,HTTPException
from pydantic import BaseModel,Field
from .synthetic_models import payload
from .synthetic_runner import latest_run,run_suite
router=APIRouter(prefix="/synthetic",tags=["synthetic-users"]); _LAST=0.0
class RunIn(BaseModel):
    app_url:str|None=None; engine_url:str|None=None; edge_url:str|None=None; ethereum_rpc_url:str|None=None
    cadence:str=Field(default="smoke",pattern="^(smoke|full)$"); personas:list[str]=Field(default_factory=list); timeout:float=Field(default=15,ge=2,le=60)
def auth(token):
    expected=os.getenv("SYNTHETIC_RUN_TOKEN","").strip()
    if expected and token!=expected: raise HTTPException(401,"invalid synthetic run token")
@router.get("/personas")
def personas()->dict[str,Any]: return payload()
@router.get("/status")
def status()->dict[str,Any]: return latest_run()
@router.post("/run")
def run(body:RunIn|None=None,x_synthetic_token:str|None=Header(default=None))->dict[str,Any]:
    global _LAST; auth(x_synthetic_token); now=time.time()
    if now-_LAST<30: raise HTTPException(429,"synthetic suite cooldown: retry after 30 seconds")
    _LAST=now; b=body or RunIn()
    return run_suite(app_url=b.app_url,engine_url=b.engine_url,edge_url=b.edge_url,ethereum_rpc_url=b.ethereum_rpc_url,cadence=b.cadence,persona_ids=b.personas,timeout=b.timeout,persist=True)
