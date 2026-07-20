# Digital-Twin Wallets for Governed AI Systems

**Working Paper 01 - MonadBuilder+ · THESIS Research Series**  
**Status:** implemented architecture; experimental evaluation  
**Organization:** MedinaSITech / ITSNotAI Labs  
**Repository:** `ItsNotAILABS/Monad-Hackaton`

## Abstract

AI systems can inspect portfolios, propose transactions, optimize strategies, and coordinate operational goals, but conventional wallet integration often collapses observation and authority into the same interface. Once an agent receives signing material or an unrestricted wallet session, simulation, recommendation, and execution become difficult to distinguish.

This paper presents the digital-twin wallet architecture implemented in MonadBuilder+ and THESIS. The architecture represents a wallet as two related but non-equivalent objects: an externally controlled wallet identity and an internal, governed state twin. The external wallet remains the source of signing authority. The twin contains normalized public identity, chain context, declared capabilities, observed balances, policy metadata, and synchronization receipts. Agents may inspect and mutate simulations derived from the twin, but they do not receive private keys, recovery phrases, or implicit authority over the source wallet.

The result is a control boundary for AI-native financial software: agents can reason about capital without silently controlling capital.

## 1. Problem

A wallet connection usually answers two questions at once:

1. Which account is the user operating?
2. What is the application allowed to do with that account?

For human-operated applications this ambiguity is already risky. For autonomous or semi-autonomous systems it is structural. An agent may need portfolio state to evaluate gas, exposure, reserves, or proposed actions, but portfolio visibility does not logically require transaction authority.

The design objective is therefore:

> maximize useful machine-readable wallet state while minimizing delegated signing authority.

## 2. Architecture

The system separates five layers.

### 2.1 External wallet identity

The source account remains in its existing system: MetaMask, Phantom, WalletConnect, Rabby, Rainbow, Coinbase Wallet, Coinbase Smart Wallet, Safe, Ledger, Trezor, Privy, Dynamic, Turnkey, Fireblocks, an embedded wallet, or a watch-only address.

THESIS stores public connection information only. A normalized identity can include:

- public address;
- CAIP-style chain identifier such as `eip155:10143`;
- provider family;
- role and namespace;
- custody and account type;
- declared signing and batching capabilities;
- policy profile;
- public session reference;
- labels, tags, and observed balances.

Secret-looking fields are rejected.

### 2.2 Observation plane

Balances may enter the system through user-attested values or read-only RPC calls. Observation is explicitly distinct from authorization. A successful balance read proves that an address has observable state; it does not prove that THESIS can sign for that address.

### 2.3 Twin plane

Observed assets are copied into a named THESIS sandbox as twin balances. A twin records the symbol, amount, source chain, source identity, synchronization time, and whether the value was synchronized.

The twin is an internal model, not a custodial wallet. Agent activity can update simulations, compare strategies, test laws, and create proposals against this model.

### 2.4 Governance plane

Proposed actions are evaluated against the active policy stack. Relevant constraints can include:

- wallet role and namespace;
- custody mode;
- allowed action category;
- maximum action value;
- minimum reserve;
- maximum exposure;
- slippage and leverage limits;
- simulation requirements;
- multisig or owner-signature requirements.

A rejection is a valid system outcome and must contain reasons.

### 2.5 Execution and receipt plane

An approved proposal still does not grant the AI a private key. Final signing remains with the external provider or owner-controlled signing infrastructure. Synchronization and material governance actions produce receipts, preserving a longitudinal record of what was observed, proposed, accepted, rejected, or synchronized.

## 3. State model

Let a source wallet be:

`W = (a, c, p, k, r, n, q)`

where `a` is the public address, `c` the chain, `p` the provider, `k` the custody class, `r` the operational role, `n` the namespace, and `q` the declared capability set.

Let an observation at time `t` be:

`O_t = (W, B_t, s_t)`

where `B_t` is the observed balance map and `s_t` identifies the observation source.

