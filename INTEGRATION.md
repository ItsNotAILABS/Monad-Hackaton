# THESIS × MonadBuilder++ — Integration Plan

**Goal:** Merge the THESIS Python engine (GitHub) with the MonadBuilder+ React frontend (Replit) into one unified hackathon submission.

---

## The two systems

| System | What it is | Where it lives |
|---|---|---|
| **MonadBuilder+ frontend** | Polished React/Vite dApp builder — drag-drop components, preview, publish | `artifacts/monad-builder/` |
| **Express API** | Node.js CRUD for projects + templates + workspace file exec | `artifacts/api-server/` |
| **THESIS engine** | Python FastAPI — chain engine, gas coach, laws, agents, trading desk, company OS, terminal, MCP tools | GitHub `engine/thesis_forge/` → needs Replit artifact |

---

## Target architecture

```
Browser (React)
  │
  ├─► /api/*     → Express (Node.js)     — builder CRUD: projects, templates, files
  └─► /engine/*  → FastAPI (Python)      — THESIS: chain, gas, laws, tools, HQ, desk
```

The frontend calls both services with a common pattern:
- `builderApi('/projects')` → Express
- `engineApi('/engines/chain/run', {...})` → FastAPI

---

## Routing map — THESIS surface → Frontend page

| THESIS endpoint(s) | Frontend page | Status |
|---|---|---|
| `GET /landing` | Home page — live market + law stack panel | **BUILT** (graceful offline) |
| `GET /health` + system status | Home page — engine status badge | **BUILT** |
| `POST /demo/win-path` | Home page — WIN PATH button | **BUILT** |
| `POST /terminal/exec`, `GET /terminal/banner` | Workspace → Terminal tab | **BUILT** (real exec wired) |
| `POST /engines/{id}/run` (chain, gas, research) | Workspace → Monad Actions | **BUILT** (real engine calls) |
| `GET /tools`, `POST /tools/{id}/run` | `/platform` page — Tools tab | **BUILT** |
| `GET /competition/scorecard`, `GET /judge` | `/platform` page — Judge tab | **BUILT** |
| `GET /company/headquarters`, `POST /company/morning-brief` | `/platform` page — HQ tab | **BUILT** |
| `POST /desk/arena`, `GET /desk` | `/platform` page — Desk tab | **BUILT** |
| `GET /deployment` | `/platform` page — Contracts tab | **BUILT** |
| `GET /laws` | `/platform` page — Laws tab | **BUILT** |
| `GET /engines` | `/platform` page — Cloud tab | **BUILT** |

---

## What the other agent needs to do (THESIS engine)

### 1 — Create a new Replit artifact

```toml
# artifacts/thesis-engine/.replit-artifact/artifact.toml
kind = "api"
title = "THESIS Engine"
id = "thesis-engine"

[[services]]
name = "THESIS Engine"
paths = ["/engine"]
localPort = 8043

[services.development]
run = "uvicorn thesis_forge.api:app --host 0.0.0.0 --port 8043 --reload"

[services.production.run]
args = ["uvicorn", "thesis_forge.api:app", "--host", "0.0.0.0", "--port", "8043", "--workers", "2"]

[services.production.health.startup]
path = "/engine/health"
```

### 2 — Copy engine code into artifacts/thesis-engine/

```
artifacts/thesis-engine/
├── thesis_forge/          ← copy from GitHub engine/thesis_forge/
├── pyproject.toml         ← copy from GitHub engine/pyproject.toml
└── requirements.txt       ← extract from pyproject.toml
```

### 3 — Prefix all FastAPI routes with /engine

In `thesis_forge/api.py`, add `root_path="/engine"` to FastAPI or mount the app:

```python
# Option A — root_path (cleanest)
app = FastAPI(root_path="/engine", ...)

# Option B — mount under prefix in a wrapper
# from fastapi import FastAPI
# root = FastAPI()
# root.mount("/engine", app)
```

### 4 — CORS

The engine already has CORS middleware. In Replit, both services are on the same domain so CORS is not an issue — but keep `allow_origins=["*"]` for dev.

### 5 — Required env vars (set via Replit Secrets)

```
THESIS_CORS=*
OPENAI_API_KEY=        # optional — local AI only; engine works without it
```

---

## What the MonadBuilder+ frontend already has built

### `src/lib/engine.ts`
- `engineApi(path, opts)` — typed fetch wrapper, catches network errors gracefully
- `THESIS_ENGINE_BASE` — reads `VITE_THESIS_ENGINE` env var, defaults to `/engine`
- Returns `{ ok: false, error: "engine offline" }` when engine is not running

### Pages
- **`/platform`** — unified THESIS surface: Tools · Cloud · Judge · HQ · Desk · Laws · Contracts tabs
- **`/workspace`** — file upload + Python terminal wired to engine terminal endpoint
- **Home** — live market ticker + WIN PATH button, falls back to static data when offline

### Key env var (set in Replit Secrets or `.env`)
```
VITE_THESIS_ENGINE=/engine
```

---

## Integration checklist

- [ ] Other agent: `artifacts/thesis-engine/` artifact created and running
- [ ] Other agent: `GET /engine/health` returns 200
- [ ] Other agent: `GET /engine/landing` returns platform feed JSON
- [ ] Other agent: `GET /engine/tools` returns tool list
- [ ] Other agent: `POST /engine/engines/chain/run` returns chain pulse
- [ ] This agent: `VITE_THESIS_ENGINE=/engine` set in Replit env
- [ ] Both: end-to-end test — Platform page shows live THESIS data
- [ ] Deploy: both artifacts deployed, submission URL updated

---

## The unified pitch

> **"Build it with MonadBuilder+. Run it with THESIS."**
>
> MonadBuilder+ lets anyone ship a Monad dApp UI in minutes — no code, drag and drop.
> THESIS is the operating system that governs how it runs — agents propose, laws decide, receipts remember.
> Together: the first full-stack no-code + governed-ops platform for Monad.

---

## Engine endpoint reference (key ones)

```
GET  /health                      — liveness
GET  /landing?network=monad-testnet — full platform feed
POST /demo/win-path               — WIN PATH demo (scorecard)
GET  /judge                       — judge bundle
GET  /competition/scorecard       — live scorecard
GET  /tools                       — MCP tool catalog
POST /tools/{id}/run              — run a tool (body: params JSON)
GET  /engines                     — cloud engine list
POST /engines/{id}/run            — run engine (body: params JSON)
GET  /laws                        — 26+ ecosystem laws
POST /terminal/exec               — sovereign terminal command
GET  /terminal/banner             — terminal welcome
GET  /company/headquarters        — HQ snapshot
POST /company/morning-brief       — daily brief
POST /desk/arena                  — run REJECT arena
GET  /desk                        — desk snapshot
GET  /deployment                  — contract addresses
GET  /system/status               — unified system status
POST /system/run                  — ▶ RUN SYSTEM
```
