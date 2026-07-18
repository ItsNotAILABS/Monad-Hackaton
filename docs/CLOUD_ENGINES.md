# Cloud engines (hosted web app)

THESIS is a **web app**: the browser is HQ; the **API host** runs cloud engines; **Monad** hosts the contracts.

```
Browser UI  →  FastAPI (/engines/*)  →  Monad JSON-RPC + platform modules
     │                                        │
     └─ LOCAL AI (on-device)                   └─ SovereignVault / PolicyKernel / …
```

## Engines

| ID | What it does |
|----|----------------|
| `chain` | Live RPC pulse / balance / code / eth_call (batch) |
| `gas` | Monad gas coach + live gasPrice + recommended limit |
| `law` | Embed/consult ecosystem laws; check proposals |
| `research` | Cloud research brief (desk + eco + chain + laws) |
| `index` | Packages, protocols, receipts tip, deployment |
| `docs` | Server markdown reports under `receipts/cloud_docs/` |
| `security` | Scan text for secrets/risk (redacts critical samples) |

## API

```http
GET  /engines
GET  /engines/{id}
POST /engines/{id}/run
POST /engines/pipeline
GET  /engines/docs/download/{filename}.md
```

Example:

```bash
curl -X POST http://127.0.0.1:8043/engines/pipeline \
  -H "content-type: application/json" \
  -d '{"network":"monad-testnet","query":"gas and vault","estimated_gas":80000}'
```

## UI

Open the **CLOUD** tab → run single engines or **full pipeline**.

## Security

- Requests with `private_key` / `seed` / `mnemonic` are **rejected**
- Research refuses seed-like / 64-hex queries
- Security engine redacts critical samples in findings

## vs LOCAL AI

| | Cloud | Local AI |
|--|-------|----------|
| Where | API server | Browser |
| Chain | Yes (RPC) | Optional public pulse only |
| Models | Deterministic engines | Transformers.js embeddings |
| Storage | `receipts/` on server | IndexedDB |
