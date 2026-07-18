# Spark Hackathon Submission — MonadBuilder+

---

## Project Name
**MonadBuilder+**

## Hackathon Category
**Best Developer Tooling / Infrastructure**

## One-liner
A no-code drag-and-drop builder for shipping Monad dApps in minutes — not days.

---

## The Personal Problem

Every time I get a dApp idea on Monad, I lose the whole weekend before a single user can touch it.

Not to the idea itself. To the setup. Install Vite. Wire up viem. Figure out wagmi config. Debug the wallet adapter. Paste in the RPC URL. Get the chain ID right (it's 143, I looked it up again). Then — *finally* — write the actual product.

By the time I'm done with plumbing, the momentum is gone.

I'm not alone. Monad's design is built for 10,000 TPS and 400ms blocks. The bottleneck isn't the chain. It's the tooling gap between "I have an idea" and "people can use it."

**MonadBuilder+ closes that gap.**

---

## What It Does

A visual, drag-and-drop workspace where you assemble a Monad dApp from pre-built components — no code required. Describe your idea in one sentence, and the AI builds the entire dApp layout for you — then refine it, drag things around, and preview the live result.

**Builder components (all pre-wired to Monad Mainnet, Chain ID 143):**
- 🔌 Wallet Connect — MetaMask/injected, correct chain ID baked in
- 💰 Token Balance — MON balance display with WMON contract (`0x3bd359...`)
- 🔁 Token Swap — USDC ↔ MON swap UI, real RPC endpoint (`rpc.monad.xyz`)
- 🖼️ NFT Gallery — Configurable grid, links to MonadVision explorer
- 🗳️ DAO Proposal — Live voting UI with For/Against breakdown
- 📈 Price Chart — MON/USD chart widget
- 📋 Transaction Feed — Recent activity with MonadVision deep links

**AI features:**
- **Instant dApp generation** — describe your idea, get a full 5-6 component layout in seconds
- **AI component prompt** — add individual components from natural language inside the builder
- **AI audit** — get a scored code review of your dApp against Monad best practices and THESIS OS governance rules
- **Script writer** — generate Python/JS scripts that interact with Monad's RPC
- **AI assistant** — floating chat widget with Monad + THESIS OS context on every page
- **THESIS OS integration** — governance modules (EcosystemLaw, PolicyKernel, ReceiptChain) accessible from the builder

**The workflow:**
1. Pick a template (DeFi Dashboard, NFT Collection, DAO Governance, Token Landing Page, Portfolio Tracker) **or** describe your idea and let AI generate it
2. Drag components onto the canvas, reorder freely
3. Tweak properties in the inspector panel (token name, title, columns, etc.)
4. Preview the live dApp in full-screen
5. Publish — get a shareable URL instantly

No wallet SDK wrangling. No chain ID lookups. No RPC config. It's already Monad.

---

## The Onchain Component

Every component the builder produces is a Monad Mainnet Web3 primitive:
- Wallet connection targets **Chain ID 143** with real public RPCs (QuickNode, Alchemy, Goldsky, Ankr)
- Token operations reference the real **Wrapped MON contract** (`0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A`)
- Transaction feeds link directly to **MonadVision** and **Monadscan** block explorers
- The builder itself surfaces real Monad network stats — 10,000 TPS, 400ms block time, 800ms finality — so builders understand what they're deploying onto

---

## Why It Works for Spark

> *"Practical impact beats fancy tech. 'This saved my roommate 20 minutes' is a great submission."*

This saved me **a full weekend** the first time I needed a dApp frontend. For everyone who has an idea but not three days to spare on tooling, it saves the same.

There are 600+ people registered for this hackathon. Most of them had ideas they couldn't ship fast enough. This is the tool that changes that ratio.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Framer Motion, shadcn/ui |
| Backend | Express 5, Drizzle ORM, PostgreSQL |
| AI | OpenAI via Replit AI Integrations proxy (model tiering: luna for chat/generation, terra for analysis/audit) |
| API | OpenAPI spec, auto-generated TypeScript client |
| Monorepo | pnpm workspaces |
| Network | Monad Mainnet (Chain ID 143) |
| Explorers | MonadVision, Monadscan |

---

## Demo

**Live app:** _(deploy via Replit Publish to get the `.replit.app` URL — update this line after publishing)_

**What to try:**
1. Open the builder — pick the "DeFi Dashboard" template **or** type your idea and hit "Build with AI"
2. Drag a Token Swap component onto the canvas
3. Hit Preview — see a fully styled Monad dApp, correctly networked
4. Click "AI Audit" — get a scored assessment of your dApp's production readiness
5. Open the AI Assistant (✨ bottom-right) — ask anything about Monad or THESIS OS

---

## What's Next (post-hackathon)

- Actual on-chain publishing — deploy component configs to Monad as calldata so the dApp is fully decentralized
- Live wallet connection in preview mode using window.ethereum
- Community component marketplace — submit custom components, earn MON
- One-click Monad Mainnet contract interaction wiring

---

*Built for the Monad ecosystem. Powered by MonadBFT, RaptorCast, and the belief that 10,000 TPS deserves tools fast enough to keep up.*
