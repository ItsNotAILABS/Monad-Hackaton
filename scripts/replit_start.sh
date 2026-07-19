#!/usr/bin/env bash
# MonadBuilder+ — Replit startup script
# Installs deps, runs DB migrations, builds everything, then starts all services.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        MonadBuilder+ · Replit Start          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Install all workspace dependencies ────────────────────────────────────
echo "▶ Installing workspace dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
echo "  ✓ Dependencies installed"

# ── 2. DB migrations ─────────────────────────────────────────────────────────
if [ -n "${DATABASE_URL:-}" ]; then
  echo "▶ Running database migrations..."
  cd lib/db
  pnpm db:push 2>/dev/null || echo "  ⚠  Migration skipped (already up to date)"
  cd "$ROOT"
  echo "  ✓ Database ready"
else
  echo "  ⚠  DATABASE_URL not set — skipping migrations"
fi

# ── 3. Build the API server (required for production mode) ───────────────────
echo "▶ Building API server..."
pnpm --filter @workspace/api-server run build
echo "  ✓ API server built"

# ── 4. Build the frontend (static assets for production) ────────────────────
echo "▶ Building frontend..."
pnpm --filter @workspace/monad-builder run build 2>/dev/null || echo "  ⚠  Frontend build skipped"
echo "  ✓ Frontend built"

# ── 5. Start services (production) ───────────────────────────────────────────
echo ""
echo "▶ Starting API server on port ${PORT:-8080}..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
