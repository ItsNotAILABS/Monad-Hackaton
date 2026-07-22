# MCP Spine Product and Integration Plan

## Canonical decision

MCP Spine is shared internal technology for exactly two public products:

1. **MonadBuilder+** — the web/browser creation, ecosystem, crypto, research, publishing, and deployment surface.
2. **THESIS Agent Desktop** — the sovereign local intelligence, approvals, tools, receipts, and execution control plane.

MCP Spine is not a third application. NOVA is not a third application. The React Native directory is a legacy companion prototype.

## Purpose

MCP Spine connects standards-compatible clients and governed adapters to the Scientific Experiment Lab, MonadBuilder+, THESIS Agent Desktop, NOVA Runtime, MESIE, NEXUS, Loom Cluster, PARRALAX, blockchain adapters, GitHub controls, and Cloudflare federation.

The default `http://127.0.0.1:8080` endpoint is local-first. A healthy endpoint proves only that the local service and registry are reachable. Every meaningful action requires a separate policy decision, outcome, and receipt.

## Governed flow

```text
concept or mission
  -> application / contract / experiment / market question
  -> capability discovery through MCP Spine
  -> policy evaluation
  -> plan or action proposal
  -> owner approval when sensitive
  -> wallet or external authority signs when required
  -> governed execution
  -> hash-linked receipt
```

## Current source surface

```text
GET  /health
GET  /v1/tools
POST /v1/call
GET  /v1/approvals
POST /v1/approvals/{id}
GET  /v1/receipts
```

The source includes a registry, risk classes, an approval queue, unsafe-command denial, receipt chaining, a Scientific Lab adapter, a client configuration example, and a production-gate workflow.

## Product integration

### MonadBuilder+

- bridge status and capability discovery;
- Scientific Lab and research calls;
- contract, chain, PARRALAX, GitHub, and deployment adapters;
- proof and receipt explorer;
- no local process control from an unauthenticated public browser.

### THESIS Agent Desktop

- start, stop, and inspect the local Spine;
- local server discovery;
- tool catalog and permissions;
- confirmation queue and denial controls;
- receipts and bridge logs;
- optional NOVA paired-device controls;
- offline and local model adapters;
- GitHub, Cloudflare, blockchain, and PARRALAX operator adapters.

## Authority law

> **Agents propose. Policy evaluates. Owners approve. Wallets sign. Receipts remember.**

MCP Spine does not silently receive wallet keys, unrestricted trading authority, unrestricted shell authority, or the right to bypass the owner confirmation boundary.

## Remaining production gates

- authenticated remote federation rather than public unauthenticated control;
- durable approval and receipt storage;
- role-based access and device identity;
- adapter-specific schemas and policy profiles;
- signed command envelopes;
- sandbox lifecycle and quotas;
- recovery and revocation workflows;
- live synthetic monitoring;
- external security review before high-value execution.
