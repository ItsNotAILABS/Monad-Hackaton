# THESIS — Monad AI Workstation v0.3

**Agents propose. Laws decide. Receipts remember. Education is a failed plan that could not spend.**

Production workstation for [Spark · Build Anything](https://buildanything.so/hackathons/spark) on [Monad](https://docs.monad.xyz/).

| | |
|--|--|
| **Charter** | [CHARTER.md](CHARTER.md) |
| **Explainability** | [docs/EXPLAINABILITY_CONTRACT.md](docs/EXPLAINABILITY_CONTRACT.md) |
| **Deploy** | [DEPLOYMENT.md](DEPLOYMENT.md) |
| **Repo** | https://github.com/ItsNotAILABS/Monad-Hackaton |

---

## Product (not a toast demo)

| Surface | What it does |
|---------|----------------|
| **STUDIO / PIPELINE** | 11-stage build with explainability events |
| **IDE** | Generated multi-file package (Solidity hints, TS config, AGENT.md, lawbook) |
| **NOMOS** | Auto multi-agent propose + arena (REJECT is a feature) |
| **ACADEMY** | Failure-first labs for humans **and** AI constraints |
| **CODEX** | Protocol atlas + live RPC probe + receipts |
| **JUDGE** | Proof panel for humans / Spark AI judging agent |
| **CHAIN** | `SovereignVault` gated by `PolicyKernel` + `ReceiptChain` |

---

## Quick start (Windows)

```powershell
# API
cd engine
python -m pip install -e ".[dev]"
python -m uvicorn thesis_forge.api:app --reload --port 8043

# Web (other terminal)
cd web
npm install
npm run dev
```

Or: `powershell -File scripts/run_workstation.ps1 -Both`

Smoke:

```bash
cd engine && pytest -q
python ../scripts/smoke_all.py
```

---

## API (v0.3)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/pipeline` | **Full product path** — events + codegen + arena + workspace |
| POST | `/forge` | Manifest + package |
| POST | `/arena/auto` | Propose agents + arbitrate |
| POST | `/academy/grade` | Grade lab |
| GET | `/workspace/projects` | List saved projects |
| GET | `/rpc/probe` | Live Monad chainId check |
| GET | `/judge` | Judge / AI proof panel |
| GET | `/demo/pack` | 3-minute demo script payload |

OpenAPI: http://127.0.0.1:8043/docs

---

## Demo script (≤3 min)

1. Problem — blank-check agents  
2. STUDIO → **Run full pipeline** — show events + package count  
3. IDE — open `docs/AGENT.md` + lawbook  
4. NOMOS — REJECT reasons + winner  
5. ACADEMY — pass slippage lab  
6. JUDGE panel + vault address when deployed  

---

## Deploy (Monad official path)

```bash
# WSL + Monad Foundry: https://docs.monad.xyz/guides/deploy-smart-contract/foundry
export PRIVATE_KEY=0x…
./scripts/deploy.sh testnet
# → receipts/deployment.json  ·  Spark field = SovereignVault
```

Networks: testnet **10143** · mainnet **143**

---

## Tests

```bash
cd engine && pytest -q          # 11+ tests
cd web && npm run build
cd contracts && forge test      # after forge-std install
```

---

## Spark submission

| Field | Value |
|-------|--------|
| Name | THESIS — Monad AI Workstation |
| Github | https://github.com/ItsNotAILABS/Monad-Hackaton |
| Contract | `SovereignVault` |
| Category | Testnet (or Mainnet if deployed) |

**Not audited. No production TVL.**
