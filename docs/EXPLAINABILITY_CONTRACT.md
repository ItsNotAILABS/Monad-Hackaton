# THESIS Forge explainability contract

Every build operation must emit an event that is understandable by a person and directly consumable by an agent.

## Canonical event

```json
{
  "id": "ecosystem-map",
  "name": "Map Monad integrations",
  "actor": "SENSUS",
  "status": "complete",
  "plain_language": "THESIS matched the requested capabilities to supported Monad tools and protocols.",
  "technical_detail": "Filtered the protocol atlas by typed capability categories and attached source URLs.",
  "why_it_matters": "Generated code should use real integrations rather than invented contracts or placeholder APIs.",
  "inputs": ["objective", "selected categories"],
  "outputs": ["protocol selection", "integration sources"],
  "checks": ["every integration has a source URL"],
  "evidence": ["manifest.protocols"],
  "agent_instruction": "Use only integrations present in manifest.protocols unless a new source is added and validated.",
  "next_step": "Compose the application architecture."
}
```

## Rules

1. **One canonical state.** Human and agent surfaces render the same event object.
2. **No hidden success.** `complete` is allowed only when an output or external receipt exists.
3. **Blocked is useful.** Missing keys, funds, RPCs, or permissions produce a visible `blocked` event with the exact resolution.
4. **Evidence is addressable.** Every claim points to a manifest field, generated file, test result, transaction, verification page, or deployment URL.
5. **Why before jargon.** Every technical operation includes a plain-language purpose.
6. **Agent-safe output.** Commands, schemas, paths, hashes, chain IDs, and addresses remain structured rather than buried in prose.
7. **Receipts chain together.** Each stage receipt includes the previous receipt hash.
8. **The user controls irreversible actions.** Signing and production deployment are explicit gates.

## Core stages

1. Intent normalization
2. Ecosystem mapping
3. Architecture composition
4. Policy and security boundary compilation
5. Source package generation
6. Static validation and tests
7. Wallet and network readiness
8. Contract deployment
9. Contract verification
10. Frontend deployment
11. Release receipt

## Three product surfaces

### Builder view

Plain language, visual progress, file previews, risks, and next actions.

### Agent view

NDJSON build stream, typed manifest, artifact hashes, deterministic commands, and error objects.

### Judge view

A compact proof panel showing generated source, test status, contract address, transaction hash, verification state, hosted URL, and repository URL.
