# THESIS — Monad AI Workstation

**Agents propose. Laws decide. Humans & AIs learn by failing safely.**

Public Spark entry for [Build Anything · Spark](https://buildanything.so/hackathons/spark) on [Monad](https://docs.monad.xyz/).

| | |
|--|--|
| **Charter** | [CHARTER.md](CHARTER.md) |
| **Deploy** | [DEPLOYMENT.md](DEPLOYMENT.md) |
| **Repo** | https://github.com/ItsNotAILABS/Monad-Hackaton |
| **Safety** | [PRODUCTION.md](PRODUCTION.md) |

---

## What it is

THESIS is a **production workstation** for building on Monad with AI:

| Pillar | Job |
|--------|-----|
| **STUDIO** | Objective → typed manifest + Foundry deploy plan + sealed receipt |
| **CODEX** | Ecosystem atlas (honest adapter status) + network constants |
| **NOMOS** | Policy lawbook + multi-plan arena — **reject is a feature** |
| **ACADEMY** | Failure-first labs that teach **people and AI agents** |

Onchain kernel: `PolicyKernel` + `SovereignVault` + `ReceiptChain` (+ registry / proposals / router).

**Spark contract address field → `SovereignVault`.**

---

## Personal problem

AI + crypto is fast but reckless. Protocols and RPCs are scattered. Agents invent plans that can spend capital. Tutorials skip the failure modes that keep money safe.

THESIS is one place to **forge a plan, fail unlawfully plans hard, learn why, deploy what passed**.

---

## Quick start

### Engine API

```bash
cd engine
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate   # Unix / WSL
pip install -e ".[dev]"
uvicorn thesis_forge.api:app --reload --port 8043
```

Health: http://127.0.0.1:8043/health  
OpenAPI: http://127.0.0.1:8043/docs  

### Web cockpit

```bash
cd web
npm install
# optional: set VITE_API_URL=http://127.0.0.1:8043
npm run dev
```

Dev server proxies `/api` → `:8043` (see `vite.config.js`).

Production build:

```bash
cd web && npm run build
```

### Contracts

```bash
# WSL recommended on Windows — https://docs.monad.xyz/guides/deploy-smart-contract/foundry
cd contracts
forge install foundry-rs/forge-std --no-commit   # once
forge test
```

Deploy testnet (fund deployer first: https://testnet.monad.xyz):

```bash
export PRIVATE_KEY=0x…
./scripts/deploy.sh testnet
# addresses → receipts/deployment.json
```

---

## API map

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Status + pillars + deploy tip |
| GET | `/charter` | Product summary |
| GET | `/networks` | Testnet 10143 / mainnet 143 |
| GET | `/protocols` | Codex atlas |
| POST | `/forge` | Studio compile + receipt |
| POST | `/arena` | Nomos multi-plan evaluation |
| GET | `/academy/quests` | List labs |
| POST | `/academy/grade` | Grade lab + receipt |
| GET | `/deployment` | Recorded vault address |
| GET | `/demo/pack` | 3-minute demo script |

---

## Demo (≤3 min)

1. **Problem** — won’t give agents a blank check.  
2. **STUDIO** — forge → sealed manifest + deploy commands.  
3. **NOMOS** — arena shows **REJECT** with reasons + lawful winner.  
4. **ACADEMY** — pass a slippage / rogue-category lab.  
5. **CODEX** — explorer link for `SovereignVault`.  
6. **Close** — agents propose, laws decide, receipts remember.

---

## Networks

| | Testnet | Mainnet |
|--|---------|---------|
| Chain ID | 10143 | 143 |
| RPC | https://testnet-rpc.monad.xyz | https://rpc.monad.xyz |
| Explorer | testnet.monadvision.com | monadvision.com |

Official guides: [deploy](https://docs.monad.xyz/guides/deploy-smart-contract/foundry) · [verify](https://docs.monad.xyz/guides/verify-smart-contract/foundry)

---

## Tests & CI

```bash
cd engine && pytest -q
cd web && npm run build
cd contracts && forge test
```

GitHub Actions: `.github/workflows/ci.yml` (pytest + web build).

---

## Spark submission

| Field | Value |
|-------|--------|
| Name | THESIS — Monad AI Workstation |
| Github | https://github.com/ItsNotAILABS/Monad-Hackaton |
| Category | Testnet (or Mainnet if deployed) |
| Contract | `SovereignVault` from `receipts/deployment.json` |
| Project URL | Hosted `web/dist` + live API |
| Demo video | ≤3 min public URL |
| Post URL | Social post for viral track |

---

## License

MIT — see [LICENSE](LICENSE).

**Not audited. Do not deposit real capital without independent security review.**
