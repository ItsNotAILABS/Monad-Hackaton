#!/usr/bin/env bash
# Deploy THESIS contracts to Monad (official Foundry path).
# https://docs.monad.xyz/guides/deploy-smart-contract/foundry
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

# Prefer public testnet RPC from docs if unset
export MONAD_TESTNET_RPC_URL="${MONAD_TESTNET_RPC_URL:-https://testnet-rpc.monad.xyz}"
export MONAD_MAINNET_RPC_URL="${MONAD_MAINNET_RPC_URL:-https://rpc.monad.xyz}"

NETWORK="${1:-testnet}" # testnet | mainnet
: "${PRIVATE_KEY:?Set PRIVATE_KEY (hex, 0x…)}"

if [[ "$NETWORK" == "mainnet" ]]; then
  RPC="$MONAD_MAINNET_RPC_URL"
  CHAIN=143
  EXPLORER="https://monadvision.com"
else
  RPC="$MONAD_TESTNET_RPC_URL"
  CHAIN=10143
  EXPLORER="https://testnet.monadvision.com"
fi

echo "[deploy] network=$NETWORK chainId=$CHAIN rpc=$RPC"

# Optional: keystore path from docs
# forge script … --account monad-deployer --broadcast
if [[ -n "${FOUNDRY_ACCOUNT:-}" ]]; then
  ACCOUNT_ARGS=(--account "$FOUNDRY_ACCOUNT")
  unset PRIVATE_KEY_EXPORT
  PK_ARGS=()
else
  ACCOUNT_ARGS=()
  PK_ARGS=(--private-key "$PRIVATE_KEY")
fi

OUT_JSON="$ROOT/receipts/deployment.json"
mkdir -p "$ROOT/receipts"

# Broadcast via forge script (wires SovereignVault constructor)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC" \
  --broadcast \
  -vvv \
  "${ACCOUNT_ARGS[@]}" \
  "${PK_ARGS[@]}" \
  --sig "run()" 2>&1 | tee /tmp/thesis-deploy.log

# Best-effort address harvest from console logs
VAULT=$(grep -E "SovereignVault|PRIMARY_SUBMISSION_ADDRESS" /tmp/thesis-deploy.log | awk '{print $NF}' | tail -1 || true)
POLICY=$(grep "PolicyKernel" /tmp/thesis-deploy.log | awk '{print $NF}' | tail -1 || true)
RECEIPTS=$(grep "ReceiptChain" /tmp/thesis-deploy.log | awk '{print $NF}' | tail -1 || true)

cat >"$OUT_JSON" <<EOF
{
  "schema": "thesis.deployment.v1",
  "network": "$NETWORK",
  "chainId": $CHAIN,
  "rpc": "$RPC",
  "explorer": "$EXPLORER",
  "primary_submission_address": "$VAULT",
  "contracts": {
    "PolicyKernel": "$POLICY",
    "ReceiptChain": "$RECEIPTS",
    "SovereignVault": "$VAULT"
  },
  "docs": {
    "deploy": "https://docs.monad.xyz/guides/deploy-smart-contract/foundry",
    "verify": "https://docs.monad.xyz/guides/verify-smart-contract/foundry",
    "network": "https://docs.monad.xyz/developer-essentials/network-information",
    "faucet": "https://testnet.monad.xyz"
  },
  "verify_hint": "forge verify-contract <addr> <Name> --chain $CHAIN --verifier sourcify --verifier-url https://sourcify-api-monad.blockvision.org/"
}
EOF

echo "[deploy] wrote $OUT_JSON"
echo "[deploy] Spark contract address field → SovereignVault: $VAULT"
echo "[deploy] Explorer: $EXPLORER/address/$VAULT"
