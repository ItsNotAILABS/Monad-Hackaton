# MonadBuilder+ — demo video

`monadbuilder-demo.mp4` is a 1:47 screen recording of the app in use, driving a real
Chromium session through the main workflow:

**BUILDER** (daily AI brief + one-tap utilities) → **STUDIO** → **IDE** → **NOMOS**
(policy kernel) → **CODEX** (ecosystem atlas) → **DESK** (paper trading) → **ACADEMY**
→ **AGENT** → **PLATFORM** → **TERM**, then back to BUILDER for the close.

The recording overlays a synthetic cursor, click ripples, and captions so it reads as a
guided tour.

## Regenerate

The recording is produced by `record-demo.mjs` (Playwright, no audio). It records the
frontend running locally, so start the full stack first:

```bash
# 1. backend (FastAPI on :8043)
cd engine && pip install -e . && \
  THESIS_CORS='*' uvicorn thesis_forge.api:app --host 127.0.0.1 --port 8043 &

# 2. frontend (Vite on :5173, proxying /api -> :8043)
cd web && npm install && \
  VITE_PROXY_TARGET=http://127.0.0.1:8043 npm run dev &

# 3. record -> demo/video/*.webm
npm i -g playwright-core   # or install locally
node demo/record-demo.mjs
```

Point it at any URL with `DEMO_URL=https://monados.medinatechlabs.net/ node demo/record-demo.mjs`,
and set `PW_CHROMIUM=/path/to/chrome` to use a specific Chromium build.

Convert the resulting `.webm` to a shareable `.mp4`:

```bash
ffmpeg -i demo/video/*.webm -vf "scale=1440:900,fps=30" \
  -c:v libx264 -pix_fmt yuv420p -crf 21 -movflags +faststart demo/monadbuilder-demo.mp4
```
