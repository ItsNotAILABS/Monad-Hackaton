# ONNX Runtime WASM (Transformers.js)

By default Transformers.js loads WASM from a CDN. For **fully offline / custom** setups:

```js
import { env } from '@huggingface/transformers';
env.backends.onnx.wasm.wasmPaths = '/wasm/';
```

## Populate this folder

From `web/`:

```powershell
powershell -File ../scripts/setup-transformers-assets.ps1
```

Or copy manually from:

`node_modules/@huggingface/transformers/dist/*.wasm`

Expected files (names vary by package version):

- `ort-wasm-simd-threaded.wasm`
- `ort-wasm-simd-threaded.asyncify.wasm`
- (optional) `jsep` / `jspi` variants

Vite serves them at **`/wasm/`**.
