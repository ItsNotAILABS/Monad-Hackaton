<p align="center">
  <img src="docs/assets/thesis-icon.jpg" alt="MonadBuilder+ · THESIS" width="132" height="132" />
</p>

<h1 align="center">MonadBuilder+ · THESIS</h1>

<p align="center">
  <strong>Build the application. Govern the intelligence. Execute on Monad.</strong><br/>
  AI application creation, wallets, agents, policy, execution, and cryptographic receipts in one stack.
</p>

<p align="center">
  <a href="https://monados.medinatechlabs.net"><img src="https://img.shields.io/badge/Live-monados.medinatechlabs.net-2ee6a6?style=for-the-badge&labelColor=0a0b12" alt="Live app" /></a>
  <a href="https://github.com/ItsNotAILABS/Monad-Hackaton"><img src="https://img.shields.io/badge/GitHub-Public_Repository-ffffff?style=for-the-badge&logo=github&logoColor=white&labelColor=0a0b12" alt="GitHub" /></a>
  <img src="https://img.shields.io/badge/Network-Monad_Testnet-836EF9?style=for-the-badge&labelColor=0a0b12" alt="Monad Testnet" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Solidity-Foundry-363636?style=flat-square&logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/Chain_ID-10143-836EF9?style=flat-square" alt="Chain ID" />
</p>

<p align="center">
  <img src="docs/assets/thesis-hero.jpg" alt="MonadBuilder+ and THESIS command center" width="100%" />
</p>

## One product, two coordinated platforms

| Platform | What it delivers |
|---|---|
| **MonadBuilder+** | AI dApp generation, visual editing, templates, wallet onboarding, live Monad utilities, publishing, gallery, education, and AI Studio |
| **THESIS** | Python governance backend, agents, programmable laws, wallet twins, Company OS, controlled execution, smart contracts, and receipts |

The public Node application exposes THESIS through `/engine/*`, so the builder and governance engine operate through one hosted product.

> **Agents propose. Laws decide. Owners sign. Receipts remember.**

## The problem

Blockchain application development is fragmented across UI frameworks, Solidity, wallets, RPC configuration, deployment scripts, gas logic, governance, and monitoring. AI accelerates creation, but an AI that can propose actions should not automatically receive unrestricted access to wallets or capital.

## The solution

MonadBuilder+ creates the application. THESIS governs what the application and its agents are allowed to do.

1. Describe a dApp in plain language.
2. Generate a validated Monad-specific component layout.
3. Refine it visually and publish the project.
4. Connect or create wallets and inspect live chain state.
5. Send agent or operator proposals through THESIS.
6. Reject unlawful actions with explicit reasons.
7. Preserve material actions through receipts and owner-controlled execution.

## Product capabilities

### AI application studio

- full dApp generation from a natural-language idea;
- prompt expansion into a Monad-specific architecture brief;
- visual component editing and project refinement;
- component validation instead of invented UI types;
- contract, gas, dApp, and governance analysis;
- production-readiness audits;
- Python and JavaScript script generation;
- context-aware assistant across the application.

### Real application surfaces

- wallet connect and token balances;
- token swaps and transaction feeds;
- NFT galleries and DAO voting;
- price charts and reward surfaces;
- responsive layout primitives;
- database-backed templates;
- project previews, publishing, and Gallery distribution;
- GitHub authentication;
- interactive Learn modules, quizzes, badges, and wallet-linked progress.

## Wallet infrastructure

Wallets are a core product layer, not a side feature.

### MonadBuilder+ wallets

The Node platform can generate wallets for users, learners, educators, and AI agents. It supports live MON balance reads, public wallet records, explorer and faucet links, and dedicated Governance, Builder, Auditor, and Rewards agent wallets.

### THESIS wallet connections

THESIS supports public connection metadata for MetaMask, Phantom, WalletConnect, injected EVM wallets, and watch-only addresses. It refuses private keys, seeds, and mnemonics. Connected balances can be synchronized into governed sandbox twins so agents can reason about wallet state without authority to move real funds.

> **AI can model the wallet. AI cannot silently control the wallet.**

## THESIS governance runtime

