# Browser-local AI (Transformers.js)

THESIS Platform includes a **browser-only** intelligence surface. It does not send prompts or embeddings to a cloud LLM.

## Stack

| Module | Tech | Role |
|--------|------|------|
| **Inference** | `@huggingface/transformers` · custom models | Local embeddings |
| **Memory** | IndexedDB | Notes, events, docs, research runs |
| **Security** | Pattern scanner | Blocks keys/seeds; DeFi risk language |
| **Knowledge graph** | localStorage | Entities, venues, laws |
| **Research agents** | Scout → Risk → Synthesizer | Multi-step local research |
| **Documents** | Markdown / PDF / Excel | Offline exports |
| **Teach** | In-tab curriculum + security playbook | Learn while operating |
| **Extension** | Packaged Chrome/Edge ZIP | Load-unpacked scanner companion |

## Security + teach (use it in the app)

Open **LOCAL AI → Teach & Security**:

1. Work through lessons (keys, gas, approvals, agents, exports, extension).  
2. Pass the quick check on each lesson — progress is local.  
3. Use **Live security scan** on drafts before remember/research.  
4. **Security audit** scans memory and can emit PDF/Markdown briefs.  
5. Playbook rows map to ecosystem laws (`sys.no-real-keys`, `monad.gas-bills-limit`, …).

**Export · Extension** tab: Security PDF, Inventory Excel, Research Excel, ops Markdown, and **Download extension ZIP** (permissions: `activeTab` + `storage` only).

## Use custom models

Transformers.js supports custom model locations and WASM paths ([HF docs](https://huggingface.co/docs/transformers.js/custom_usage)):

```js
import { env } from '@huggingface/transformers';

// Custom location for models (THESIS default: '/models/')
env.localModelPath = '/models/';

// Disable Hugging Face Hub downloads (offline)
env.allowRemoteModels = false;

// Custom ONNX Runtime WASM location (after setup script)
env.backends.onnx.wasm.wasmPaths = '/wasm/';
```

THESIS applies these via **LOCAL AI → Custom models** (persisted in `localStorage` as `thesis.transformers.env.v1`).

| Setting | Default | Meaning |
|---------|---------|---------|
| `modelId` | `Xenova/all-MiniLM-L6-v2` | Hub id **or** folder under `/models/` |
| `localModelPath` | `/models/` | Vite serves `web/public/models/` |
| `allowRemoteModels` | `true` | Hub download allowed |
| `allowLocalModels` | `true` | Read from `localModelPath` |
| `useBrowserCache` | `true` | Cache remote models in browser |
| `wasmPaths` | _(empty = CDN)_ | e.g. `/wasm/` for offline |
| `offlineOnly` | `false` | Forces `allowRemoteModels=false` |

### Convert models to ONNX (Optimum)

```bash
pip install "optimum[onnxruntime]" transformers

optimum-cli export onnx \
  --model sentence-transformers/all-MiniLM-L6-v2 \
  --task feature-extraction \
  ./web/public/models/all-MiniLM-L6-v2
```

Then set **Model id** to `all-MiniLM-L6-v2` and enable **Offline only**.

### Offline WASM

```powershell
powershell -File scripts/setup-transformers-assets.ps1
```

Copies `ort-*.wasm` from `node_modules/@huggingface/transformers/dist` → `web/public/wasm/`.  
Set **wasmPaths** to `/wasm/` (Offline preset does this).

### Folder layout

```
web/public/models/
  all-MiniLM-L6-v2/
    config.json
    tokenizer.json
    onnx/model.onnx
web/public/wasm/
  ort-wasm-simd-threaded.wasm
  ...
```

## UI

Open the **LOCAL AI** tab.

1. **Custom models** — set path / remote / WASM · Hub or Offline preset  
2. **Probe /models/** — HEAD-check for local files  
3. **Apply & load** — `pipeline(task, modelId)` with applied `env`  
4. **Remember / Research / Security** — same as before  

## Security doctrine

- Never paste private keys, seeds, or mnemonics  
- Security gate throws before remember/research if critical patterns appear  
- Platform API is used only for **public** pulse  
- Custom models are still public weights — do not bake secrets into model folders  

## Code layout

```
web/src/local-ai/
  inference.js       Transformers.js + custom env
  memory.js
  knowledgeGraph.js
  security.js
  research.js
  documents.js
  LocalAI.jsx
  index.js
web/public/models/   Local ONNX models
web/public/wasm/     Local ORT WASM
scripts/setup-transformers-assets.ps1
```

## Platform registration

- Primitive: `local_ai`  
- App: `app.local_ai` → tab `local`  
