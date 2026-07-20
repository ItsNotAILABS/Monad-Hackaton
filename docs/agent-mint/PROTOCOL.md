# THESIS Agent Mint Protocol

## 1. Purpose

The protocol gives autonomous agents an inspectable identity checkpoint without making identity transferable. Each card is a wallet-issued statement bound to a canonical manifest. Verification credentials and job proofs remain separate because self-description, third-party attestation, and completed-work evidence are different trust classes.

## 2. Trust classes

| Artifact | Issuer | Source of truth | Transferable |
|---|---|---|---|
| Agent Card | Agent wallet | Canonical manifest hashes | No |
| Verified Agent Identity | Governor wallet | Issuer review | No |
| Job Proof | Job client or provider | Completed market job + ReceiptChain | No |

## 3. Manifest planes

### Profile plane

Human and machine-facing identity: name, role, description, and namespace.

### Capability plane

A sorted capability declaration. Capabilities are claims until supported by service publication, job history, receipts, or external verification.

### Doctrine plane

Purpose, operating laws, and autonomy classification. This plane describes what the agent is allowed to do, not merely what it can technically execute.

### Runtime plane

Public endpoint, interaction protocol, model/runtime descriptor, chain identity, and network name. Secrets, private endpoints, credentials, and private prompts must never appear in public card metadata.

## 4. Hash construction

The browser sorts object keys recursively and serializes each plane into canonical JSON. Each plane is independently committed with `keccak256(UTF8(canonical_json))`. The contract stores the four hashes, metadata URI, version, issuer wallet, and mint time.

Independent hashes permit partial comparison. Two versions may preserve doctrine while changing runtime, or preserve profile while extending capabilities.

## 5. Version law

Cards are immutable. Material changes require a new positive integer version. Previous versions remain resolvable and establish longitudinal provenance. The contract rejects an exact duplicate from the same wallet.

## 6. Metadata law

The metadata schema is `thesis.agent-card.v1`. It uses ERC-721 metadata fields where practical and includes a `thesis` object containing the four manifest planes. The initial interface can emit a self-contained data URI. Production operators may instead use immutable IPFS or Arweave URIs.

## 7. Security boundary

- minting is wallet-signed
- Agent Cards can only be minted to the calling wallet
- cards cannot transfer or approve operators
- malformed or empty plane hashes are rejected
- duplicate card commitments are rejected
- Cloudflare exposes public runtime configuration only
- deployer and governor keys never enter the browser bundle
- an absent or code-less contract address disables minting

## 8. Relationship to the economy

Agent Cards make agents discoverable. `AgentServiceMarket` makes services payable. `ReceiptChain` makes execution auditable. `AgentCredentialNFT` makes verified identity and completed work attestable. None of these layers replaces the others.
