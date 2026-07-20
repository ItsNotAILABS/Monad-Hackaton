"""Executable synthetic-user catalog for the live MonadBuilder+ / THESIS stack."""
from __future__ import annotations
from dataclasses import asdict, dataclass
from typing import Any

@dataclass(frozen=True)
class Step:
    id: str; target: str; method: str; path: str
    checks: tuple[str, ...] = ("http_2xx","json","nonempty","latency")
    body: dict[str, Any] | None = None
    cadence: str = "smoke"; mutability: str = "read"

@dataclass(frozen=True)
class Persona:
    id: str; name: str; role: str; goal: str; steps: tuple[Step, ...]
    def payload(self):
        out=asdict(self); out["assertion_budget"]=sum(len(s.checks) for s in self.steps); return out

R=("http_2xx","json","nonempty","latency")
S=("http_2xx","json","nonempty","latency","schema")
PERSONAS=(
 Persona("builder","Maya Builder","application creator","Exercise the public builder control plane.",(
  Step("app-health","app","GET","/api/health",S),Step("templates","app","GET","/api/templates",R),
  Step("ai-budget","app","GET","/api/ai/budget",R),Step("engine-health","engine","GET","/health",S),
  Step("builder-home","engine","GET","/builder",R))),
 Persona("chain-operator","Noah Chain Operator","network operator","Verify Monad and Ethereum L1 connectivity.",(
  Step("monad-block","app","GET","/api/chain/block",R),Step("monad-gas","app","GET","/api/chain/gas",R),
  Step("monad-rpc","engine","GET","/rpc/probe",R),
  Step("chain-engine","engine","POST","/engines/chain/run",R,{"network":"monad-testnet","params":{"op":"pulse"}}),
  Step("ethereum-chain-id","ethereum","POST","",("http_2xx","jsonrpc","ethereum_chain_id","latency"),{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}),
  Step("ethereum-block","ethereum","POST","",("http_2xx","jsonrpc","hex_result","latency"),{"jsonrpc":"2.0","id":2,"method":"eth_blockNumber","params":[]}))),
 Persona("wallet-owner","Ava Wallet Owner","wallet owner","Exercise interoperable wallets without signing secrets.",(
  Step("wallet-architecture","engine","GET","/wallets/architecture",S),Step("wallet-providers","engine","GET","/wallets/supported",R),
  Step("wallet-registry","engine","GET","/wallets/v2",R),
  Step("wallet-link","engine","POST","/wallets/v2/link",R,{"kind":"manual","provider":"synthetic-watch","address":"0x000000000000000000000000000000000000c0de","chain":"eip155:10143","label":"Synthetic Treasury Watch","role":"treasury","custody":"watch_only","account_type":"watch_only","namespace":"synthetic","owner_ref":"synthetic-wallet-owner","policy_profile":"owner-controlled","capabilities":["observe","sync_twin"],"tags":["synthetic","continuous-canary"],"balances":{"MON":0.0},"metadata":{"synthetic_user":"wallet-owner"}},"full","safe-write"),
  Step("wallet-twins","engine","POST","/wallets/v2/sync-twins",R,{},"full","safe-write"))),
 Persona("governance-owner","Liam Governance Owner","company owner","Verify law, policy, company, and receipt surfaces.",(
  Step("lawbook","engine","GET","/lawbook",R),Step("company-hq","engine","GET","/company",R),
  Step("company-run","engine","POST","/company/run",R,{"objective":"Synthetic operator: verify wallet, policy, chain, and receipt health without broadcasting transactions."},"full","safe-write"),
  Step("deployment","engine","GET","/deployment",R),Step("receipts","engine","GET","/receipts/recent?limit=10",R))),
 Persona("agent-auditor","Zara Agent Auditor","AI and security auditor","Exercise governed agents, tools, and reports.",(
  Step("agent-status","engine","GET","/agent",R),Step("tools","engine","GET","/tools",R),Step("engines","engine","GET","/engines",R),
  Step("reports","engine","GET","/reports",R),Step("terminal-status","engine","POST","/terminal/exec",R,{"command":"status","network":"monad-testnet"},"full","safe-write"),
  Step("agent-observe","engine","POST","/agent/step",R,{"goal":"Inspect platform health and explain failed synthetic assertions.","network":"monad-testnet","execute":False,"max_hops":2},"full","safe-write"))),
 Persona("edge-user","Kai Edge User","global edge client","Verify Cloudflare edge routing and origin reachability.",(
  Step("edge-health","edge","GET","/health",S),Step("edge-agents","edge","GET","/agents",R),
  Step("edge-seatbelt","edge","POST","/v1/run",R,{"agent":"seatbelt","action":"brief"},"full","safe-write"))),
 Persona("product-auditor","Eli Product Auditor","product auditor","Verify real product surfaces and anti-vaporware boundaries.",(
  Step("system","engine","GET","/system",R),Step("use-cases","engine","GET","/use-cases",S),Step("platform","engine","GET","/platform",R),
  Step("ecosystem","engine","GET","/ecosystem",R),Step("gas-coach","engine","GET","/gas/coach",R),Step("runtime-health","engine","GET","/runtime/health",S))),
)

def payload():
    return {"schema":"thesis.synthetic.personas.v1","count":len(PERSONAS),"assertion_budget":sum(sum(len(s.checks) for s in p.steps) for p in PERSONAS),"personas":[p.payload() for p in PERSONAS],"safety":{"real_key_material":False,"chain_broadcast":False,"wallet_mode":"watch-only identity and sandbox twins","stateful_actions":"synthetic namespace only"}}
