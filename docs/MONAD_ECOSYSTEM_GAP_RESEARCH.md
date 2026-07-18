# Monad ecosystem gap research

Research date: 2026-07-18

## What already exists

Monad already has a strong but fragmented builder stack:

- The official Developer Portal provides network configuration, faucet access, and separate Remix, Hardhat, and Foundry deployment guides.
- The official guides separately cover contract deployment, verification, indexing, wallet connectivity, MCP servers, x402, and execution events.
- Monad's infrastructure directory lists more than 200 providers across RPC, indexers, wallets, toolkits, oracles, payments, AI infrastructure, and hosting-adjacent services.
- `scaffold-monad-foundry` gives developers a preconfigured Next.js + RainbowKit + Wagmi + Viem + Foundry starter.
- Enso abstracts onchain interactions behind a shared execution engine.
- JENIUS is listed by Monad as a prompt-based tool for contract deployment and strategy construction.

Primary sources:

- https://developers.monad.xyz/
- https://docs.monad.xyz/guides
- https://www.monad.xyz/infra
- https://github.com/monad-developers/scaffold-monad-foundry

## Corrected market claim

The opportunity is **not** that Monad has no prompt tooling or no development frameworks.

The opportunity is that we did not find a Monad-native product that unifies all of the following into one transparent workflow:

1. Human intent capture.
2. Structured application specification.
3. Source-grounded Monad integration selection.
4. Smart-contract and frontend generation.
5. Repository creation and version history.
6. Tests and explicit validation gates.
7. Contract deployment and verification.
8. Frontend hosting.
9. Machine-readable execution receipts.
10. A plain-language explanation of every decision while the build is running.

## Competitive distinction

### Existing prompt tools

Useful for fast generation or a narrow workflow, but the user may not receive a complete, inspectable project lifecycle.

### Existing toolkits

Useful for developers who already know the stack, but they require the builder or coding agent to manually coordinate tools, configuration, tests, deployment, verification, and hosting.

### THESIS Forge

THESIS Forge is an **explainable Monad application operating system**.

It exposes the same canonical build graph in two forms:

- **Human view:** what is happening, why it is happening, what can go wrong, and what the user needs to do next.
- **Agent view:** typed inputs, outputs, commands, artifacts, checks, evidence, and receipts for every stage.

The build is not a hidden chat response. It is a stateful, inspectable process.

## Product wedge

The first complete wedge is:

> Describe a Monad application, watch THESIS turn the request into a source-grounded build graph, download the generated project, run its tests, deploy its contracts, verify them, and receive a permanent release receipt.

## Required proof for the hackathon

The demo must prove real work rather than simulated status changes:

- A request produces a typed manifest.
- The manifest selects real Monad integrations and cites their source pages.
- A downloadable repository package is generated.
- Generated files are visible before download.
- Validation results are attached to exact files and commands.
- Deployment is blocked until a wallet and RPC are available.
- A successful deployment returns a real address and transaction hash.
- Verification and hosting have separate, visible states.
- Failed steps remain failed or blocked; the interface never displays a fake success toast.
