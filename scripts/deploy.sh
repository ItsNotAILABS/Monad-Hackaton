#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

required=(MONAD_RPC_URL MONAD_CHAIN_ID MONAD_NETWORK_NAME MONAD_EXPLORER_URL PRIVATE_KEY DEPLOYER_OWNER PROTOCOL_TREASURY PROTOCOL_FEE_BPS JOB_REVIEW_PERIOD_SECONDS)
for key in "${required[@]}"; do
  [[ -n "${!key:-}" ]] || { echo "missing required environment variable: $key" >&2; exit 1; }
done

LOG_PATH="${DEPLOY_LOG_PATH:-$ROOT/receipts/agent-economy-deploy.log}"
RECEIPT_PATH="${DEPLOY_RECEIPT_PATH:-$ROOT/receipts/agent-economy-deployment.json}"
mkdir -p "$(dirname "$LOG_PATH")" "$(dirname "$RECEIPT_PATH")"

forge script script/DeployAgentEconomy.s.sol:DeployAgentEconomy \
  --rpc-url "$MONAD_RPC_URL" \
  --chain-id "$MONAD_CHAIN_ID" \
  --broadcast \
  -vvv 2>&1 | tee "$LOG_PATH"

extract_address(){ local label="$1"; awk -v label="$label" '$0 ~ label {print $NF}' "$LOG_PATH" | tail -1; }
MARKET_ADDRESS="$(extract_address AGENT_MARKET_ADDRESS)"
RECEIPT_CHAIN_ADDRESS="$(extract_address RECEIPT_CHAIN_ADDRESS)"
AGENT_REGISTRY_ADDRESS="$(extract_address AGENT_REGISTRY_ADDRESS)"
address_pattern='^0x[0-9a-fA-F]{40}$'
for pair in "AGENT_MARKET_ADDRESS=$MARKET_ADDRESS" "RECEIPT_CHAIN_ADDRESS=$RECEIPT_CHAIN_ADDRESS" "AGENT_REGISTRY_ADDRESS=$AGENT_REGISTRY_ADDRESS"; do
  name="${pair%%=*}"; value="${pair#*=}"
  [[ "$value" =~ $address_pattern ]] || { echo "invalid deployed address for $name: $value" >&2; exit 1; }
  code="$(cast code --rpc-url "$MONAD_RPC_URL" "$value")"
  [[ -n "$code" && "$code" != "0x" ]] || { echo "no code at $name=$value" >&2; exit 1; }
done

jq -n \
  --arg schema "thesis.agent-economy.deployment.v1" \
  --arg status "deployed" \
  --arg network "$MONAD_NETWORK_NAME" \
  --argjson chainId "$MONAD_CHAIN_ID" \
  --arg explorer "${MONAD_EXPLORER_URL%/}" \
  --arg agentMarket "$MARKET_ADDRESS" \
  --arg receiptChain "$RECEIPT_CHAIN_ADDRESS" \
  --arg agentRegistry "$AGENT_REGISTRY_ADDRESS" \
  --arg owner "$DEPLOYER_OWNER" \
  --arg treasury "$PROTOCOL_TREASURY" \
  --argjson protocolFeeBps "$PROTOCOL_FEE_BPS" \
  --argjson reviewPeriodSeconds "$JOB_REVIEW_PERIOD_SECONDS" \
  --arg releaseSha "${GITHUB_SHA:-local}" \
  '{schema:$schema,status:$status,network:$network,chainId:$chainId,explorer:$explorer,contracts:{AgentServiceMarket:$agentMarket,ReceiptChain:$receiptChain,AgentRegistry:$agentRegistry},governance:{owner:$owner,treasury:$treasury,protocolFeeBps:$protocolFeeBps,reviewPeriodSeconds:$reviewPeriodSeconds},releaseSha:$releaseSha}' > "$RECEIPT_PATH"

cat "$RECEIPT_PATH"
echo "deployment receipt: $RECEIPT_PATH"
