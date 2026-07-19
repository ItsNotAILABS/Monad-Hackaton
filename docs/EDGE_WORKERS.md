# Cloudflare Workers — edge AI agents

## What they are

**Cloudflare Workers** are serverless functions on Cloudflare’s global edge network (~**300+ cities**).  
Instead of one big AI server in one region, MonadBuilder deploys **many small AI agents** as Workers.

Each Worker can hold:

| Piece | Role |
|-------|------|
| **Agent logic** | Route intents (seatbelt, signals, nomos, x, horizon) |
| **Tools / memory** | Call origin FastAPI for real tools + dual-stack law |
| **Optional LLM** | Grok / OpenAI / CF AI Gateway for copy polish only |
| **Dashboard link** | Always talks to central `ORIGIN_API` |

Cloudflare runs the Worker in the **data center closest to the request**.

## Architecture

```
User (any city)
    │
    ▼
Cloudflare Worker (nearest colo)
    │  seatbelt | signals | nomos | x | horizon
    ▼
ORIGIN_API  (MonadBuilder FastAPI HQ)
    │  laws · desk · vault · agent/step · x drafts
    ▼
Monad contracts  (PolicyKernel · LawBook · SovereignVault)
```

**Edge never bypasses NOMOS.** Capital law and paper/chain gates stay on origin + chain.

## Agents (shipped)

| Agent | Path | Origin tools |
|-------|------|----------------|
| **seatbelt** | `/agent/seatbelt` | brief, morning, reject |
| **signals** | `/agent/signals` | board, auto loop |
| **nomos** | `/agent/nomos` | dual-stack arena |
| **x** | `/agent/x` | X marketing draft |
| **horizon** | `/agent/horizon` | long-horizon delta step |

## Deploy

```bash
cd edge
npm i
# Edit wrangler.toml [vars] ORIGIN_API = "https://your-api.example.com"
npx wrangler login
npx wrangler deploy

# Optional LLM secrets
npx wrangler secret put XAI_API_KEY
npx wrangler secret put OPENAI_API_KEY
```

## Local (no CF account)

```bash
# Same routing, origin-side simulator
curl -s -X POST http://127.0.0.1:8043/edge/run \
  -H "content-type: application/json" \
  -d '{"agent":"seatbelt","action":"brief"}'

curl -s http://127.0.0.1:8043/edge
```

After deploy:

```bash
curl -s https://monadbuilder-edge.<you>.workers.dev/health
curl -s -X POST https://monadbuilder-edge.<you>.workers.dev/v1/run \
  -H "content-type: application/json" \
  -d '{"agent":"nomos","action":"arena"}'
```

## Multi-device stack (full picture)

1. **Cloudflare edge** — global agent entry  
2. **Browser Web Worker** — off-main-thread scoring  
3. **Node worker_threads** — bridge hybrid  
4. **Python origin** — dual-stack truth  
5. **Monad** — owner-signed capital  

Docs: [HYBRID_WORKERS.md](./HYBRID_WORKERS.md) · [DELTA_AI.md](./DELTA_AI.md)

## Policy

- Briefs: **text only** (no robot TTS)  
- STT: browser-native for notes/commands  
- Edge LLM: optional enrichment only  
