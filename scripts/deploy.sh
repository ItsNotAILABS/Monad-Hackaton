#!/usr/bin/env bash
set -euo pipefail
: "${PRIVATE_KEY:?PRIVATE_KEY required}"
: "${MONAD_TESTNET_RPC_URL:?MONAD_TESTNET_RPC_URL required}"
cd "$(dirname "$0")/../contracts"
forge create src/PolicyKernel.sol:PolicyKernel --rpc-url "$MONAD_TESTNET_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast
forge create src/ReceiptChain.sol:ReceiptChain --rpc-url "$MONAD_TESTNET_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast
forge create src/AgentRegistry.sol:AgentRegistry --rpc-url "$MONAD_TESTNET_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast
forge create src/ProposalBook.sol:ProposalBook --rpc-url "$MONAD_TESTNET_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast
forge create src/ExecutionRouter.sol:ExecutionRouter --rpc-url "$MONAD_TESTNET_RPC_URL" --private-key "$PRIVATE_KEY" --broadcast
