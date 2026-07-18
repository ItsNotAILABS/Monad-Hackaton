<p align="center">
  <img src="docs/assets/thesis-icon.jpg" alt="THESIS Platform" width="120" height="120" />
</p>

<h1 align="center">THESIS Platform</h1>

<p align="center">
  <strong>Your Monad DeFi company OS</strong> — agents propose, laws decide, receipts remember.<br/>
  Hosted web HQ · cloud engines · polyglot intelligence · on-chain vault.
</p>

<p align="center">
  <a href="https://github.com/ItsNotAILABS/Monad-Hackaton"><img src="https://img.shields.io/badge/version-2.6-6d4aff?style=for-the-badge&labelColor=0a0b12" alt="Version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2ee6a6?style=for-the-badge&labelColor=0a0b12" alt="License" /></a>
  <a href="https://buildanything.so/hackathons/spark"><img src="https://img.shields.io/badge/Spark-Build%20Anything-f0b429?style=for-the-badge&labelColor=0a0b12" alt="Spark" /></a>
  <a href="https://docs.monad.xyz/"><img src="https://img.shields.io/badge/chain-Monad-836EF9?style=for-the-badge&labelColor=0a0b12" alt="Monad" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/Julia-1.12-9558B2?style=flat-square&logo=julia&logoColor=white" alt="Julia" />
  <img src="https://img.shields.io/badge/Solidity-0.8.26-363636?style=flat-square&logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/WASM-WebGPU-654FF0?style=flat-square&logo=webassembly&logoColor=white" alt="WASM" />
  <img src="https://img.shields.io/badge/Transformers.js-local%20AI-FF6F00?style=flat-square&logo=huggingface&logoColor=white" alt="Transformers.js" />
  <img src="https://img.shields.io/badge/PowerShell-ops-5391FE?style=flat-square&logo=powershell&logoColor=white" alt="PowerShell" />
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#product-surfaces">Surfaces</a> ·
  <a href="#api">API</a> ·
  <a href="#security">Security</a> ·
  <a href="docs/USE_CASES.md">20 use cases</a> ·
  <a href="docs/SPARK.md">Spark notes</a>
</p>

---

<p align="center">
  <img src="docs/assets/thesis-hero.jpg" alt="THESIS Platform hero — command center for Monad DeFi" width="100%" />
</p>

<p align="center"><em>Agents propose. Laws decide. Receipts remember. Owner signs.</em></p>

---

## Why THESIS

| Everyday pain | What THESIS does |
|---------------|------------------|
| Tab hell every morning | **▶ RUN SYSTEM** — one path across laws, cloud, desk, vault, company |
| Fat gas on Monad (pay the **limit**) | Gas engine + Julia gas coach (~7.5% margin, 21k transfers) |
| Agents without brakes | Desk arena **REJECT** with reasons — feature, not failure |
| AI that wants your keys | Public wallet link · sandbox **twins only** · never seeds |
| Tutorials that don't stick | Teach-as-you-operate + law chips mid-action |

**Roommate test:** *“A 20-minute multi-app workflow becomes one managed, explained mission.”*

