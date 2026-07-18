# NOMOS

**Auto multi-agent propose + arena · REJECT is a feature**

NOMOS is a specialized department and core feature within the **THESIS Platform** (v2.x), a Monad-based DeFi workstation by [@ItsnotAILabs](https://github.com/ItsNotAILABS). It handles automated multi-agent proposal generation combined with an evaluation arena, where **rejection is explicitly designed as a built-in, valuable outcome**.

> **Doctrine:** *Agents propose. Laws decide. Owner signs. Receipts remember.*

---

## Core concept

Every ticket or proposed action is evaluated as a policy **Action**. The system:

1. Generates proposals via multiple AI agents  
2. Routes them through an **arena** for arbitration / evaluation  
3. Applies **constitutional + ecosystem** risk policies  
4. Supports **explicit rejection** outcomes with human-readable reasons  
5. Seals hash-linked **receipts** for audit  

NOMOS is tightly coupled with the trading desk and the Company OS mission pipeline.

---

## Role in Company OS

THESIS implements a **Company OS** that structures operations into governed departments. NOMOS sits in the sequential workflow:

| Order | Department | Role |
|-------|------------|------|
| 1 | **SENSUS** | Research — wallets, desk, markets, ecosystem, sandbox, gas |
| 2 | **AGORA** | Strategy competition — multi-agent proposals |
| 3 | **NOMOS** | Risk / law — constitution → Policy + evaluate; **can veto** |
| 4 | **MATHESIS** | Quant / simulation |
| 5 | **PRAXIS** | Execution — ordered tx missions requiring signature |
| … | CUSTOS · MEMORIA · ACADEMY · NERVUS | Security, accounting, teaching, audit |

- **AGORA** focuses on generating competitive multi-agent proposals for strategy.  
- **NOMOS** provides the risk/law overlay, policy enforcement, and arena-based evaluation for those proposals.  

Profit never overrides constitution or ecosystem laws (`sys.nomos-veto`).

---

## Dual law stack

| Layer | Source | Examples |
|-------|--------|----------|
| **Owner constitution** | LawBook / `POST /company/constitution` | Min liquid reserve, max exposure, leverage off, max action value, allowlists |
| **Ecosystem laws** | Runtime-embedded Monad + protocol + safety | Gas bills **limit**, exact approval, no real keys, no silent broadcast |

On-chain: **PolicyKernel** + **LawBook** gate **SovereignVault**. Off-chain: `policy.evaluate` + `ecosystem_laws.check_proposal_against_ecosystem` inside `run_nomos`.

---

## How multi-agent proposals work

### 1. Proposal generation

Specialized agents (or departmental AI twins) automatically generate proposals — trading strategies, mission plans, actions, or build paths.

- `POST /arena/auto` — propose agents + arbitrate  
- `POST /agents/propose` — plans only  
- AGORA inside `POST /company/run`  

Default agents always include a **deliberate unlawful control** (e.g. reckless leverage / perps) so REJECT is demoable.

### 2. Arena evaluation

Proposals enter an arena for assessment:

| Endpoint | Role |
|----------|------|
| `POST /desk/arena` | Trading-agent arena (machine scorecards) |
| `POST /arena` | Score a provided action list under Policy |
| `POST /arena/auto` | Propose + arbitrate under lawbook |
| `POST /evaluate` | Single Action vs Policy |

Agents compete, simulate outcomes, or are arbitrated. Simulation, scoring, and competition are first-class.

### 3. Policy & risk gate (NOMOS)

Proposals are checked against the owner-defined constitution (liquidity, leverage, protocol caps) via the LawBook and on-chain PolicyKernel. Invalid or high-risk proposals are **rejected** with reasons.

### 4. Rejection as a feature

Rejection is **not a failure**. It is a deliberate, logged outcome that feeds learning (especially ACADEMY’s failure-first labs). The system explicitly demonstrates rejecting invalid plans.

Live demos should show **n_rejected ≥ 1** — non-vaporware proof of brakes.

### 5. Owner sovereignty

Owner reviews in the **Mission Room** (competing plans, txs, performance metrics):

| Action | Meaning |
|--------|---------|
| `approve` | Owner accepts lawful mission path |
| `reject` | Owner declines (also a first-class outcome) |
| `simulate_again` | Re-run quant / arena |
| `revise` | Change objective / constitution and re-staff |

Final execution requires **owner signature**. AI never holds real keys (sandboxed digital twins only).

### 6. Audit & receipts

All steps create hash-linked **ReceiptChain** entries for full explainability and auditability.

Pipeline integration: `POST /pipeline` includes events + codegen + arena for STUDIO packages.

---

## Technical & safety architecture

### On-chain (Monad)

| Contract | Role |
|----------|------|
| **SovereignVault** | Gated by PolicyKernel |
| **LawBook** | Law registry |
| **PolicyKernel** | Policy, agents, targets, daily cap |
| **ReceiptChain** | Hash-linked audit spine |
| **AgentRegistry / ProposalBook** | Agent + proposal concepts |
| **TwinLedger** | Digital twin balances (no custody of keys) |

### Safety layers

- Browser-local AI (Transformers.js)  
- Sandbox isolation with kill switch  
- AI secure wallet — digital twins only  
- No auto-broadcast or seed export  
- Owner signature for PRAXIS irreversible steps  

### Local engine APIs

Example base: `http://127.0.0.1:8043`

```bash
# Catalog + doctrine
curl -s http://127.0.0.1:8043/nomos | jq .

# Auto multi-agent propose + arena (REJECT demo)
curl -s -X POST http://127.0.0.1:8043/arena/auto \
  -H "content-type: application/json" \
  -d '{"name":"NOMOS","objective":"Grow safely under laws","categories":["vault","dex"],"network":"monad-testnet"}'

# Trading desk arena
curl -s -X POST http://127.0.0.1:8043/desk/arena

# Full company OS (includes run_nomos dual stack)
curl -s -X POST http://127.0.0.1:8043/company/run \
  -H "content-type: application/json" \
  -d '{"objective":"Grow my Monad position, keep 30% liquid, avoid leverage."}'
```

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/nomos` | Department catalog, dual stack, APIs, doctrine |
| `POST` | `/nomos/run` | Propose + arbitrate with dual-stack metadata |
| `POST` | `/arena/auto` | Propose agents + arbitrate |
| `POST` | `/arena` | Arbitrate provided actions |
| `POST` | `/desk/arena` | Trading rejects + accepts |
| `POST` | `/evaluate` | Single action policy gate |
| `POST` | `/company/run` | Staffed departments including NOMOS |

---

## Gas & UX

Gas coach with buffer discipline (Monad bills **gas_limit**), daily loops, streaks, and reduced cognitive load. Seatbelt UX: sticky **RUN SYSTEM**, explain rejects in plain language.

---

## Broader vision

NOMOS embodies sovereign, governed multi-agent systems:

- Beyond simple chat agents → structured collaboration with built-in governance and rejection logic  
- Local AI + Web3 security + on-chain enforcement  
- Real DeFi pain points: reckless autonomous agents, manual verification of docs/bots, scattered protocols, lack of explainable controls  
- Spark / buildanything.so submission emphasis: **non-vaporware**, live demos with **actual rejections** and policy enforcement  

Connects to ItsNotAILABS work on sovereign AI swarms and agent orchestration under owner law.

---

## Implementation map

| Layer | Path |
|-------|------|
| **Arena core** | `engine/thesis_forge/policy.py` — evaluate → arbitrate → arena_report |
| Agent plans | `engine/thesis_forge/agents.py` |
| Models | `engine/thesis_forge/models.py` — Action · Policy · Evaluation |
| Department runner | `engine/thesis_forge/company/departments.py` → `run_nomos` |
| Catalog API | `engine/thesis_forge/nomos.py` · `GET /nomos` |
| HTTP surface | `engine/thesis_forge/api.py` |
| UI | `web/src/Nomos.jsx` · tab **NOMOS** |
| Contracts | `contracts/src/PolicyKernel.sol`, `LawBook.sol`, `SovereignVault.sol`, … |

Deep dive: **[NOMOS_ARENA.md](./NOMOS_ARENA.md)** (models + evaluate/arbitrate/report + API).

---

## Related docs

- [NOMOS_ARENA.md](./NOMOS_ARENA.md) — **arena code walkthrough**  
- [COMPANY_OS.md](./COMPANY_OS.md) — departments + SLAs  
- [ECOSYSTEM_LAWS.md](./ECOSYSTEM_LAWS.md) — runtime lawbook  
- [PLATFORM.md](./PLATFORM.md) — primitives + apps  
- [SPARK.md](./SPARK.md) — hackathon notes  
- [EXPLAINABILITY_CONTRACT.md](./EXPLAINABILITY_CONTRACT.md) — receipts  
