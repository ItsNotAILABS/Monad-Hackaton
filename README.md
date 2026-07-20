# MonadBuilder+ · THESIS

> **Build the application. Govern the intelligence. Execute on Monad.**

MonadBuilder+ and THESIS are one integrated product stack for creating, operating, and governing applications on Monad.

- **MonadBuilder+** is the user-facing application studio: describe an idea, generate a full dApp, refine it visually, connect or create wallets, inspect live chain state, publish projects, and learn through direct interaction.
- **THESIS** is the Python governance and execution backend: agents propose actions, laws evaluate them, wallets are mirrored into safe digital twins, owners retain control, and cryptographic receipts preserve what happened.

**Live application:** https://monados.medinatechlabs.net  
**Public repository:** https://github.com/ItsNotAILABS/Monad-Hackaton  
**Network:** Monad Testnet · Chain ID `10143`

---

## One Product, Two Coordinated Platforms

| Platform | Purpose | Runtime |
|---|---|---|
| **MonadBuilder+** | AI dApp creation, visual composition, wallet onboarding, live chain utilities, publishing, gallery, education | React, Vite, Node.js, Express, PostgreSQL |
| **THESIS** | Agent governance, law enforcement, wallet linking, sandbox twins, Company OS, tools, receipts, deployment control | Python, FastAPI, Solidity, Foundry |

The public Node application exposes THESIS through the same deployment at `/engine/*`, so the frontend and backend operate as one product rather than two disconnected demos.

---

## The Problem

Building a useful blockchain application still forces people to stitch together too many systems: frontend components, Solidity, wallets, RPC configuration, gas logic, AI generation, governance, deployment scripts, security controls, and operational monitoring.

AI makes creation faster, but it also creates a second problem: an agent that can generate or propose actions should not automatically receive unrestricted access to wallets or capital.

Most tools solve only one side:

- builders create interfaces but do not govern autonomous actions;
- agent frameworks propose actions but do not give normal users a complete application studio;
- wallet tools connect accounts but do not create policy-controlled digital twins;
- tutorials teach deployment but stop before real operational governance.

---

## The Solution

MonadBuilder+ and THESIS combine creation and control in one architecture.

1. A user describes an application in plain language.
2. MonadBuilder+ expands the idea into a Monad-specific application specification.
3. AI generates a validated component layout from the supported production palette.
4. The user refines the dApp visually, connects a wallet or creates a new wallet, and inspects live Monad data.
5. THESIS evaluates agent and operator proposals against the active law stack.
6. Rejected actions return explicit reasons instead of fake success messages.
7. Approved operations remain owner-controlled and are recorded through receipts.

**Doctrine:** Agents propose. Laws decide. Owners sign. Receipts remember.

---

## MonadBuilder+ Application Studio

### AI dApp generation

MonadBuilder+ turns a short idea into a structured application rather than a static mockup.

The AI pipeline can:

- expand a rough idea into an architect-level Monad specification;
- generate a complete multi-component dApp layout;
- validate every generated component against the real component palette;
- remap known model aliases into supported components;
- reject unsupported component types instead of rendering invented UI;
- refine an existing project from follow-up instructions;
- audit a generated dApp for gas, component coverage, missing features, and THESIS integration opportunities;
- generate Monad-focused Python or JavaScript scripts.

### Visual application components

The studio supports real application surfaces including:

- wallet connection;
- token balances;
- token swaps;
- NFT galleries;
- transaction feeds;
- DAO voting;
- price charts;
- Merkl reward surfaces;
- education cards and quizzes;
- reward badges;
- generated wallets;
- AI-agent wallets;
- responsive layout and content primitives.

### Templates and publishing

The platform includes a database-backed template system covering categories such as DeFi, NFTs, governance, staking, rewards, gaming, RWA, multisig, social applications, and other Monad use cases.

Projects can be created, edited, previewed, published, and surfaced in the public gallery.

### Live Monad utilities

The Node backend reads live Monad Testnet state for:

- current block number;
- gas price;
- native MON balances;
- explorer links;
- wallet balance refreshes;
- external reward opportunity data where available.

Unavailable upstream services return explicit errors or empty states rather than fabricated market values.

---

## Wallet Infrastructure

Wallets are not a side feature. They are a core part of both platforms.

### MonadBuilder+ wallets

MonadBuilder+ supports generated wallets for:

- normal users;
- non-crypto users;
- learners;
- educators;
- AI agents.

The wallet service can:

- generate a new EVM wallet;
- return the private key and mnemonic once at creation;
- persist the wallet record;
- list wallets by role;
- retrieve public wallet records without returning secrets;
- fetch live MON balances from Monad Testnet;
- link each wallet to explorer and faucet flows;
- seed dedicated Governance, Builder, Auditor, and Rewards agent wallets;
- associate education progress with wallet addresses.

