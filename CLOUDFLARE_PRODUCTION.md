# Cloudflare-First Production Architecture

**Production authority:** GitHub + Cloudflare  
**Retired host:** Replit  
**Public application:** `https://monados.medinatechlabs.net`

## Operating decision

Replit is no longer a build, deployment, secrets, database, runtime, scheduling, or agent dependency for MonadBuilder+ · THESIS. Historical Replit files may be retained only when required to recover prior implementation context; they are not supported production instructions.

GitHub is the source of truth. Cloudflare is the public execution and delivery envelope.

## Target topology

```text
GitHub
  ├─ source, reviews, actions, releases, proof artifacts
  └─ deployment workflows
       |
Cloudflare zone: medinatechlabs.net
  ├─ Workers Static Assets: React application
  ├─ Gateway Worker: /api/*, /engine/*, /rpc/*
  ├─ Edge agents: /agent/* and /v1/run
  ├─ Cron Triggers: synthetic users and health canaries
  ├─ Queues: deferred agent, report, and receipt jobs
  ├─ Durable Objects: coordinated sessions and serialized state
  ├─ KV: configuration and low-write metadata
  ├─ R2: release papers, reports, proof packets, project exports
  ├─ D1: Cloudflare-native structured state where appropriate
  ├─ Hyperdrive: existing PostgreSQL access during migration
  ├─ AI Gateway: model routing, observability, budgets, failover
  └─ Web3 gateway routes
       ├─ Monad RPC
       └─ Ethereum L1 JSON-RPC
```

## Runtime lanes

### Lane A - Cloudflare-native request path

Move stateless and edge-compatible functions here first:

- health and status;
- chain and gas reads;
- wallet identity normalization;
- watch-only wallet registration;
- policy evaluation that does not require local files;
- receipt submission;
- synthetic-user canaries;
- GitHub OAuth callbacks and session identity;
- AI request routing through AI Gateway;
- static application delivery.

### Lane B - coordinated state

Use Durable Objects, D1, KV, R2, or PostgreSQL through Hyperdrive according to access pattern:

- Durable Objects: serialized missions, live sessions, wallet twin coordinators, agent rooms;
- D1: relational Cloudflare-native metadata and indexed receipts;
- KV: configuration, feature flags, provider catalogs, public status;
- R2: papers, generated projects, reports, test packets, large receipts;
- Hyperdrive: existing PostgreSQL schema until it is intentionally migrated.

### Lane C - extended runtime

THESIS modules that require a writable filesystem, subprocesses, Foundry, Julia, Node worker threads, PDF generation, or long-running polyglot execution must not be silently forced into an incompatible Worker.

They require one of these governed paths:

1. refactor into queue-driven Cloudflare-native services;
2. move state to R2/D1/Durable Objects and remove process assumptions;
3. execute in a controlled container or external runner behind the Worker gateway;
4. remain CI/release jobs when they are build-time rather than request-time functions.

Every extended execution must return a receipt and must not expose an unrestricted shell.

## Required environment and secrets

Cloudflare production should define only the values required by deployed lanes:

```text
PUBLIC_APP_URL=https://monados.medinatechlabs.net
ORIGIN_API=<temporary origin during staged migration>
MONAD_RPC_URL=<Monad endpoint>
ETHEREUM_RPC_URL=<Ethereum L1 Web3 gateway endpoint>
GITHUB_CLIENT_ID=<OAuth app id>
GITHUB_CLIENT_SECRET=<secret>
SESSION_SECRET=<secret>
SYNTHETIC_RUN_TOKEN=<secret>
DATABASE_URL=<existing PostgreSQL URL while Hyperdrive is used>
CF_AI_GATEWAY_URL=<AI Gateway endpoint when enabled>
```

No secret belongs in Git, a client bundle, a wallet twin, an agent prompt, or a receipt payload.

## Migration gates

### Gate 1 - inventory

- identify every Replit-specific import, plugin, config, secret name, URL, database assumption, and startup command;
- classify every endpoint as Worker-native, coordinated-state, or extended-runtime;
- preserve a migration ledger in GitHub.

### Gate 2 - public shell

- build React without Replit plugins;
- deploy static assets through Cloudflare;
- preserve same-origin `/api/*` and `/engine/*` paths;
- verify OAuth callback and SPA routing.

### Gate 3 - data

- place existing PostgreSQL behind Hyperdrive or migrate selected tables to D1;
- move generated files and reports to R2;
- move runtime JSON ledgers out of local filesystem storage;
- validate backups and rollback.

### Gate 4 - THESIS services

- move pure policy, wallet identity, chain, synthetic-user, and receipt APIs to Cloudflare-compatible services;
- isolate polyglot and subprocess operations;
- require governed execution receipts.

### Gate 5 - continuous proof

- run synthetic smoke users every 30 minutes;
- run stateful full users daily;
- test application, edge, Monad, Ethereum L1, wallets, agents, laws, receipts, and failure behavior;
- archive proof packets in GitHub Actions or R2.

### Gate 6 - cutover

Replit is considered fully removed only when:

- no production DNS points to it;
- no OAuth callback references it;
- no active secret exists only there;
- no scheduled job or database depends on it;
- no supported documentation invokes it;
- synthetic users pass against Cloudflare-hosted routes;
- rollback artifacts exist.

## Ownership doctrine

The former Replit agent's work is treated as imported implementation history. GitHub contains the recoverable source. From this transition forward:

- architecture decisions are recorded in Git;
- Cloudflare deployment is reproducible;
- unsupported infrastructure is labeled retired;
- every material migration step emits evidence;
- no hosted agent is treated as the source of truth.

The system must remain operable even when a development platform, model provider, RPC provider, or individual agent disappears.