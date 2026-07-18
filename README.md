# THESIS — Monad AI Workstation v0.5

**Teach DeFi by doing. Automate the tedious risk checks. Come back every day.**

Roommate test: *“This saved me 20 minutes of re-checking bots and stopped a fat gas-limit bill.”*

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
| **HOME** | **Daily loop** — missions, streak, XP, badges, gas coach, coach intel |
| **STUDIO / PIPELINE** | 11-stage build with explainability events |
| **IDE** | Generated multi-file package (Solidity hints, TS config, AGENT.md, lawbook) |
| **NOMOS** | Auto multi-agent propose + arena (REJECT is a feature) |
| **DESK** | Trading business — tickets, strategies, paper PnL, vault route |
| **ACADEMY** | Failure-first labs (learn DeFi by using it safely) |
| **CODEX** | Protocols + **mainnet tokens** (MONSKILLS addresses) + infra |
| **JUDGE** | Proof panel for humans / Spark AI judging agent |
| **CHAIN** | `SovereignVault` gated by `PolicyKernel` + `ReceiptChain` |

### Spark alignment

| Everyday pain | THESIS |
|---------------|--------|
| DeFi jargon until you get rekt | Academy + desk rejects teach by doing |
| 20 min re-checking every bot | Desk arena + lawbook automate the no |
| Fat gas limits on Monad | Gas coach: pay **limit**, ~7.5% buffer |
| Tab hell every morning | HOME streak keeps one daily open |

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

## API (v0.5)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/home` | Daily missions, streak, XP, gas coach |
| POST | `/home/mission` | Complete mission → XP / badges |
| GET | `/intelligence/coach` | Next-best-action tips |
| GET | `/ecosystem` | Tokens + infra (Monskills addresses) |
| POST | `/gas/margin` | Monad gas-limit margin (~7.5%) |
| POST | `/pipeline` | Full build path — events + codegen + arena |
| POST | `/arena/auto` | Propose agents + arbitrate |
| GET | `/desk` | Trading book snapshot |
| POST | `/desk/arena` | Trading-agent arena |
| POST | `/desk/ticket` | Risk-gate a trade ticket |
| POST | `/desk/fill/{id}` | Paper fill |
| POST | `/desk/marks/refresh` | Live marks |
| POST | `/desk/strategies/{id}` | market-make · inventory · take-profit |
| POST | `/desk/vault-route/{id}` | Vault execute simulation |
| POST | `/academy/grade` | Grade lab |
| GET | `/judge` | Judge proof panel |

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