| Module | Responsibility |
|---|---|
| **EcosystemLaw** | Non-negotiable system rules |
| **LawBook** | Owner-configurable policy |
| **PolicyKernel** | Evaluates every proposed action |
| **SovereignVault** | Gates execution behind policy approval |
| **ReceiptChain** | Records material actions and outcomes |
| **AgentRegistry** | Tracks governed agents |
| **ProposalBook** | Preserves proposals and decisions |
| **ExecutionRouter** | Routes approved execution |
| **Company OS** | Coordinates missions, departments, approvals, and operational state |

THESIS evaluates slippage, exposure, reserves, leverage, action value, and allowed categories. A rejected action returns the violated rules and human-readable reasons rather than a fake success toast.

## Live Monad connectivity

The stack uses Monad Testnet, Chain ID `10143`, and exposes live block, gas, native MON balance, wallet refresh, RPC health, explorer, deployment-state, and receipt operations. Unavailable upstream services fail honestly instead of returning fabricated market values.

## Smart-contract system

`PolicyKernel.sol` · `SovereignVault.sol` · `LawBook.sol` · `ReceiptChain.sol` · `AgentRegistry.sol` · `ProposalBook.sol` · `ExecutionRouter.sol` · `ThesisFactory.sol`

A submission contract address must come from a real Monad deployment transaction. This repository does not substitute token addresses or invented values.

## Architecture

<p align="center">
  <img src="docs/assets/thesis-architecture.jpg" alt="MonadBuilder+ and THESIS architecture" width="100%" />
</p>

```text
Browser
  └─ MonadBuilder+ React Studio
       ├─ AI Builder, Templates, Gallery, Learn, Wallets
       └─ Node.js / Express API
            ├─ Projects, AI, chain data, generated wallets
            └─ /engine/* gateway
                 └─ THESIS FastAPI
                      ├─ laws, agents, wallet twins, Company OS
                      ├─ receipts, reports, tools, deployment state
                      └─ Monad contracts
```

## Run the complete stack

```bash
bash scripts/replit_start.sh
```

The script starts THESIS internally on port `8043`, builds the pnpm workspace, runs database setup when configured, and launches the public Node application on `$PORT`.

## Repository map

```text
artifacts/monad-builder/   React application studio
artifacts/api-server/      Node API and THESIS gateway
artifacts/monad-mobile/    Mobile product lane
engine/                    Python THESIS backend
contracts/                 Solidity and Foundry contracts
lib/                       Shared TypeScript and database packages
web/                       Dedicated THESIS interface
polyglot/                  Julia and Node execution engines
receipts/                  Runtime receipts and deployment records
docs/                      Architecture and product documentation
scripts/                   Startup, validation, and deployment automation
```

## Hackathon submission

**Description**  
MonadBuilder+ · THESIS is an AI-powered application creation and governance platform for Monad. Users generate and publish dApps, create or connect wallets, inspect live chain state, and operate through a Python backend that evaluates agent actions under programmable laws and preserves receipts.

**Problem**  
Blockchain creation is fragmented and inaccessible, while AI agents introduce risk when actions lack policy controls, wallet boundaries, and accountable records.

**Solution**  
MonadBuilder+ provides the visual AI creation environment. THESIS supplies the control plane: wallet twins, programmable law, explicit rejection, owner-controlled execution, Company OS coordination, contracts, and receipt-backed accountability.

**Project URL:** https://monados.medinatechlabs.net  
**GitHub:** https://github.com/ItsNotAILABS/Monad-Hackaton  
**Category:** Monad Testnet  
**Contract address:** use the verified address from the actual deployment transaction.

## Social post

> We built **MonadBuilder+ · THESIS**: one platform to create, operate, and govern applications on Monad. Generate a complete dApp with AI, refine it visually, create or connect wallets, inspect live chain state, and route agent actions through programmable laws, owner control, and cryptographic receipts.  
>  
> **Agents propose. Laws decide. Owners sign. Receipts remember.**  
>  
> https://monados.medinatechlabs.net  
> https://github.com/ItsNotAILABS/Monad-Hackaton  
>  
> #Monad #BuildOnMonad #AI #Web3 #SparkHackathon

---

<p align="center">
  <strong>MonadBuilder+ creates the application. THESIS makes autonomous operation governable.</strong>
</p>
