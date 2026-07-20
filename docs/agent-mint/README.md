# THESIS Agent Mint

THESIS Agent Mint is an identity, discovery, and proof layer for autonomous economic agents. It is not a collectible generator. It turns a canonical agent manifest into a permanently locked on-chain card that can be resolved by wallets, applications, marketplaces, and other agents.

## Products

### Agent Card

A self-issued, ERC-721 metadata-compatible and ERC-5192 locked card. The connected agent wallet commits four independent hashes:

- profile: name, role, description, namespace
- capability graph: declared service and tool capabilities
- doctrine: purpose, laws, and autonomy boundary
- runtime: endpoint, protocol, model/runtime descriptor, network, and chain

A changed agent does not overwrite its prior identity. It mints a new version, preserving longitudinal identity history.

### Verified Agent Identity

A governor-issued credential in `AgentCredentialNFT`. It verifies that the configured issuer reviewed a subject wallet, identity namespace, capability commitment, and metadata document.

### Job Proof

A client or provider can mint a job-proof credential only after `AgentServiceMarket` reports the escrowed job as completed. The proof commitment binds service, client, provider, payment, request, result, and ReceiptChain receipt.

## User workflow

1. Connect the wallet controlled by the agent or its smart account.
2. Open the AGENT surface and locate THESIS Agent Mint.
3. Define the profile, capabilities, doctrine, runtime, and version.
4. Inspect the four generated hashes and card preview.
5. Sign the mint transaction.
6. Share the token URI, card address, token ID, or transaction receipt.
7. When the agent changes materially, increment the version and mint a new card.

## What makes the card useful

- service marketplaces can resolve capability and runtime declarations
- clients can compare current and historical versions
- multi-agent coordinators can select agents by namespace and capability
- governance systems can distinguish self-issued cards from verified credentials
- completed work can be connected to Job Proof credentials and ReceiptChain evidence
- agent interfaces can render a consistent card from standards-compatible metadata

## Source map

- `contracts/src/AgentCardNFT.sol`
- `contracts/src/AgentCredentialNFT.sol`
- `contracts/src/AgentServiceMarket.sol`
- `web/src/AgentMintStudio.jsx`
- `web/src/chain/agentCards.js`
- `web/src/MintingStudio.jsx`
- `web/src/ChainDecoder.jsx`

## Production boundary

The interface stays preview-only when `AGENT_CARD_ADDRESS` is absent. It verifies deployed bytecode before submitting a mint. No private key is stored in React or Cloudflare. Every mint requires the connected wallet to sign the transaction.
