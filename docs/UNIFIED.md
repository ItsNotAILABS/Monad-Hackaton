# How THESIS works as one product

```
┌─────────────────────────────────────────────────────────────┐
│  WEB APP (HQ UI)                                            │
│  PLATFORM · CLOUD · LOCAL AI · HQ · DESK · AI · STUDIO …    │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│  API HOST (cloud)         │   │  BROWSER (local AI)         │
│  /system/run              │   │  Transformers.js · memory   │
│  /engines/*               │   │  security teach · PDF/Excel │
│  /company /desk /laws     │   └─────────────────────────────┘
└───────────────┬───────────┘
                │ JSON-RPC
                ▼
┌───────────────────────────┐
│  MONAD (onchain)          │
│  SovereignVault · Policy  │
│  ReceiptChain · LawBook…  │
└───────────────────────────┘
```

## One-click path

**PLATFORM → ▶ RUN SYSTEM** calls `POST /system/run`:

1. Embed ecosystem laws  
2. Cloud engine pipeline (optional)  
3. Desk arena (rejects + accepts)  
4. Vault route sim on first routable ticket  
5. Company OS mission (dual law stacks)  
6. Security scan on public narrative  
7. Unified status snapshot  

All tabs then refresh from the same server state (desk, company, wallets, AI).

## API

| Call | Role |
|------|------|
| `GET /system` | Cross-surface status |
| `POST /system/run` | Full product orchestration |
| `GET /platform` | Kernel + apps |
| `GET /engines` | Cloud engine catalog |
| `POST /engines/pipeline` | Cloud-only path |

## Surfaces (same product)

| Tab | Role |
|-----|------|
| PLATFORM | Shell + RUN SYSTEM + market + apps |
| CLOUD | Individual engines + pipeline |
| LOCAL AI | On-device inference / teach / export |
| HQ / DESK / AI | Company, trading, twin AI node |
| STUDIO / IDE | Forge installable packages |
| CODEX | Protocols + deployment on Monad |

## Doctrine

> One lawbook. Cloud engines on the API host. Contracts on Monad. Browser local AI never holds keys. Owner signs.
