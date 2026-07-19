# Production Boundary

The alpha is a governed application foundry, policy simulation environment, and educational workstation. It is **not audited** and must not hold production capital until contracts and adapters receive independent security review.

See [CHARTER.md](CHARTER.md) for product truth and non-goals.

## Hard gates

- No private keys in repository or browser bundle.
- **Sandbox-first AI:** the AI node never receives seed phrases, Phantom private keys, or exportable secrets.
- **Digital twins only:** AI secure wallet holds sandbox mirrors of user assets; mutations stay inside sandbox technology.
- Wallet link API accepts **public address + attested balances** only (rejects private_key/seed/mnemonic fields).
- Twin sync may RPC-read public balances; it never signs.
- Promote-to-chain is an explicit user-signature intent — never auto-broadcast from the AI process.
- Sandbox kill switch freezes all twin mutations.
- No external protocol target unless explicitly allowlisted on-chain.
- No agent execution without owner authorization (PolicyKernel agent allowlist).
- No transaction without simulation when policy requires it (off-chain arena + on-chain validate).
- Every material act emits a receipt (off-chain hash chain; on-chain ReceiptChain on execute).
- Emergency pause (policy.paused) and owner withdrawal remain available.
- Adapter integration requires ABI provenance, fork or testnet validation, negative tests, and receipt verification.
- UI must call live API paths — no success-only mocks for forge / arena / academy.
- Adapter status `simulated` or `planned` is not a live capital integration claim.

## Spark honesty

- Primary submission contract: **SovereignVault**.
- Prefer Monad **testnet** until mainnet deploy + verify complete.
- Academy certificates prove lab completion, not financial advice.
