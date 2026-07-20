"""Live synthetic-user runner for MonadBuilder+ and THESIS."""
from __future__ import annotations
import json, os, time, urllib.error, urllib.parse, urllib.request, uuid
from pathlib import Path
from typing import Any, Iterable
from .synthetic_models import PERSONAS, Persona, Step, payload
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'receipts'/'synthetic_users'; ETH_PATHS=('/ethereum','/eth','/rpc/ethereum','/web3','/rpc')

def base(v): return str(v or '').strip().rstrip('/')
def request(url,method='GET',body=None,timeout=15,headers=None):
    data=json.dumps(body).encode() if body is not None else None; started=time.perf_counter()
    req=urllib.request.Request(url,data=data,method=method,headers={'accept':'application/json','content-type':'application/json',**(headers or {})})
    try:
        with urllib.request.urlopen(req,timeout=timeout) as r:
            raw=r.read().decode(errors='replace'); status=r.status
    except urllib.error.HTTPError as e:
        raw=e.read().decode(errors='replace'); status=e.code
    except Exception as e:
        return 0,{'error':str(e)},round((time.perf_counter()-started)*1000,2)
    try: obj=json.loads(raw) if raw else {}
    except json.JSONDecodeError: obj={'raw':raw[:1000]}
    return status,obj,round((time.perf_counter()-started)*1000,2)

def checks(step:Step,status:int,data:Any,ms:float):
    out=[]
    for rule in step.checks:
        ok=False; detail=None
        if rule=='http_2xx': ok,detail=200<=status<300,status
        elif rule=='json': ok,detail=isinstance(data,(dict,list)),type(data).__name__
        elif rule=='nonempty': ok,detail=bool(data),'response contains data'
        elif rule=='latency': ok,detail=ms<=20000,ms
        elif rule=='schema': ok,detail=isinstance(data,dict) and any(k in data for k in ('schema','status','ok','product')),sorted(data)[:10] if isinstance(data,dict) else None
        elif rule=='jsonrpc': ok,detail=isinstance(data,dict) and data.get('jsonrpc')=='2.0' and 'error' not in data,data.get('jsonrpc') if isinstance(data,dict) else None
        elif rule=='ethereum_chain_id':
            v=data.get('result') if isinstance(data,dict) else None; ok,detail=v in ('0x1',1,'1'),v
        elif rule=='hex_result':
            v=data.get('result') if isinstance(data,dict) else None; ok,detail=isinstance(v,str) and v.startswith('0x') and len(v)>2,v
        out.append({'rule':rule,'passed':ok,'detail':detail})
    return out

def discover_eth(app,explicit,timeout,headers):
    candidates=([base(explicit)] if explicit else [])+[f'{base(app)}{p}' for p in ETH_PATHS]
    probe={'jsonrpc':'2.0','id':99,'method':'eth_chainId','params':[]}
    for candidate in candidates:
        status,data,_=request(candidate,'POST',probe,timeout,headers)
        if 200<=status<300 and isinstance(data,dict) and data.get('result') in ('0x1',1,'1'): return candidate
    return ''

def select(ids:Iterable[str]|None):
    wanted={x.strip() for x in (ids or []) if x.strip()}; return [p for p in PERSONAS if not wanted or p.id in wanted]

def run_suite(*,app_url=None,engine_url=None,edge_url=None,ethereum_rpc_url=None,cadence='smoke',persona_ids=None,timeout=15,persist=True):
    app=base(app_url or os.getenv('MONADBUILDER_URL') or 'https://monados.medinatechlabs.net')
    engine=base(engine_url or os.getenv('THESIS_URL')) or f'{app}/engine'; edge=base(edge_url or os.getenv('EDGE_URL'))
    run_id=f'syn-{uuid.uuid4().hex[:12]}'; headers={'x-synthetic-user':run_id,'user-agent':'MonadBuilder-Synthetic-Users/1.0'}
    eth=discover_eth(app,base(ethereum_rpc_url or os.getenv('ETHEREUM_RPC_URL')),timeout,headers); origins={'app':app,'engine':engine,'edge':edge,'ethereum':eth}
    started=time.time(); results=[]; total=passed=0
    for persona in select(persona_ids):
        pr={'id':persona.id,'name':persona.name,'role':persona.role,'goal':persona.goal,'steps':[]}
        for step in persona.steps:
            if cadence=='smoke' and step.cadence!='smoke': continue
            origin=origins.get(step.target,''); url=f'{base(origin)}{step.path}' if origin else ''
            if url: status,data,ms=request(url,step.method,step.body,timeout,headers); cs=checks(step,status,data,ms)
            else: status,data,ms=0,{'error':f'{step.target} origin not configured'},0.0; cs=[{'rule':r,'passed':False,'detail':data['error']} for r in step.checks]
            total+=len(cs); passed+=sum(c['passed'] for c in cs)
            preview=data if isinstance(data,dict) and len(json.dumps(data))<2500 else str(data)[:1000]
            pr['steps'].append({'id':step.id,'target':step.target,'url':url,'method':step.method,'mutability':step.mutability,'status':status,'latency_ms':ms,'passed':all(c['passed'] for c in cs),'assertions':cs,'response_preview':preview})
        pr['passed']=bool(pr['steps']) and all(s['passed'] for s in pr['steps']); results.append(pr)
    done=time.time(); summary={'schema':'thesis.synthetic.run.v1','run_id':run_id,'cadence':cadence,'started_at':started,'finished_at':done,'duration_ms':round((done-started)*1000,2),'origins':origins,'personas':len(results),'personas_passed':sum(r['passed'] for r in results),'assertions':total,'assertions_passed':passed,'pass_rate':round(passed/total,4) if total else 0.0,'ok':total>0 and passed==total,'safety':payload()['safety'],'results':results}
    if persist:
        OUT.mkdir(parents=True,exist_ok=True); (OUT/'latest.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
        with (OUT/'history.jsonl').open('a',encoding='utf-8') as h: h.write(json.dumps({k:v for k,v in summary.items() if k!='results'})+'\n')
        try:
            from .receipts import seal
            summary['receipt']=seal('synthetic-users.run',{k:v for k,v in summary.items() if k not in ('results','receipt')})
        except Exception as e: summary['receipt_error']=str(e)
    return summary

def latest_run():
    p=OUT/'latest.json'
    if not p.exists(): return {'schema':'thesis.synthetic.status.v1','status':'never_run'}
    try: return json.loads(p.read_text(encoding='utf-8'))
    except Exception as e: return {'schema':'thesis.synthetic.status.v1','status':'invalid','error':str(e)}