The twin is:

`T_t = copy(O_t, policy, sandbox)`

The copy relation is intentionally one-way. Changes to `T_t` do not alter `W`. Promotion from a twin proposal to an external transaction requires a separate governed transition:

`T_t -> proposal -> policy decision -> external signature -> receipt`

No direct transition from twin mutation to source-wallet mutation exists.

## 4. Threat model

The architecture is designed to reduce the impact of:

- prompt injection requesting keys or seed phrases;
- accidental secret submission;
- an agent confusing simulation with execution;
- compromised model output proposing unlawful actions;
- a browser session overstating its wallet capabilities;
- cross-role confusion between personal, treasury, agent, and deployer accounts;
- hidden state drift between an observed wallet and its internal model.

It does not eliminate risks in the external wallet, provider, browser extension, RPC source, smart contract, or user approval process.

## 5. Implemented evidence

The repository currently implements:

- public wallet linking and provider descriptions;
- secret-field refusal;
- normalized wallet identity metadata;
- wallet roles, namespaces, custody classes, capabilities, and policy profiles;
- optional native-balance RPC reads;
- sandbox twin synchronization;
- receipt sealing for wallet links and twin synchronization;
- CLI operations for architecture inspection, linking, balance updates, primary-wallet selection, and twin synchronization;
- synthetic users that exercise wallet architecture, provider discovery, watch-only registration, and twin synchronization.

These facts establish implementation, not third-party audit or production custody certification.

## 6. Evaluation protocol

A reproducible evaluation should test at least:

1. secret material is rejected;
2. duplicate or malformed identities fail safely;
3. CAIP chain identifiers normalize consistently;
4. watch-only, hardware, multisig, embedded, and institutional profiles retain distinct capabilities;
5. an RPC balance can update a twin without changing signing authority;
6. twin mutation cannot produce a chain broadcast;
7. policy rejection contains explicit reasons;
8. an approved proposal still requires an external signature;
9. every synchronization produces a receipt;
10. stale observations are detectable.

The continuous synthetic-user system supplies recurring operational evidence for a subset of these tests. A future release should add property-based state-transition tests and adversarial wallet-session fixtures.

## 7. Novel contribution

The contribution is not the generic idea of a digital twin. It is the application of twin semantics to wallet authority:

- identity is normalized without absorbing custody;
- observed balances become agent-readable state;
- simulated state remains non-authoritative;
- policy decisions are separated from signatures;
- execution remains external and owner controlled;
- receipts preserve the boundary over time.

This architecture creates a practical middle layer between passive portfolio dashboards and fully custodial autonomous agents.

## 8. Limitations

- Balance observations can be stale or dishonest when user attested.
- Public RPCs can fail or disagree.
- Capability metadata is declarative unless verified against the provider session.
- The current twin ledger is not a formal proof of source-chain state.
- The contracts and runtime have not been presented as externally audited.
- Safe, account-abstraction, hardware, and institutional providers require provider-specific signing adapters for complete end-to-end workflows.
- Receipt integrity is only as strong as the deployed receipt backend and release process.

## 9. Future work

Planned research directions include:

- signed observation attestations;
- block-height and finality anchoring;
- Merkle commitments over synchronized wallet state;
- capability verification against live provider sessions;
- policy proofs attached to wallet proposals;
- multi-wallet household and company namespaces;
- delayed-effect simulation and recurring obligations;
- longitudinal drift detection between source and twin;
- formal non-custody invariants;
- governed promotion adapters for Safe, smart accounts, and institutional custody.

## 10. Conclusion

Digital-twin wallets provide a useful operating boundary for AI-native financial systems. They permit agents to reason, simulate, teach, compare, and propose against realistic wallet state while keeping signing authority outside the model process. The design does not claim that AI can safely control capital by default. It makes the opposite claim operational:

> useful intelligence should be possible before authority is delegated.

**Doctrine:** AI can model the wallet. AI cannot silently control the wallet.