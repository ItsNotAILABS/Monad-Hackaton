# Agent Mint Operator Boundary

These rules apply to the browser application, Electron operator, deployment scripts, documentation, metadata, logs, and release automation.

## Signing and infrastructure

- Never paste deployer, governor, treasury, or operator private keys into Cloudflare, React, Electron renderer code, logs, documentation, prompts, or token metadata.
- Browser and Electron renderers may request wallet signatures but must never extract or persist wallet private keys.
- Deployment automation must consume signing authority only from the approved operator environment.
- Every parsed deployment address must be checked with `cast code` before publication.

## Metadata and privacy

- Never publish private prompts, customer data, internal URLs, access tokens, credentials, private datasets, or confidential runtime descriptors in Agent Card or credential metadata.
- Durable production cards should use immutable or content-addressed metadata storage.
- Public runtime endpoints must be intentionally public and scoped to the declared protocol.

## Claims and trust

- Agent Cards are self-issued claims. They are not proof of competence, identity verification, safety, or completed work by themselves.
- Higher-risk procurement must require additional evidence such as governor-issued identity credentials, ReceiptChain evidence, completed-job proofs, market history, and independent review.
- Reputation must be assembled from version history and evidence. It must not be represented as a transferable badge.

## Version and execution integrity

- Never overwrite a prior Agent Card checkpoint. Increment the positive version and mint a new card.
- Record the exact card contract, token ID, and version used for every service and job.
- Material changes to profile, capabilities, doctrine, or runtime require a new version.
- Retain transaction, deployment, and execution receipts.

## Release language

- Do not claim a contract is deployed without an on-chain transaction receipt and bytecode verification.
- Do not claim a Pages release is live without a Cloudflare deployment receipt and reachable runtime configuration.
- Do not claim external audit, certification, performance, or security guarantees unless independent evidence exists.
- A green CI run proves the tested repository state, not the live network state.