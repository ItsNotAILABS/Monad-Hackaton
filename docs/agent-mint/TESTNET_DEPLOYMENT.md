# Agent Mint Testnet Deployment Handoff

This procedure broadcasts the validated Agent Mint stack and produces the addresses required by Cloudflare. The signing environment and the web deployment environment remain separate.

## Required signing-environment values

```text
PRIVATE_KEY
MONAD_RPC_URL
MONAD_CHAIN_ID
MONAD_NETWORK_NAME
MONAD_EXPLORER_URL
DEPLOYER_OWNER
PROTOCOL_TREASURY
PROTOCOL_FEE_BPS
JOB_REVIEW_PERIOD_SECONDS
```

Optional collection values:

```text
AGENT_CREDENTIAL_NAME
AGENT_CREDENTIAL_SYMBOL
AGENT_CARD_NAME
AGENT_CARD_SYMBOL
```

Never place `PRIVATE_KEY` in Cloudflare Pages, React, a committed file, a receipt, or public metadata.

## Preflight

```bash
cd contracts
forge install --no-git foundry-rs/forge-std
forge build
forge test --match-contract AgentServiceMarketTest -vv
forge test --match-contract AgentCredentialNFTTest -vv
forge test --match-contract AgentCardNFTTest -vv
cd ..
```

## Broadcast

```bash
bash scripts/deploy.sh
```

The script must stop unless every required address is parsed and `cast code` confirms deployed bytecode. Its output is:

```text
receipts/agent-economy-deploy.log
receipts/agent-economy-deployment.json
```

## Required receipt fields

```text
contracts.AgentServiceMarket
contracts.AgentCredentialNFT
contracts.AgentCardNFT
contracts.ReceiptChain
contracts.AgentRegistry
```

## Cloudflare Pages handoff

Install the verified public values on the THESIS Pages project:

```text
AGENT_MARKET_ADDRESS       = contracts.AgentServiceMarket
AGENT_CREDENTIAL_ADDRESS   = contracts.AgentCredentialNFT
AGENT_CARD_ADDRESS         = contracts.AgentCardNFT
RECEIPT_CHAIN_ADDRESS      = contracts.ReceiptChain
AGENT_REGISTRY_ADDRESS     = contracts.AgentRegistry
MONAD_RPC_URL              = deployment RPC
MONAD_CHAIN_ID             = deployment chain ID
MONAD_NETWORK_NAME          = deployment network
MONAD_NATIVE_SYMBOL         = configured native symbol
MONAD_EXPLORER_URL          = deployment explorer
THESIS_API_ORIGIN           = governed THESIS engine origin
```

The automatic web workflow checks these bindings before it builds or deploys. A missing Agent Card address prevents Agent Mint from being represented as production-ready.

## Live verification

1. Request `/runtime-config` from the Pages deployment.
2. Confirm `contracts.agentCard` matches the deployment receipt.
3. Query `eth_getCode` for each configured contract.
4. Connect the intended testnet wallet.
5. Compile a small Agent Card manifest.
6. Sign one mint and retain the transaction receipt.
7. Decode the receipt through the Chain Decoder.
8. Load the token URI and compare all four hashes with the interface preview.
9. Download the Cloudflare deployment receipt from GitHub Actions.

No release is considered live until both the chain deployment receipt and Cloudflare deployment receipt exist.
