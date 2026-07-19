#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[MonadBuilder] Installing Python engine"
python -m pip install --disable-pip-version-check -e ./engine

echo "[MonadBuilder] Building frontend"
if [ -f web/package-lock.json ]; then
  npm --prefix web ci
else
  npm --prefix web install
fi
npm --prefix web run build

echo "[MonadBuilder] Starting single-origin API + frontend"
exec python -m uvicorn thesis_forge.serve:app \
  --app-dir engine \
  --host 0.0.0.0 \
  --port "${PORT:-8043}" \
  --proxy-headers \
  --forwarded-allow-ips="*"
