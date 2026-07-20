#!/usr/bin/env bash
# MonadBuilder+ · THESIS local development launcher.
# Production is Cloudflare-first; this script is for a clean Git clone or operator workstation.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-8080}"
ENGINE_PORT="${THESIS_PORT:-8043}"
ENGINE_PID=""

cleanup() {
  if [ -n "$ENGINE_PID" ] && kill -0 "$ENGINE_PID" 2>/dev/null; then
    kill "$ENGINE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "MonadBuilder+ · THESIS local runtime"
echo "Public app: http://127.0.0.1:${PORT}"
echo "THESIS:    http://127.0.0.1:${ENGINE_PORT}"

if [ ! -d "$ROOT/engine" ]; then
  echo "engine/ is required" >&2
  exit 1
fi

python -m pip install --disable-pip-version-check -q -e "$ROOT/engine"
python -m uvicorn thesis_forge.serve:app \
  --app-dir "$ROOT/engine" \
  --host 127.0.0.1 \
  --port "$ENGINE_PORT" \
  --proxy-headers \
  --forwarded-allow-ips="*" \
  --log-level warning &
ENGINE_PID=$!

for _ in $(seq 1 30); do
  if python - <<PY
import urllib.request
try:
    urllib.request.urlopen("http://127.0.0.1:${ENGINE_PORT}/health", timeout=1)
except Exception:
    raise SystemExit(1)
PY
  then
    break
  fi
  sleep 1
done

if ! kill -0 "$ENGINE_PID" 2>/dev/null; then
  echo "THESIS engine failed to start" >&2
  exit 1
fi

if [ -d "$ROOT/web" ]; then
  if [ -f "$ROOT/web/package-lock.json" ]; then
    npm --prefix "$ROOT/web" ci --silent || npm --prefix "$ROOT/web" install --silent
  else
    npm --prefix "$ROOT/web" install --silent
  fi
  npm --prefix "$ROOT/web" run build --silent || echo "warning: dedicated THESIS web build skipped"
fi

pnpm install --frozen-lockfile || pnpm install

if [ -n "${DATABASE_URL:-}" ]; then
  (cd "$ROOT/lib/db" && pnpm db:push)
fi

pnpm --filter @workspace/api-server run build
export PORT
export THESIS_URL="${THESIS_URL:-http://127.0.0.1:${ENGINE_PORT}}"
exec node --enable-source-maps "$ROOT/artifacts/api-server/dist/index.mjs"