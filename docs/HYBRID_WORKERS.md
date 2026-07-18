# Blockchain + Web Worker hybrids (novel tech)

## What Web Workers are

**Web Workers** are background JavaScript processes that run **in parallel**, outside the browser’s main UI thread. Heavy work (scoring, crawling catalogs, policy mirrors, crypto fingerprints) does not freeze React HQ.

THESIS pairs them with **Node `worker_threads`** (server bridge) and **Monad dual-stack law** (PolicyKernel / LawBook / vault).

## Why it’s novel for this field

| Typical winner | THESIS hybrid |
|----------------|---------------|
| Signal/score on main thread or only server | **Browser worker** scores arena/signals instantly |
| UI freezes on big loops | Main thread stays interactive (bench demo) |
| Chain-only or chat-only | **Workers propose/score · laws decide · owner signs** |

## Stack

```
┌─────────────────────────────┐
│  React HQ (main thread)     │  wallets, TERM, RUN SYSTEM
└──────────────┬──────────────┘
               │ postMessage
┌──────────────▼──────────────┐
│  Browser Web Worker         │  arena · signals · crawl · fingerprint · bench
│  web/src/workers/*          │
└─────────────────────────────┘

┌─────────────────────────────┐
│  FastAPI (laws, auto, vault)│  source of truth for dual stack + paper exec
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  Node worker_threads        │  polyglot/node/hybrid-worker.mjs
│  thesis-bridge hybrid-worker│
└─────────────────────────────┘

┌─────────────────────────────┐
│  Monad contracts            │  SovereignVault · PolicyKernel · LawBook
└─────────────────────────────┘
```

## Use it

| Surface | How |
|---------|-----|
| **HYBRID** tab | Run worker ops · FULL HYBRID · NODE WORKER |
| **TERM** | `hybrid` · `hybrid arena` · `hybrid bench` |
| **API** | `GET /hybrid` · `POST /hybrid/run` |
| **Tools/MCP** | `hybrid` tool |

```bash
curl -s http://127.0.0.1:8043/hybrid
curl -s -X POST http://127.0.0.1:8043/hybrid/run \
  -H "content-type: application/json" \
  -d '{"op":"pulse"}'

# Node direct
cd polyglot/node
node thesis-bridge.mjs hybrid-worker
```

## Ops (browser + node)

| op | Purpose |
|----|---------|
| `pulse` | Arena + agent rank hybrid pulse |
| `arena` | Multi-plan evaluate → reject/accept |
| `signals` | Score alpha board off thread |
| `crawl` | Rank protocol catalog (offline) |
| `fingerprint` | SHA-256 for receipt/calldata prep |
| `bench` | CPU loop proving UI stays free |
| `agents` | Utility rank lawful > degen |

## Doctrine

> Workers propose/score. Laws decide. Owner signs. Receipts remember.

Workers never hold keys, never auto-broadcast, and never bypass NOMOS / LawBook.
