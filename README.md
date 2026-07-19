# MonadBuilder+ · THESIS OS

> No-code dApp builder + AI governance engine for the Monad ecosystem.
> Built for the [Spark hackathon](https://buildanything.so/hackathons/spark).

**Live:** [https://monados.medinatechlabs.net](https://monados.medinatechlabs.net)
**GitHub:** [https://github.com/ItsNotAILABS/Monad-Hackaton](https://github.com/ItsNotAILABS/Monad-Hackaton)

---

## Two Apps, One Stack

| App | What it does | Tech |
|---|---|---|
| **MonadBuilder+ Web** | Visual no-code dApp builder, deploy to Monad Testnet | Node.js · React · pnpm |
| **THESIS Engine** | AI governance engine — agents, laws, receipts, vault | Python · FastAPI · uvicorn |

They share one origin. The web app talks to the THESIS engine via `/engine/`.

---

## MonadBuilder+ (Web App)

Build a Monad dApp in minutes:
1. Describe your idea → AI builds the component layout
2. Drag-and-drop to customise in the visual builder
3. Hit **Deploy** → MetaMask signs → contract lives on Monad Testnet (Chain 10143)
4. Share the live preview URL

### Features
- **20+ templates** — AMM DEX, NFT Launchpad, DAO, Staking, Yield Aggregator, P2E, RWA, Bridge, SocialFi, Lottery, Multi-Sig, and more
- **AI builder** — GPT-powered idea → full dApp spec → component layout in seconds
- **Learn & Earn** — interactive Web3 education with testnet MON rewards
- **Gallery** — live iframe previews of every published dApp
- **GitHub sign-in** — OAuth via GitHub account
- **AI agent wallets** — 4 seeded agents (Governance, Builder, Auditor, Rewards) with Monad Testnet addresses

### Web3 Components (all pre-wired to Monad Testnet, Chain ID 10143)

| Component | Description |
|---|---|
| Wallet Connect | MetaMask/injected wallet, Chain 10143 |
| Token Balance | MON balance with live RPC |
| Token Swap | USDC ↔ MON via testnet-rpc.monad.xyz |
| NFT Gallery | Configurable grid, explorer links |
| DAO Vote | On-chain proposal + voting UI |
| Price Chart | MON/USD candlestick |
| Transaction Feed | Live activity feed |
| Merkl Rewards | Claim interface |
| Auto Wallet | Generate wallet without MetaMask |
| AI Agent Wallet | Display agent wallet balances |
| Learn Card / Quiz / Badge | Education + rewards |

---

## THESIS OS (Python Engine)

AI governance layer for on-chain organisations:

| Module | Role |
|---|---|
| **EcosystemLaw** | Immutable global rules |
| **LawBook** | Owner-tunable policies |
| **PolicyKernel** | Evaluates every proposal against laws |
| **SovereignVault** | Executes only what PolicyKernel clears |
| **ReceiptChain** | Immutable on-chain audit log |
| **16 MCP tools** | Agent ↔ chain interaction |
| **WIN PATH** | Daily governance workflow |

---

## Monad Testnet Config

| Property | Value |
|---|---|
| Chain ID | `10143` |
| RPC | `https://testnet-rpc.monad.xyz` |
| Explorer | `https://testnet.monadexplorer.com` |
| WMON | `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701` |
| USDC | `0xf817257fed379853cDe0fa4F97AB987181B1E5Ea` |
| Block time | 400ms · 10,000 TPS · 800ms finality |

---

## Running Locally

```bash
# Start everything (Python THESIS engine + Node.js API + React frontend)
bash scripts/replit_start.sh
```

Or separately:
```bash
# Python THESIS engine (port 8043)
python -m uvicorn thesis_forge.serve:app --app-dir engine --port 8043

# MonadBuilder+ dev server
pnpm --filter @workspace/monad-builder run dev
pnpm --filter @workspace/api-server run dev
```

---

## Smart Contracts

THESIS OS contracts in `contracts/src/`:

| Contract | Purpose |
|---|---|
| `PolicyKernel.sol` | Evaluates proposals against law stack |
| `SovereignVault.sol` | Executes cleared actions |
| `LawBook.sol` | Owner-tunable governance policies |
| `ReceiptChain.sol` | Immutable audit trail |
| `AgentRegistry.sol` | On-chain AI agent registry |
| `ThesisFactory.sol` | Deploy full THESIS OS suite in one tx |

```bash
# Deploy contracts
cd contracts && forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast
```

---

## Repo Structure

```
├── artifacts/          MonadBuilder+ web app + API server (pnpm workspace)
│   ├── monad-builder/  React + Vite frontend
│   ├── api-server/     Node.js Express API
│   └── monad-mobile/   Expo mobile app
├── engine/             Python THESIS OS engine (FastAPI)
├── contracts/          Solidity THESIS OS contracts (Foundry)
├── web/                THESIS engine React frontend (simple)
├── lib/                Shared TypeScript libraries
├── docs/               Architecture docs
├── receipts/           On-chain action receipts
├── scripts/            Startup + deploy scripts
└── polyglot/           Julia + Node hybrid workers
```
