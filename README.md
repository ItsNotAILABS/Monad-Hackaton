# MonadBuilder+ · THESIS Agent Desktop

**Two surfaces. One sovereign architecture.**

MonadBuilder+ is the public web and ecosystem surface. THESIS Agent Desktop is the sovereign local execution and control surface. The repository contains both products and their shared internal technology.

> **Agents propose. Policy evaluates. Owners approve. Wallets sign. Receipts remember.**

## Canonical product architecture

```text
MONADBUILDER+ WEB
Creation · applications · crypto · markets · research · publishing
                       |
             authenticated federation
                       |
THESIS AGENT DESKTOP
Local intelligence · MCP · approvals · tools · receipts · execution
```

There is no third public application.

| Product | Public role |
|---|---|
| **MonadBuilder+** | Browser-based creation, ecosystem, crypto, research, publishing, deployment, and proof exploration |
| **THESIS Agent Desktop** | Local control plane for MCP Spine lifecycle, capabilities, approvals, execution, receipts, adapters, namespaces, federation, and releases |

`artifacts/monad-mobile` is a legacy Replit-oriented companion prototype. NOVA remains an internal runtime and optional paired-device capability within the THESIS operating system.

## MonadBuilder+

MonadBuilder+ is designed to contain:

- AI application generation and visual editing;
- templates, Gallery, Learn, and AI Studio;
- wallet linking, normalized wallet identity, wallet twins, and Agent Cards;
- agent credentials and ReceiptChain proof;
- smart-contract creation, analysis, verification, deployment, and transaction decoding;
- Monad-first tooling with EVM interoperability;
- MCP Server Bridge status and discovery;
- Scientific Experiment Lab workflows;
- PARRALAX market intelligence, strategy research, gas analysis, DEX and liquidity analysis, treasury simulation, and governed execution planning;
- GitHub import, publishing, release automation, and deployment controls;
- receipts, manifests, and proof exploration.

## THESIS Agent Desktop

The desktop source is now named **THESIS Agent Desktop**. It is designed as the sovereign operator surface for:

- starting, stopping, and inspecting the local MCP Spine;
- discovering local servers and governed tools;
- capability permissions and confirmation queues;
- approval or denial of sensitive actions;
- NOVA paired-device management;
- local and cloud model routing;
- Scientific Lab execution and MESIE validation;
- NEXUS packaging and proof generation;
- PARRALAX market tools and blockchain adapters;
- GitHub and Cloudflare controls;
- receipt verification, bridge logs, namespaces, offline operation, updates, and releases.

The renderer is sandboxed, context-isolated, and does not store wallet private keys.

## Shared internal technology

The following are platform internals rather than additional public products:

`MCP Spine` · `Triple-MCP` · `NOVA Runtime` · `NEXUS` · `Loom Cluster` · `MESIE` · `Virtual Processor` · `PARRALAX` · `LiveVault` · `Scientific Experiment Lab` · `Medina Protocol` · blockchain adapters · Cloudflare federation · GitHub release automation

The machine-readable boundary is recorded in `docs/platform-integration-manifest.json`.

## MCP Spine

The governed local bridge is under `artifacts/mcp-bridge`.

```bash
cd artifacts/mcp-bridge
npm run typecheck
npm test
npm run proof
node src/index.mjs
```

Default local endpoint: `http://127.0.0.1:8080`

Core routes:

```text
GET  /health
GET  /v1/tools
POST /v1/call
GET  /v1/approvals
POST /v1/approvals/{id}
GET  /v1/receipts
```

Read and proposal capabilities remain bounded by policy. Sensitive capabilities enter an owner approval queue. Unsafe command patterns are denied and receipted. Wallet signing remains external and owner-controlled.

## Desktop development

```bash
cd desktop
npm install --no-audit --no-fund
npm run typecheck
npm run smoke
npm run dev
```

Cross-platform packaging is configured for Windows, macOS, and Linux. Source packaging configuration is not the same as a signed or notarized production release.

## Existing repository systems

```text
artifacts/monad-builder/   MonadBuilder+ React application
artifacts/api-server/      Node API and service gateway
artifacts/mcp-bridge/      Governed MCP Spine
artifacts/monad-mobile/    Legacy NOVA companion prototype
engine/                    THESIS Python runtime and CLI
 desktop/                   THESIS Agent Desktop
contracts/                 Solidity and Foundry contracts
edge/                      Cloudflare gateway source
lib/                       Shared TypeScript and database packages
polyglot/                  Shared execution engines
receipts/                  Runtime and deployment evidence
docs/                      Architecture and release documentation
.github/workflows/         Validation, packaging, and release gates
```

## Crypto and trading boundary

The platform may provide contract tooling, wallet identity, transaction decoding, market adapters, gas and liquidity analysis, portfolio and treasury simulation, risk scoring, routing analysis, strategy research, and governed execution plans.

PARRALAX must not silently receive unrestricted wallet or trading authority. Agents may propose actions; policy evaluates them; owners approve; wallets sign; receipts preserve the result.

## Current source status

Implemented in this repository or this consolidation branch:

- MonadBuilder+ web source, THESIS backend, contracts, receipts, and release workflows;
- merged desktop alpha from PR #11, now being consolidated under the THESIS Agent Desktop name;
- MCP Spine package, local HTTP control surface, tool registry, policy boundary, approval queue, receipt chain, source gate, and client configuration example;
- THESIS desktop MCP lifecycle and approval controls;
- canonical two-product manifest and legacy companion classification.

Not claimed as complete by this README:

- production DNS configuration;
- externally verified Cloudflare authenticated federation;
- live synthetic monitoring;
- production blockchain adapter coverage;
- unrestricted or autonomous trading execution;
- signed Windows installers;
- notarized macOS installers;
- external security audit or third-party certification.

## Fixed production order

1. Complete and validate the shared MCP Spine.
2. Consolidate the README and THESIS Agent Desktop naming.
3. Wire MonadBuilder+ to MCP, Scientific Lab, crypto, PARRALAX, and GitHub.
4. Wire THESIS Agent Desktop to lifecycle, approvals, adapters, and receipts.
5. Deploy the authenticated Cloudflare federation gateway.
6. Configure production DNS and synthetic monitoring.
7. Produce signed Windows and notarized macOS installers.
8. Publish one coordinated release presenting both applications as one platform.

## Repository identity

The historical URL `ItsNotAILABS/Monad-Hackaton` currently resolves to this repository. The active repository is handled as one codebase and one release line.

No fragmented product story. No third public app. **MonadBuilder+ and THESIS Agent Desktop are the two surfaces of one sovereign system.**
