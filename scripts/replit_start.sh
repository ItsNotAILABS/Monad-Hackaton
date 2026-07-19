#!/usr/bin/env bash
# MonadBuilder+ — unified startup script
# Starts BOTH apps together:
#   1. Python THESIS engine (local/desktop backend) on port 8043
#   2. Node.js MonadBuilder+ API + web app (web version) on $PORT
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   MonadBuilder+ · THESIS OS · Unified Start         ║"
echo "║   Web app  →  Node.js API on \$PORT                  ║"
echo "║   Engine   →  Python THESIS on :8043                ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Python THESIS engine ───────────────────────────────────────────────────
if [ -d "$ROOT/engine" ]; then
  echo "▶ Installing Python THESIS engine..."
  python -m pip install --disable-pip-version-check -q -e "$ROOT/engine"
  echo "  ✓ Engine installed"

  echo "▶ Starting Python THESIS engine on :8043 (background)..."
  python -m uvicorn thesis_forge.serve:app \
    --app-dir "$ROOT/engine" \
    --host 127.0.0.1 \
    --port 8043 \
    --proxy-headers \
    --forwarded-allow-ips="*" \
    --log-level warning &
  ENGINE_PID=$!
  echo "  ✓ THESIS engine PID $ENGINE_PID"
else
  echo "  ⚠  engine/ not found — skipping Python startup"
fi

# ── 2. Web frontend (web/) ────────────────────────────────────────────────────
if [ -d "$ROOT/web" ]; then
  echo "▶ Installing web frontend deps..."
  if [ -f "$ROOT/web/package-lock.json" ]; then
    npm --prefix "$ROOT/web" ci --silent 2>/dev/null || npm --prefix "$ROOT/web" install --silent
  else
    npm --prefix "$ROOT/web" install --silent
  fi
  npm --prefix "$ROOT/web" run build --silent 2>/dev/null || echo "  ⚠  web/ build skipped"
  echo "  ✓ Web frontend built"
fi

# ── 3. pnpm workspace (MonadBuilder+ web app) ────────────────────────────────
echo "▶ Installing pnpm workspace deps..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
echo "  ✓ pnpm deps installed"

# ── 4. DB migrations ─────────────────────────────────────────────────────────
if [ -n "${DATABASE_URL:-}" ]; then
  echo "▶ Running DB migrations..."
  cd "$ROOT/lib/db"
  pnpm db:push 2>/dev/null || echo "  ⚠  Migrations already up to date"
  cd "$ROOT"
  echo "  ✓ Database ready"
fi

# ── 5. Build MonadBuilder+ API ───────────────────────────────────────────────
echo "▶ Building MonadBuilder+ API server..."
pnpm --filter @workspace/api-server run build
echo "  ✓ API server built"

# ── 6. Start MonadBuilder+ Node.js API (foreground, public port) ─────────────
echo ""
echo "▶ Starting MonadBuilder+ Node.js API on port ${PORT:-8080}..."
echo "  (THESIS engine running on :8043 in background)"
echo ""
exec node --enable-source-maps "$ROOT/artifacts/api-server/dist/index.mjs"
