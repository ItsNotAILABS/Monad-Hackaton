#!/usr/bin/env python3
"""Run live synthetic users from CI, Cloudflare diagnostics, or an operator shell."""
from __future__ import annotations
import argparse,json,os,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT/"engine"))
from thesis_forge.synthetic_runner import run_suite

def main():
    p=argparse.ArgumentParser(description="Exercise MonadBuilder+ and THESIS with synthetic users")
    p.add_argument("--app-url",default=os.getenv("MONADBUILDER_URL","https://monados.medinatechlabs.net")); p.add_argument("--engine-url",default=os.getenv("THESIS_URL","")); p.add_argument("--edge-url",default=os.getenv("EDGE_URL","")); p.add_argument("--ethereum-rpc-url",default=os.getenv("ETHEREUM_RPC_URL","")); p.add_argument("--cadence",choices=["smoke","full"],default="smoke"); p.add_argument("--persona",action="append",default=[]); p.add_argument("--timeout",type=float,default=15); p.add_argument("--output",default="receipts/synthetic_users/ci-latest.json"); p.add_argument("--strict",action="store_true")
    a=p.parse_args(); result=run_suite(app_url=a.app_url,engine_url=a.engine_url,edge_url=a.edge_url,ethereum_rpc_url=a.ethereum_rpc_url,cadence=a.cadence,persona_ids=a.persona,timeout=a.timeout,persist=False)
    out=ROOT/a.output; out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps({k:v for k,v in result.items() if k!="results"},indent=2)); return 1 if a.strict and not result["ok"] else 0
if __name__=="__main__": raise SystemExit(main())