### THESIS linked wallets

THESIS has a separate, security-focused wallet registry for public wallet connections.

Supported connection types include:

- MetaMask;
- Phantom;
- WalletConnect;
- injected EVM wallets such as Rabby, Rainbow, and Coinbase Wallet;
- watch-only or manually entered addresses.

THESIS stores public connection metadata and attested balances only. It refuses private keys, seed phrases, mnemonics, and other secret material.

### Wallet twins

Linked wallet balances can be synchronized into THESIS sandbox twins.

A twin is a governed mirror of wallet state that agents can inspect and reason about without receiving authority to move the real funds. Optional RPC reads can refresh native MON balances, while every synchronization produces a receipt.

This creates a clean boundary:

> AI can model the wallet. AI cannot silently control the wallet.

---

## THESIS Governance and Runtime

THESIS is the backend operating layer behind the product.

### Law and policy stack

- **EcosystemLaw** defines non-negotiable system rules.
- **LawBook** contains owner-configurable policy.
- **PolicyKernel** evaluates every proposed action.
- **SovereignVault** gates execution behind policy approval.
- **ReceiptChain** records material actions and outcomes.
- **AgentRegistry** tracks governed agents.
- **ProposalBook** preserves proposals and decisions.
- **ExecutionRouter** connects approved intent to controlled execution paths.

### Rejection is a real result

THESIS evaluates proposals against limits such as:

- allowed action categories;
- maximum slippage;
- protocol exposure;
- minimum liquid reserve;
- leverage limits;
- maximum action value.

A rejected action returns the violated rules and human-readable reasons. It does not show a generic success toast.

### Company OS

THESIS includes a governed Company OS capable of:

- accepting an operational objective;
- creating a mission;
- coordinating departments;
- maintaining constitution and policy state;
- exposing mission status;
- allowing explicit approve, reject, and action decisions;
- recording the mission lifecycle.

### Agent and tool surfaces

THESIS exposes operational tools and engines for:

- live Monad chain inspection;
- gas guidance;
- policy evaluation;
- wallet synchronization;
- sandbox operations;
- reports;
- terminal commands;
- company missions;
- governed agent steps;
- deployment state;
- recent receipts.

These are accessible through FastAPI and through the public `/engine/*` gateway.

---

## AI System

The application includes multiple AI surfaces instead of one generic chat box.

### Builder intelligence

- prompt expansion;
- full dApp generation;
- component generation;
- project refinement;
- contract, gas, dApp, and law analysis;
- template recommendation;
- script generation;
- production-readiness audits.

### Context-aware assistant

A global assistant receives page-level context from the current application surface, allowing it to respond differently inside the builder, platform, workspace, gallery, education, and AI Studio.

### Python agents

The product also supports server-side Python agent workflows for chain queries, wallet analysis, contract inspection, and governed action planning.

### Budget and rate control

AI calls are protected by rate limiting and daily budget accounting so the production application can expose live intelligence without uncontrolled provider usage.

---

## Education and Onboarding

MonadBuilder+ is designed for people who do not already understand wallets, gas, RPCs, or smart-contract workflows.

The Learn surface includes:

- interactive education modules;
- quizzes;
- completion tracking;
- wallet-linked progress;
- reward-oriented onboarding;
- generated wallets for users who do not have MetaMask.

Education is connected to the product itself, so users learn by operating real application components rather than reading a disconnected tutorial.

---

## Gallery and Distribution

Published applications appear in the Gallery with live previews. This turns MonadBuilder+ from a private editor into a distribution surface where users can discover, open, and share projects created through the platform.

GitHub authentication provides account-level identity for project workflows.

---

## Smart-Contract System

The Solidity stack lives in `contracts/` and includes:

| Contract | Responsibility |
|---|---|
| `PolicyKernel.sol` | Evaluates actions against active policy |
| `SovereignVault.sol` | Executes only cleared actions |
| `LawBook.sol` | Stores owner-controlled governance rules |
| `ReceiptChain.sol` | Records immutable action receipts |
| `AgentRegistry.sol` | Registers governed agents |
| `ProposalBook.sol` | Stores proposals and decisions |
| `ExecutionRouter.sol` | Routes approved execution |
| `ThesisFactory.sol` | Deploys the THESIS contract suite |

The repository currently identifies Monad Testnet as the submission network. A real deployed contract address must come from an actual broadcast and must not be replaced with a token address or invented value.

---

## Architecture

