# MonadBuilder+

## Hackathon Submission — Spark by BuildAnything

---

### Description
MonadBuilder+ is a no-code AI-powered dApp builder for Monad — anyone can describe an idea, watch AI build it in seconds, and deploy a real smart contract on Monad Testnet without writing a single line of code.

---

### Problem
Building on Monad requires deep technical knowledge: Solidity, wallet adapters, RPC config, gas estimation, chain IDs, and web3 plumbing. Non-developers and non-crypto users are completely locked out. Even experienced developers spend days on setup before a user can touch their dApp.

---

### Solution
MonadBuilder+ collapses the entire build-and-deploy cycle to minutes:

1. **Describe** your dApp idea in plain English
2. **AI builds** a full component layout instantly (GPT-powered, Monad-specialist prompt)
3. **Customise** with drag-and-drop in the visual builder
4. **Deploy** — MetaMask signs one transaction, your smart contract lives on Monad Testnet (Chain 10143)
5. **Share** — a live preview URL is generated immediately

**For non-crypto users:** Auto-generated burner wallets (no MetaMask needed), Learn & Earn modules that teach Web3 basics and reward testnet MON, and 20+ production-ready templates.

**THESIS OS** — an AI governance layer runs alongside: agents propose on-chain actions, PolicyKernel evaluates them against laws, SovereignVault executes only what clears. Full governance stack, zero trusted intermediaries.

---

### Project URL
**https://monados.medinatechlabs.net**

---

### Github Repo
**https://github.com/ItsNotAILABS/Monad-Hackaton**

---

### Category
**Testnet** — Monad Testnet, Chain ID 10143

---

### Contract Address
> ⚠️ Deploy your contract then paste the address here.
>
> Run in the builder: open any project → click **Deploy** → MetaMask signs → copy the address from the success screen.
>
> Or deploy the THESIS OS suite:
> ```bash
> cd contracts
> forge script script/Deploy.s.sol \
>   --rpc-url https://testnet-rpc.monad.xyz \
>   --private-key $DEPLOYER_PRIVATE_KEY \
>   --broadcast
> ```
> Deployer wallet funded: `0x141530Bd29F2F886Af65b2CF8907F150e44e6cC8`

**Contract address:** `[PASTE HERE AFTER DEPLOY]`

---

### Demo Video
> Record a 3-minute screen recording showing:
> 1. Type an idea → AI builds the dApp (30s)
> 2. Visual builder customisation (30s)
> 3. Deploy → MetaMask → contract on Monad explorer (60s)
> 4. Share live preview URL (15s)
> 5. Learn & Earn module (15s)
> 6. Gallery of live published apps (15s)

**Video URL:** `[PASTE YOUTUBE/LOOM URL HERE]`

---

### Post URL
> Post on X/Twitter:
>
> "Just built and deployed a full Monad dApp in 90 seconds with no code using MonadBuilder+ 🚀
> Describe it → AI builds it → MetaMask deploys it → live on Monad Testnet
> Try it: https://monados.medinatechlabs.net
> #Monad #MonadBuilder #Spark #BuildAnything"

**Post URL:** `[PASTE X/TWITTER URL HERE]`

---

## What We Built

| Feature | Details |
|---|---|
| AI dApp builder | GPT with Monad-specialist prompt — 10k TPS, gas model, parallel EVM, all testnet addresses |
| 20+ templates | AMM DEX, NFT Launchpad, Staking, Yield, DAO, P2E, RWA, Bridge, Lottery, Multi-Sig, and more |
| Learn & Earn | 4 interactive Web3 modules, quizzes, testnet MON rewards — no MetaMask needed |
| Auto wallets | Burner wallet generation for non-crypto users |
| AI agent wallets | 4 live agents on Monad Testnet (Governance, Builder, Auditor, Rewards) |
| THESIS OS | PolicyKernel + SovereignVault + ReceiptChain — full on-chain governance engine |
| Gallery | Live iframe previews of every published dApp at monados.medinatechlabs.net |
| GitHub sign-in | OAuth in the app |
| Python engine | Async web3.py agent runtime for server-side chain interactions |
| Smart contracts | Solidity suite: PolicyKernel, SovereignVault, LawBook, ReceiptChain, AgentRegistry |

## Monad Testnet Config

| | |
|---|---|
| Chain ID | `10143` |
| RPC | `https://testnet-rpc.monad.xyz` |
| Explorer | `https://testnet.monadexplorer.com` |
| WMON | `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701` |
| Performance | 10,000 TPS · 400ms blocks · 800ms finality |

## Repo Structure

```
├── artifacts/monad-builder/   React + Vite frontend
├── artifacts/api-server/      Node.js Express API
├── artifacts/monad-mobile/    Expo mobile app
├── engine/                    Python THESIS OS engine (FastAPI)
├── contracts/                 Solidity THESIS OS contracts (Foundry)
├── web/                       THESIS engine React UI
├── lib/                       Shared TypeScript libraries
├── docs/                      Architecture docs
├── receipts/                  On-chain receipts
└── scripts/replit_start.sh    Starts both apps together
```
