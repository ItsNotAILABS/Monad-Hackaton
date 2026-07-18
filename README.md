# Monad App Builder

> No-code drag-and-drop dApp builder for the Monad ecosystem.

**Live demo:** [deploy to get URL]

---

## What It Is

A visual workspace where anyone can assemble a Monad dApp from pre-built Web3 components — without writing a single line of code. Built for the [Spark hackathon](https://buildanything.so/hackathons/spark) by BuildAnything.

**The personal problem it solves:** Getting a dApp idea on Monad means days of setup before a single user can touch it — wallet adapters, RPC config, chain IDs, web3 plumbing. Monad App Builder collapses that to minutes.

---

## Features

### Builder
- Visual drag-and-drop canvas (3-panel: Component Library → Canvas → Inspector)
- 14 components across 3 categories: Web3, Layout, Content
- Real-time property inspector with human-friendly labels
- Move up/down reordering with delete confirmation

### Web3 Components (all pre-wired to Monad Mainnet, Chain ID 143)
| Component | Description |
|---|---|
| Wallet Connect | MetaMask/injected wallet button, Chain ID 143 |
| Token Balance | MON balance display, WMON contract address |
| Token Swap | USDC ↔ MON swap UI, live RPC endpoint |
| NFT Gallery | Configurable grid, MonadVision explorer links |
| DAO Proposal | Live voting UI with For/Against breakdown |
| Price Chart | MON/USD candlestick widget |
| Transaction Feed | Recent activity with MonadVision deep links |

### Platform
- Project CRUD with status (draft / published)
- Template gallery: DeFi Dashboard, NFT Collection, DAO Governance, Token Landing Page, Portfolio Tracker
- Live preview mode at `/preview/:id`
- Publish to shareable URL
- Dashboard with project stats

---

## Monad Network Config (baked in)

| Property | Value |
|---|---|
| Chain ID | `143` |
| Network | Monad Mainnet |
| Currency | MON |
| RPC (QuickNode) | `https://rpc.monad.xyz` |
| RPC (Alchemy) | `https://rpc1.monad.xyz` |
| RPC (Goldsky) | `https://rpc2.monad.xyz` |
| RPC (Ankr) | `https://rpc3.monad.xyz` |
| Wrapped MON | `0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A` |
| Explorer | [MonadVision](https://monadvision.com) · [Monadscan](https://monadscan.com) |
| Throughput | 10,000 TPS |
| Block time | 400ms |
| Finality | 800ms |

Source: [docs.monad.xyz](https://docs.monad.xyz)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Express 5, Drizzle ORM, PostgreSQL |
| API | OpenAPI spec, auto-generated TypeScript client |
| Monorepo | pnpm workspaces |
| Deployment | Replit autoscale |

---

## Project Structure

```
artifacts/
  monad-builder/    # React + Vite frontend
  api-server/       # Express 5 API
lib/
  db/               # Drizzle schema + migrations
  api-spec/         # OpenAPI spec
  api-client-react/ # Auto-generated React Query hooks
```

---

## Local Development

```bash
pnpm install
# Start both services
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/monad-builder run dev
```

Environment variables needed:
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — session signing secret