```text
Browser
  |
  +-- MonadBuilder+ React application
  |     +-- AI Builder
  |     +-- Visual Studio
  |     +-- Wallets
  |     +-- Templates
  |     +-- Learn
  |     +-- Gallery
  |     +-- AI Studio
  |     +-- Platform console
  |
  +-- Node.js / Express public API
  |     +-- Projects and templates
  |     +-- AI generation and analysis
  |     +-- Wallet generation and balances
  |     +-- Live Monad chain utilities
  |     +-- GitHub authentication
  |     +-- /engine/* proxy
  |
  +-- THESIS Python / FastAPI backend
        +-- Policy and law engine
        +-- Wallet linking and twins
        +-- Sandboxes and agents
        +-- Company OS
        +-- Tools and reports
        +-- Receipts and deployment state
        |
        +-- Monad contracts
              PolicyKernel -> SovereignVault -> ReceiptChain
```

---

## Public Routes

### MonadBuilder+ API

```text
/api/health
/api/projects
/api/templates
/api/ai/chat
/api/ai/build-dapp
/api/ai/refine-dapp
/api/ai/analyze
/api/ai/audit-dapp
/api/ai/script
/api/ai/recommend-template
/api/chain/block
/api/chain/gas
/api/wallets
/api/wallets/generate
/api/wallets/:address/balance
/api/wallets/seed-agents
/api/education/progress/:address
```

### THESIS through the public gateway

```text
/engine/health
/engine/rpc/probe
/engine/wallets
/engine/wallets/supported
/engine/wallets/link
/engine/wallets/sync-twins
/engine/company
/engine/company/run
/engine/tools
/engine/engines
/engine/deployment
/engine/receipts/recent
```

---

## Running the Full Stack

```bash
bash scripts/replit_start.sh
```

The startup script:

1. installs the Python THESIS engine;
2. starts FastAPI on internal port `8043`;
3. installs the pnpm workspace;
4. runs database migrations when configured;
5. builds the Node API server;
6. starts the public application on `$PORT`.

### Separate backend start

```bash
python -m uvicorn thesis_forge.serve:app \
  --app-dir engine \
  --host 127.0.0.1 \
  --port 8043
```

---

## Repository Structure

```text
artifacts/monad-builder/   React application studio
artifacts/api-server/      Node.js public API and THESIS gateway
artifacts/monad-mobile/    Mobile application lane
engine/                    Python THESIS backend
contracts/                 Solidity and Foundry contracts
lib/                       Shared TypeScript and database packages
web/                       Dedicated THESIS web interface
polyglot/                  Julia and Node execution engines
receipts/                  Runtime receipts and deployment records
docs/                      Architecture and operator documentation
scripts/                   Build, deployment, and startup automation
```

---

## Hackathon Submission

### Description

MonadBuilder+ · THESIS is an AI-powered application creation and governance platform for Monad. Users can generate and publish complete dApps, create or connect wallets, inspect live chain state, and operate through a Python governance backend that evaluates agent actions under programmable laws and preserves cryptographic receipts.

### Problem

Blockchain application development is fragmented and technically inaccessible, while AI agents introduce new risks when they can propose or execute financial actions without policy controls, wallet boundaries, or accountable records.

### Solution

MonadBuilder+ gives users a complete visual and AI-assisted creation environment. THESIS adds the missing control plane: public-wallet linking, sandbox twins, policy evaluation, owner-controlled execution, Company OS coordination, smart-contract governance, and receipt-backed accountability.

### Project URL

https://monados.medinatechlabs.net

### GitHub Repository

https://github.com/ItsNotAILABS/Monad-Hackaton

### Category

Monad Testnet

### Contract Address

Use the verified address emitted by the actual Monad deployment transaction. The repository does not currently claim an address in `receipts/deployment.json`.

### Demo Video

Show this sequence in under three minutes:

1. generate a dApp from a plain-language idea;
2. refine it in the visual builder;
3. create or connect a wallet and read live Monad state;
4. open THESIS through the Platform surface;
5. run a governed action and show the decision or receipt;
6. publish or preview the finished application.

### Social Post

> We built MonadBuilder+ · THESIS: one platform to create, operate, and govern applications on Monad. Generate a full dApp with AI, refine it visually, create or connect wallets, read live chain state, and route agent actions through programmable laws, owner approval, sandbox twins, and cryptographic receipts. Build the application. Govern the intelligence. Execute on Monad. https://monados.medinatechlabs.net #Monad #BuildOnMonad #AI #Web3

---

## Security Boundaries

- THESIS linked-wallet storage accepts public addresses and balances only.
- THESIS rejects private keys, seed phrases, mnemonics, and secret material.
- Wallet twins cannot move real funds.
- Generated-wallet secrets are returned only during creation and are not exposed by public read endpoints.
- Agents propose; they do not receive automatic owner authority.
- Contract deployment and live capital movement remain operator-controlled.
- No production TVL, external audit, or live contract deployment is claimed without evidence.

---

## Product Identity

MonadBuilder+ is not a beginner template generator, and THESIS is not a decorative AI dashboard.

Together they form a complete Monad application operating environment:

> **Creation surface + wallets + intelligence + governance + execution boundaries + receipts.**
