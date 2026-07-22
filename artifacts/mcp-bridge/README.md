# MCP Spine

MCP Spine is the governed, local-first federation boundary shared by MonadBuilder+ and THESIS Agent Desktop. It provides one discoverable tool registry, policy evaluation, owner approval queues, and hash-linked receipts.

It is internal platform technology, not a third public application.

## Run locally

```bash
cd artifacts/mcp-bridge
node src/index.mjs
```

Default endpoint: `http://127.0.0.1:8080`

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/v1/tools
```

## Validate

```bash
npm run typecheck
npm test
npm run proof
```

The proof command writes `receipts/mcp-spine-production-proof.json`. This is a local source-validation receipt, not an external security audit or deployment attestation.

## HTTP surface

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Local lifecycle and registry status |
| GET | `/v1/tools` | Governed tool catalog |
| POST | `/v1/call` | Submit a tool request |
| GET | `/v1/approvals` | Read pending sensitive actions |
| POST | `/v1/approvals/{id}` | Owner approval or denial |
| GET | `/v1/receipts` | Read hash-linked execution and denial receipts |

## Authority boundary

- Read capabilities can execute under policy.
- Proposal capabilities produce plans or artifacts but do not silently execute external actions.
- Sensitive capabilities enter the approval queue unless an owner approval token is present.
- Unsafe command patterns are denied and receipted.
- Wallet signing remains outside MCP Spine.

> Agents propose. Policy evaluates. Owners approve. Wallets sign. Receipts remember.
