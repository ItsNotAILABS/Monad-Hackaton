# Local Transformers.js models

Transformers.js looks here when `env.localModelPath = '/models/'` (default for THESIS).

## Layout

```
public/models/
  Xenova/all-MiniLM-L6-v2/     # or any folder name you set as modelId
    config.json
    tokenizer.json
    tokenizer_config.json
    onnx/
      model.onnx               # or model_quantized.onnx
  my-custom-embedder/
    ...
```

Vite serves this folder at **`/models/`**.

## Convert a PyTorch / Hub model to ONNX (Optimum)

```bash
# install once
pip install "optimum[onnxruntime]" transformers

# example: sentence embeddings
optimum-cli export onnx \
  --model sentence-transformers/all-MiniLM-L6-v2 \
  --task feature-extraction \
  ./web/public/models/all-MiniLM-L6-v2
```

Then in LOCAL AI → Custom models:

- **Model id:** `all-MiniLM-L6-v2` (folder name)  
- **localModelPath:** `/models/`  
- **Offline only:** on (sets `allowRemoteModels = false`)

## Or download a pre-converted Xenova model

Browse https://huggingface.co/Xenova and copy the ONNX repo into:

`public/models/Xenova/<model-name>/`

Keep the same relative structure as the Hub (including `onnx/`).

## Offline checklist

1. Models under `public/models/...`  
2. WASM under `public/wasm/` — run `powershell -File scripts/setup-transformers-assets.ps1`  
3. UI: Offline only ✓ · Load model  

See [docs/LOCAL_AI.md](../../../docs/LOCAL_AI.md).
