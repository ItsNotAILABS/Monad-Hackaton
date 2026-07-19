# THESIS Platform

This is a **platform**, not a pitch deck and not a scoreboard.

## What “platform” means here

| Layer | What it is |
|-------|------------|
| **Primitives** | Shared services every app uses: identity, law, capital, market, intel, forge, company, learn |
| **App registry** | First-party apps + forged packages installed into the workspace |
| **Runtime** | `POST /platform/apps/{id}/invoke` runs an action under the shared lawbook + receipt |
| **Shell** | PLATFORM tab = kernel health + registry + live market |

Competition / PROOF tabs are **optional views** on top of the platform. They are not the product.

## Primitives

1. **identity** — wallets (public only) + twin sync  
2. **law** — owner constitution + ecosystem lawbook  
3. **capital** — SovereignVault route (sim first, owner signs)  
4. **market** — trading desk, marks, strategies  
5. **intel** — AI node + sandbox (no real keys)  
6. **forge** — pipeline → installable packages  
7. **company** — GM + departments  
8. **learn** — academy + daily seatbelt  

## First-party apps

`app.shell` · `app.wallets` · `app.desk` · `app.vault` · `app.ai` · `app.company` · `app.studio` · `app.academy` · `app.daily` · `app.nomos` ([docs/NOMOS.md](./NOMOS.md) — propose + arena, REJECT is a feature)

Forged packages appear as `pkg.{project_id}` after STUDIO pipeline.

## API

```
GET  /platform
GET  /platform/primitives
GET  /platform/apps
GET  /platform/apps/{id}
POST /platform/apps/{id}/invoke   { "action": "arena", "network": "monad-testnet", "params": {} }
```

Example:

```bash
curl http://127.0.0.1:8043/platform
curl -X POST http://127.0.0.1:8043/platform/apps/app.desk/invoke \
  -H "content-type: application/json" \
  -d "{\"action\":\"arena\"}"
```

## Doctrine

> Apps share one lawbook. Agents propose. Laws decide. Owner signs. Receipts remember.
