#!/usr/bin/env bash
# Verify on MonadVision via Sourcify (official Foundry path).
# https://docs.monad.xyz/guides/verify-smart-contract/foundry
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

CHAIN="${1:-10143}" # 10143 testnet | 143 mainnet
ADDR="${2:?contract address}"
NAME="${3:?ContractName e.g. SovereignVault}"

forge verify-contract \
  "$ADDR" \
  "src/${NAME}.sol:${NAME}" \
  --chain "$CHAIN" \
  --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org/

echo "Open: https://$([ "$CHAIN" = "143" ] && echo '' || echo 'testnet.')monadvision.com/address/$ADDR"
