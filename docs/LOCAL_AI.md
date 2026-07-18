# Browser-local AI (Transformers.js)

THESIS Platform includes a **browser-only** intelligence surface. It does not send prompts or embeddings to a cloud LLM.

## Stack

| Module | Tech | Role |
|--------|------|------|
| **Inference** | `@huggingface/transformers` · `Xenova/all-MiniLM-L6-v2` | Local embeddings |
| **Memory** | IndexedDB | Notes, events, docs, research runs |
| **Security** | Pattern scanner | Blocks keys/seeds; flags unlimited approve, silent broadcast, fat gas |
| **Knowledge graph** | localStorage nodes/edges | Entities, venues, laws, memory links |
| **Research agents** | Scout → Risk → Synthesizer | Autonomous multi-step research |
| **Documents** | Markdown → IndexedDB + download | Research reports, security briefs, ops docs |

## UI

Open the **LOCAL AI** tab.

1. **Load local model** — first run downloads MiniLM into browser cache  
2. **Remember** — store notes with embeddings  
3. **Run research loop** — agents use memory + graph + optional platform pulse  
4. **Security audit** — scan memory + generate brief  
5. **Hydrate graph** — pull public platform facts into KG  
6. **Download .md** — export generated documents  

## Security doctrine

- Never paste private keys, seeds, or mnemonics  
- Security gate throws before remember/research if critical patterns appear  
- Platform API is used only for **public** pulse (laws count, desk equity, venues)  
- AI twins / server AI node remain separate; local AI does not export keys  

## Code layout

```
web/src/local-ai/
  inference.js       Transformers.js embedder
  memory.js          IndexedDB
  knowledgeGraph.js  KG
  security.js        monitor + gate
  research.js        autonomous agents
  documents.js       markdown generation
  LocalAI.jsx        UI
  index.js           public API
```

## Platform registration

- Primitive: `local_ai`  
- App: `app.local_ai` → tab `local`  
- Advertised on `GET /platform` (runtime is browser-side)
