# Production Boundary

The alpha is a governed application foundry and policy simulation environment. It is not audited and must not hold production capital until contracts and adapters receive independent security review.

## Hard gates

- No private keys in repository or browser bundle.
- No external protocol target unless explicitly allowlisted.
- No agent execution without owner authorization and non-expired identity.
- No transaction without simulation when policy requires it.
- Every execution emits a receipt.
- Emergency pause and owner withdrawal remain available.
- Adapter integration requires ABI provenance, fork or testnet validation, negative tests, and receipt verification.
