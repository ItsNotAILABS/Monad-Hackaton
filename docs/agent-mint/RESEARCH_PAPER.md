# THESIS Agent Mint: Non-Transferable Identity Checkpoints for Autonomous Service Agents

## Abstract

Autonomous agents increasingly need to participate in markets, publish services, coordinate with peers, and accumulate evidence of completed work. Conventional wallet addresses are insufficient identifiers, while transferable profile tokens create a category error: identity and earned history should not be sellable independently of the actor that produced them. THESIS Agent Mint introduces a layered identity and proof architecture for autonomous economic agents. The system separates self-issued Agent Cards, issuer-verified identity credentials, payable service records, execution receipts, and completed-job proofs. Agent Cards commit four independently hashable planes - profile, capability, doctrine, and runtime - and are represented as permanently locked ERC-721 metadata tokens with ERC-5192 semantics. Material agent changes create new versions rather than mutating prior identity checkpoints. This paper specifies the architecture, trust model, threat boundary, and economic integration of the protocol.

## 1. Problem

An autonomous agent can possess a wallet, but a wallet alone does not explain what the agent is, what services it offers, which operating laws constrain it, or how another system can call it. Centralized registries can provide richer descriptions but introduce platform dependence and mutable history. Traditional NFTs provide portable metadata but normally assume transferability. Transferable identity allows the market value of a record to separate from the actor whose behavior established it.

The design problem is therefore not simply to tokenize an agent. It is to create a machine-resolvable identity checkpoint with clear trust boundaries:

- self-description must be distinguishable from external verification
- capability claims must remain claims until supported by evidence
- identity history must survive upgrades
- service economics must be separate from profile metadata
- completed work must be tied to actual market state and execution receipts
- no interface should imply deployment or verification without chain evidence

## 2. Architecture

THESIS Agent Mint is composed of five cooperating layers.

### 2.1 AgentCardNFT

The Agent Card is self-issued by the wallet represented on the card. It stores four commitments, a metadata URI, a version, and a mint timestamp. Transfer and approval methods always revert. A new version is a new token, preserving historical checkpoints.

### 2.2 AgentCredentialNFT

Verified identities and completed-job proofs use a separate locked credential collection. A governor wallet issues verified identity attestations. Job participants mint proof only after the service market reports completion.

### 2.3 AgentServiceMarket

The market publishes provider-controlled services with price, capability, metadata, and SLA. Clients fund jobs and teams. Providers accept jobs and submit results. Settlement, refunds, disputes, protocol fees, and provider statistics remain on-chain.

### 2.4 ReceiptChain

ReceiptChain links execution evidence through hashes. A submitted job records a receipt commitment before settlement. Job Proof metadata can point to the corresponding receipt and deliverable.

### 2.5 THESIS runtime and Cloudflare interface

The runtime plans and performs agent work. Cloudflare Pages serves the user interface and public runtime configuration. The chain remains the source of economic and credential truth. Private keys never enter Cloudflare or the browser bundle.

## 3. Four-plane agent identity

The protocol decomposes identity into independently comparable planes.

### Profile

The profile contains the public name, role, description, and namespace. The namespace is load-bearing because other systems can use it for routing and policy.

### Capability graph

Capabilities describe services, tools, and protocols the agent claims to support. Claims become more credible when linked to published services, execution receipts, and completed jobs.

### Doctrine

Doctrine states purpose, laws, and autonomy classification. It answers a different question than capability: not what the agent can do, but what it is authorized and designed to do.

### Runtime

Runtime metadata describes the public endpoint, interaction protocol, model or runtime descriptor, network, and chain. Sensitive infrastructure is excluded.

Each plane is serialized as canonical JSON and hashed independently. Independent commitments support precise change analysis between versions.

## 4. Trust model

The system uses explicit trust classes rather than a single undifferentiated reputation score.

1. Agent Card: self-issued statement by the agent wallet.
2. Verified Agent Identity: statement by a configured issuer.
3. Service publication: provider-controlled commercial offer.
4. Receipt: machine-checkable execution commitment.
5. Job Proof: statement constrained by completed market state.
6. Market statistics: derived history of completion, refunds, and revenue.

Consumers decide which classes their policy requires. A marketplace may allow discovery from Agent Cards but require verified identity and job history before high-value work.

## 5. Versioning and continuity

Mutable profiles obscure when an agent changed. THESIS Agent Mint uses append-only versioning. A material change to profile, capabilities, doctrine, or runtime creates a new card. Prior cards remain locked to the same wallet. This produces a longitudinal identity record that can be compared without trusting a centralized change log.

Versioning also supports controlled evolution. An agent can preserve its doctrine hash while updating its runtime, or preserve its public role while adding capabilities. Systems can select the newest version or require an exact known commitment.

## 6. Economic integration

Agent identity is useful only when connected to real activity. Providers can include card references in service metadata. Clients can resolve provider identity before funding escrow. Multi-agent coordinators can select compatible agents and fund a batch. After execution and settlement, participants can mint Job Proof credentials that bind the service job and receipt.

The protocol deliberately does not make the card itself a financial asset. Economic value arises from services and earned history, not card transfer or artificial scarcity.

## 7. Security properties

- Agent Cards mint only to the calling wallet.
- Cards and credentials are permanently non-transferable.
- Empty commitments, zero versions, and duplicate manifests are rejected.
- Job Proofs require completed market state and participant authorization.
- The interface validates chain identity and deployed bytecode.
- Runtime configuration is environment-provided rather than embedded.
- Deployer and governor keys remain outside Cloudflare.
- Public metadata must exclude secrets and private customer information.
- The interface remains preview-only when required addresses are absent.

## 8. Limitations

A self-issued card does not prove that capability claims are true. Metadata availability depends on the selected URI strategy. Public endpoints may change even when an old card remains immutable. Identity across wallet rotation requires an explicit migration or verification process. Smart-account issuers must correctly implement ERC-721 receipt handling. External audits remain necessary before high-value mainnet deployment.

## 9. Evaluation plan

A production evaluation should measure:

- canonicalization determinism across browsers
- duplicate and malformed manifest rejection
- bytecode size and gas costs
- metadata resolution durability
- chain and wallet mismatch handling
- version comparison correctness
- smart-account receiver compatibility
- service-to-card and job-proof linkage
- receipt decoding coverage
- denial behavior when runtime bindings are incomplete

## 10. Conclusion

THESIS Agent Mint treats an agent as a governed, evolving economic actor rather than a collectible image. By separating self-description, verification, service economics, receipts, and completed-work proofs, the architecture provides portable identity without collapsing distinct trust claims. Locked versioned cards establish continuity; market and receipt layers establish consequence. Together they form a practical foundation for agent economies in which discovery, work, payment, and evidence remain independently inspectable.
