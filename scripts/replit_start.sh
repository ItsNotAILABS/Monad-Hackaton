#!/usr/bin/env bash
# RETIRED COMPATIBILITY ENTRYPOINT
# Replit is no longer part of the supported architecture.
# Use scripts/start_local.sh for local development and CLOUDFLARE_PRODUCTION.md for production.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "warning: scripts/replit_start.sh is retired; delegating to scripts/start_local.sh" >&2
exec "$ROOT/scripts/start_local.sh" "$@"