Built for [**Spark · Build Anything**](https://buildanything.so/hackathons/spark) on [**Monad**](https://docs.monad.xyz/).

---

## Architecture

<p align="center">
  <img src="docs/assets/thesis-architecture.jpg" alt="THESIS polyglot architecture layers" width="100%" />
</p>

| Layer | Runtime | Role |
|-------|---------|------|
| **HQ UI** | React + Vite | PLATFORM · CLOUD · POLYGLOT · LOCAL AI · HQ · DESK · USE CASES |
| **API host** | Python FastAPI | `/system/run` · `/engines/*` · `/polyglot/*` · company · desk · laws |
| **Cloud engines** | Python | chain · gas · law · research · index · docs · security · polyglot |
| **Julia** | stdlib-only | Spectral · Monte Carlo VaR/CVaR · portfolio · gas · agent utility |
| **Node** | ES modules | Agent rank · native WASM · WebGPU info · Julia relay |
| **Browser AI** | Transformers.js | Local embeddings · memory · teach · PDF/Excel · extension ZIP |
| **On-chain** | Solidity 0.8.26 | `SovereignVault` · `PolicyKernel` · `ReceiptChain` · LawBook… |
| **Ops** | PowerShell | `run_all.ps1` · `run_polyglot.ps1` · transformers assets |

```
Browser (React HQ)
    │  sticky ▶ RUN SYSTEM
    ├─► FastAPI  ──JSON-RPC──►  Monad (SovereignVault / PolicyKernel)
    ├─► Julia + Node polyglot mesh
    └─► Local AI (on-device, no cloud LLM)
```

---

## Product surfaces

| Tab | What you use it for |
|-----|---------------------|
| **PLATFORM** | Kernel, market, **▶ RUN SYSTEM**, app registry |
| **USE CASES** | 20 runnable scenarios mapped to Spark asks |
| **CLOUD** | Live Monad engines (chain, gas, research, docs) |
| **POLYGLOT** | Julia · Node · Python · WebGPU · WASM |
| **LOCAL AI** | Transformers.js · security teach · exports · extension |
| **HQ** | Company OS — brief, inbox, mission approve |
| **DESK** | Tickets, arena REJECT, vault route sim, paper PnL |
| **AI** | Sandbox node + twin wallet (public keys only) |
| **STUDIO / IDE** | Forge packages into workspace |
| **ACADEMY** | Failure-first labs |
| **CODEX** | Protocols, tokens, deployment |
| **PROOF** | Judge scorecard · vaporware = false |

---

## Quick start

### One-shot (Windows)

```powershell
powershell -File scripts/run_all.ps1
# → API http://127.0.0.1:8043
# → Web http://127.0.0.1:5173
```

### Manual

```powershell
# API
cd engine
python -m pip install -e ".[dev]"
$env:PYTHONPATH = "."
python -m uvicorn thesis_forge.api:app --reload --port 8043

# Web (second terminal)
cd web
npm install
npm run dev
```

### Smoke (no browser)

```powershell
cd engine
$env:PYTHONPATH = "."
python -m pytest -q
cd ..
python scripts/smoke_all.py
powershell -File scripts/run_polyglot.ps1
```

### First 60 seconds in the UI

1. Sticky bar **▶ RUN SYSTEM**  
2. **DESK** — open rejects  
3. **HQ** — mission awaiting approval  
4. **POLYGLOT** — Run polyglot mesh  
5. **USE CASES** — 20 asks with **Open in app**  

---

## API (highlights)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Operational + version |
| `GET` | `/system` | Cross-surface status |
| `POST` | `/system/run` | Full product orchestration |
| `GET` | `/engines` | Cloud engine catalog |
| `POST` | `/engines/{id}/run` | Run chain / gas / law / research… |
| `POST` | `/engines/pipeline` | Multi-engine cloud path |
| `GET` | `/polyglot` | Julia · Node · Python catalog |
| `POST` | `/polyglot/mesh` | Full polyglot intelligence mesh |
| `GET` | `/use-cases` | 20 use cases JSON |
| `GET` | `/nomos` | NOMOS department (propose + arena doctrine) |
| `POST` | `/nomos/run` | Multi-agent propose + dual-stack arbitrate |
| `POST` | `/company/run` | Staff Company OS |
| `POST` | `/arena/auto` | Propose agents + arbitrate (REJECT demo) |
| `POST` | `/desk/arena` | Trading rejects + accepts |
| `GET` | `/judge` | Spark / AI judge pack |
| `GET` | `/landing` | Live market + teach feed |

OpenAPI: [http://127.0.0.1:8043/docs](http://127.0.0.1:8043/docs)

```bash
curl -s http://127.0.0.1:8043/health
curl -s -X POST http://127.0.0.1:8043/system/run \
  -H "content-type: application/json" \
  -d "{\"network\":\"monad-testnet\",\"run_cloud\":false}"
```

---

## On-chain (Monad)

| Contract | Role |
|----------|------|
| **SovereignVault** | Spark primary submission — policy-gated `execute` |
| **PolicyKernel** | Owner policy, agents, targets, daily cap |
| **ReceiptChain** | Hash-linked audit spine |
| **LawBook** | Ecosystem law registry |
| **TwinLedger** | Digital twin balances (no custody of keys) |
| **ThesisFactory** | Deploy full stack in one tx |

```bash
cd contracts
# forge install foundry-rs/forge-std --no-commit
# forge build && forge test -vv
```

Details: [contracts/README.md](contracts/README.md) · [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Security

| Rule | Enforcement |
|------|-------------|
| No private keys / seeds in API or AI | Wallet link rejects secrets · security engines block paste |
| AI never auto-broadcasts | Sandbox twins · promote requires owner signature |
| Exact approvals preferred | `ExactAllowance` · `proto.exact-approval` |
| Monad gas discipline | Pay **limit** · ~7.5% margin · hardcode 21k transfers |
| Reject is a feature | Desk arena + NOMOS explain reasons |

Doctrine: **Owner remains sovereign.**

---

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/UNIFIED.md](docs/UNIFIED.md) | One-product wiring |
| [docs/USE_CASES.md](docs/USE_CASES.md) | **20 use cases** |
| [docs/POLYGLOT.md](docs/POLYGLOT.md) | Julia · Node · WASM · WebGPU |
| [docs/CLOUD_ENGINES.md](docs/CLOUD_ENGINES.md) | Server engines + Monad RPC |
| [docs/LOCAL_AI.md](docs/LOCAL_AI.md) | Browser Transformers.js |
| [docs/COMPANY_OS.md](docs/COMPANY_OS.md) | Departments + SLAs |
| [docs/NOMOS.md](docs/NOMOS.md) | **Risk/law arena · REJECT is a feature** |
| [docs/ECOSYSTEM_LAWS.md](docs/ECOSYSTEM_LAWS.md) | Runtime lawbook |
| [docs/SPARK.md](docs/SPARK.md) | Hackathon submission notes |
| [CHARTER.md](CHARTER.md) | Product charter |

---

## Repository

| | |
|--|--|
| **Org** | [ItsNotAILABS](https://github.com/ItsNotAILABS) |
| **Repo** | [Monad-Hackaton](https://github.com/ItsNotAILABS/Monad-Hackaton) |
| **License** | [MIT](LICENSE) |
| **Primary contract** | `SovereignVault` |

---

<p align="center">
  <img src="docs/assets/thesis-icon.jpg" width="48" height="48" alt="" />
  <br/>
  <sub>THESIS Platform · MIT · Built for Monad · Spark 2026</sub>
</p>
