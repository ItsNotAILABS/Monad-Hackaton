# THESIS — Monad AI Workstation v0.4

**Agents propose. Laws decide. Desk risks capital. Receipts remember.**

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
| **DESK** | **Trading business** — tickets, desk risk, paper PnL, venue roster (Kuru / AMM / perps) |
| **ACADEMY** | Failure-first labs for humans **and** AI constraints |
| **CODEX** | Protocol atlas + live RPC probe + receipts |
| **JUDGE** | Proof panel for humans / Spark AI judging agent |
| **CHAIN** | `SovereignVault` gated by `PolicyKernel` + `ReceiptChain` |

### Trading desk (business)

- **Desk limits**: max ticket / open / position notional, daily loss, perps/short toggles  
- **NOMOS coupling**: every ticket also evaluated as a policy `Action`  
- **Venues**: Kuru, Uniswap-style AMM, Perpl, LeverUp, Birdeye (analytics), THESIS vault (gate)  
- **Paper book**: cash, positions, realized/unrealized PnL, receipts  
- **Live fills**: operator-only later — browser never holds venue API keys

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
| GET | `/desk` | Trading book snapshot |
| POST | `/desk/arena` | Trading-agent arena (mm/degen/arb/whale) |
| POST | `/desk/ticket` | Risk-gate a trade ticket |
| POST | `/desk/fill/{id}` | Paper fill accepted ticket |
| POST | `/desk/marks/refresh` | Live synthetic marks (+ RPC entropy) |
| POST | `/desk/strategies/{id}` | market-make · inventory · take-profit |
| POST | `/desk/vault-route/{id}` | Simulate `SovereignVault.execute` calldata |
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
