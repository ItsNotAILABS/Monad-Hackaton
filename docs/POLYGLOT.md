# Polyglot intelligence

THESIS embeds multiple languages for real compute — not slides.

| Runtime | Role | Entry |
|---------|------|--------|
| **Python** | API host, company OS, cloud engines, laws, desk | `uvicorn thesis_forge.api:app` |
| **Julia** | Spectral, Monte Carlo VaR/CVaR, portfolio, gas, agent utility | `polyglot/julia/ThesisIntel.jl` |
| **Node** | Agent rank, native WASM, WebGPU info, Julia relay | `polyglot/node/thesis-bridge.mjs` |
| **React** | HQ UI, WebGPU/WASM probes, LOCAL AI Transformers.js | `web/` |
| **Solidity** | Vault, policy, lawbook on Monad | `contracts/` |
| **PowerShell** | Ops: run_all, run_polyglot, transformers assets | `scripts/` |

## API

```http
GET  /polyglot
POST /polyglot/run   { "lang": "julia", "cmd": "spectral", "params": {} }
POST /polyglot/mesh  { "equity": 10000, "estimated_gas": 80000 }
```

## UI

**POLYGLOT** tab · also included in **▶ RUN SYSTEM** (`polyglot.mesh` step).

## Scripts

```powershell
powershell -File scripts/run_polyglot.ps1
powershell -File scripts/run_all.ps1
```
