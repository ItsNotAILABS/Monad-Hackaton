# Agent Mint Cloudflare Publication Contract

The production workflow must refuse publication unless all required public runtime bindings are present and valid.

## Canonical bindings

- `AGENT_CARD_ADDRESS` - self-issued Agent Card contract.
- `AGENT_CREDENTIAL_ADDRESS` - verified identity and completed-job proof contract.
- `AGENT_MARKET_ADDRESS` - service catalog, escrow, settlement, and dispute contract.
- `RECEIPT_CHAIN_ADDRESS` - canonical execution proof-chain binding.
- `AGENT_REGISTRY_ADDRESS` - agent authorization registry.
- `THESIS_API_ORIGIN` or a bound `THESIS_ENGINE` service - governed runtime entrypoint.
- `MONAD_RPC_URL` - server-side read RPC.
- `MONAD_WALLET_RPC_URL` - optional public wallet RPC.
- `MONAD_CHAIN_ID`, `MONAD_NETWORK_NAME`, `MONAD_NATIVE_SYMBOL`, and `MONAD_EXPLORER_URL` - network identity.

## Compatibility alias

`AGENT_RECEIPT_CHAIN_ADDRESS` may be accepted as a compatibility alias for operator tooling and imported deployment manifests. `RECEIPT_CHAIN_ADDRESS` remains canonical.

If both names are configured, they must resolve to the same address. Conflicting values are a release-blocking configuration error.

## Publication gate

Before the web application is deployed, automation must:

1. verify every required binding exists;
2. validate all contract addresses as 20-byte EVM addresses;
3. confirm the configured chain ID is positive and safe to represent;
4. compile the Agent Mint manifest harness;
5. build the web and Pages Functions package;
6. verify Agent Mint, credential minting, market, receipt-decoder, and runtime files exist;
7. publish only after repository validation is green;
8. emit a deployment receipt containing commit, project, deployment URL, products, and binding names.

A deployment receipt is not an on-chain deployment receipt. Both are required before describing the complete product as live.