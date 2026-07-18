# Runtime-embedded ecosystem laws

THESIS embeds **two law stacks** at runtime — the same way protocols and owner constitution are loaded for governance:

| Stack | Source | Role |
|-------|--------|------|
| **Owner constitution** | Company OS | Personal financial laws (liquidity, leverage, exposure) |
| **Ecosystem laws** | `ecosystem_laws.py` | Monad network + protocol + system-self + intelligence + execution |

## Domains

1. **system_self** — no real keys, sandbox-first, NOMOS veto, receipts, kill switch  
2. **monad_network** — gas bills limit, no global mempool, finality, reserve 10 MON, no invent addresses  
3. **protocols** — live-only-when-live, category gate, exact approvals + catalog  
4. **intelligence** — no hallucinated APY, explain rejects, teach on action, compete plans  
5. **execution** — ordered mission, no silent broadcast, re-sim before sign  

## API

- `GET /laws` — status  
- `GET /laws/full` — full lawbook  
- `GET /laws/pillar/{governance|execution|intelligence|safety}`  
- `POST /laws/reembed` — force reload  
- `GET /landing` — LIVE market board + AI brief + laws explained **as used**

## Pillars

Laws are indexed by **pillar** (`safety`, `governance`, `execution`, `intelligence`) and by **severity** (`critical`, `high`, `medium`).  
`laws_for_pillar("safety")` returns safety laws only — never severity keys.

## LIVE landing (teach as you operate)

The landing feed (`live_feed.landing_feed`) rotates:

1. **Market ticker** — desk marks + equity + gas limit demo  
2. **AI daily brief** — `morning_brief` + coach tips (no hallucinated APY)  
3. **Monad best practices** — from [docs.monad.xyz/developer-essentials/best-practices](https://docs.monad.xyz/developer-essentials/best-practices)  
4. **Cool moves** — twin sync, desk reject, Multicall3, hardcode 21k, company mission  
5. **Law chips** — each card stamps `as_used` text so the operator sees *why this law fired now*

## Enforcement points

- **Startup:** FastAPI embeds on boot  
- **Company run:** `run_objective` embeds before SENSUS  
- **NOMOS:** dual stack (constitution + ecosystem check)  
- **CUSTOS:** checklist cites law IDs  
- **PRAXIS:** steps tag ecosystem law IDs  
- **AI node:** loads lawbook every chat  
- **Landing poll:** THESIS `enforce_on_department` demo on every refresh  

Departments must not invent rules — they **consult the embedded book**.
