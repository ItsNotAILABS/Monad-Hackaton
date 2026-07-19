# THESIS Charter — Monad AI Workstation

**Product name:** THESIS  
**Tagline:** Agents propose. Laws decide. Humans and AIs learn by failing safely.  
**Repo:** https://github.com/ItsNotAILABS/Monad-Hackaton  
**Hackathon:** [Spark · Build Anything](https://buildanything.so/hackathons/spark) on Monad  

---

## 1. Mission

THESIS is a **production workstation** for building and operating on Monad with AI:

1. **STUDIO** — AI-assisted intent → manifest → deploy plan (Foundry / Monad networks).  
2. **CODEX** — Ecosystem atlas (protocols, explorers, RPCs) used efficiently, not hallucinated.  
3. **NOMOS** — Onchain policy kernel + vault: agents propose; laws enforce; receipts seal.  
4. **DESK** — Trading business layer: venues, tickets, desk risk, paper PnL, coupled to NOMOS.  
5. **ACADEMY** — Failure-first education for **people and AI agents** (safe reject labs).

We optimize for **practical impact**: fewer blind deploys, fewer blank-check approvals, faster correct use of the Monad ecosystem.

---

## 2. Personal problem (Spark alignment)

**Problem I have:**  
Building with AI and crypto tools is fast but dangerous. Docs and protocols are scattered. Agents invent plans that could spend capital. Tutorials only teach the happy path. I either re-check everything by hand (slow) or I don’t automate (stuck).

**Solution:**  
One product where I write laws once, generate and score plans under those laws, **see rejections as a feature**, deploy governed contracts to Monad, and complete labs that teach *why* a plan failed — for me and for any AI I attach later.

**Roommate test:**  
“This saved me from funding an agent with no brakes — and taught me slippage/exposure in ten minutes by forcing a bad plan to fail.”

---

## 3. Competitive doctrine (≈625 builders)

| Crowd | THESIS |
|-------|--------|
| Habit stamps / soft onchain | Hard **policy reject** + vault |
| Monskills template clones | Original doctrine: seatbelt + school + IDE |
| Fake success toasts | Live API + arena + receipts |
| “Leverages ZK / 11 engines” | Practical: deploy plan + laws + lessons |
| AI without custody thought | AI **under NOMOS** |

**Winning claim:**  
> Everyone teaches you to click go. THESIS teaches you and your AI **when go is illegal** — then deploys what passed.

---

## 4. Product surfaces

### 4.1 STUDIO
- Plain-language objective → typed `BuildManifest`
- Network: Monad testnet `10143` / mainnet `143`
- Generated Foundry deploy/verify commands (official docs path)
- Project receipt sealed into hash chain

### 4.2 CODEX
- Protocol atlas by category (dex, lending, vault, staking, perps, analytics, agent)
- Official RPC / explorer references
- Adapter status honesty: `planned` | `simulated` | `live`
- Never invent token addresses as live

### 4.3 NOMOS
- Policy: slippage, exposure, reserve, leverage, max action, categories, simulation flag
- Arena: multi-agent plans scored; unlawful plans **rejected with reasons**
- Contracts: `PolicyKernel`, `SovereignVault`, `ReceiptChain`, `AgentRegistry`, `ProposalBook`, `ExecutionRouter`
- Spark submission address: **SovereignVault**

### 4.4 ACADEMY
Failure-first quests:
1. Slippage trap  
2. Rogue agent / category breach  
3. Reserve & leverage discipline  
4. Receipt literacy  

Each quest: concept → bad plan → expected violations → pass condition → sealed lesson receipt.

---

## 5. Technical principles (production grade)

1. **No vaporware** — UI buttons call real API; no success-only mocks.  
2. **No secrets in repo** — keys via env / Foundry keystore only.  
3. **Honest adapter status** — simulated ≠ live mainnet capital.  
4. **Receipts for every material act** — build, arena, academy, deploy metadata.  
5. **Policy before capital** — vault `execute` requires kernel `validate`.  
6. **EVM compatibility** — Solidity 0.8.26, Foundry, Monad RPC.  
7. **Windows + WSL deploy path** — document official Monad Foundry install.  
8. **Tests gate claims** — pytest for engine; forge for kernel.  
9. **CI** — python tests + web production build.  
10. **Alpha capital rule** — not audited; no production TVL claims.

---

## 6. Architecture

```text
Browser (THESIS Cockpit)
    │  HTTPS / local
    ▼
FastAPI engine (thesis_forge)
    ├── studio   → compile_manifest + deploy_plan
    ├── codex    → atlas + network
    ├── nomos    → evaluate / arbitrate
    ├── academy  → quests + grade
    └── receipts → hash-linked seal
    │
    ▼
Monad (testnet 10143 | mainnet 143)
    PolicyKernel → SovereignVault.execute → ReceiptChain.seal
```

---

## 7. Network constants

| | Testnet | Mainnet |
|--|---------|---------|
| Chain ID | 10143 | 143 |
| RPC | https://testnet-rpc.monad.xyz | https://rpc.monad.xyz |
| Explorer | https://testnet.monadvision.com | https://monadvision.com |
| Faucet | https://testnet.monad.xyz | — |

Official deploy: https://docs.monad.xyz/guides/deploy-smart-contract/foundry  
Official verify: https://docs.monad.xyz/guides/verify-smart-contract/foundry  

---

## 8. Spark submission pack

| Field | Value |
|-------|--------|
| Name | THESIS — Monad AI Workstation |
| Category | Testnet (or Mainnet if deployed there) |
| Contract | `SovereignVault` address from `receipts/deployment.json` |
| Github | https://github.com/ItsNotAILABS/Monad-Hackaton |
| Project URL | Hosted cockpit (Vercel/etc.) |
| Demo | ≤3 min: Studio → Nomos REJECT → Academy → explorer |
| Post | Build-in-public URL |

---

## 9. Non-goals (honest scope)

- Full browser Solidity IDE with multi-file LSP (roadmap)  
- Live mainnet protocol adapters with real TVL (requires audits)  
- Custodial trading bot with user funds (out of scope)  
- Claiming 11 independent “AI engines” as separate runtimes (branding map only)

---

## 10. Success metrics

| Metric | Target |
|--------|--------|
| Engine tests | 100% pass |
| Web production build | succeeds |
| Arena | shows accept + reject with reasons |
| Academy | ≥3 quests gradable offline |
| Deploy script | wires vault constructor |
| Demo | judges understand in 3 minutes |
| Anti-vaporware | every primary button hits live path |

---

## 11. Governance of this charter

- Charter is source of product truth for Spark.  
- Code must not claim capabilities this charter marks non-goal.  
- Expand features only when tests and a real UI path exist.

**Doctrine seal:**  
*Agents propose. Laws decide. Receipts remember. Education is a failed plan that could not spend.*
