# 20 use cases — what they asked for

Mapped to **Spark · Build Anything** (“onchain that solves a personal problem”), Monad best practices, and the product asks from this build: **platform**, **laws teach-as-you-use**, **wallets/vault**, **local AI**, **cloud engines**, **polyglot intelligence**, **usable web app**.

Each use case: **who · pain · what you do in the app · surfaces · laws/engines**.

---

## 1. Morning seatbelt (personal problem)

**Who:** Solo operator drowning in DeFi tabs.  
**Pain:** 20 minutes re-checking bots, gas, and balances every morning.  
**In app:** **▶ RUN SYSTEM** → read SYSTEM result (desk rejects, company status, gas).  
**Surfaces:** PLATFORM · DAILY · CLOUD  
**Engines/laws:** `/system/run` · `intel.teach-on-action` · gas coach  

---

## 2. Fat gas limit avoided (Monad-specific)

**Who:** Anyone sending txs on Monad.  
**Pain:** Paying `gas_limit × price`, not gas used — 2× buffers burn MON.  
**In app:** CLOUD → **gas** engine · POLYGLOT → Julia **gas** · LOCAL AI teach gas lesson.  
**Surfaces:** CLOUD · POLYGLOT · LOCAL AI (Teach)  
**Engines/laws:** `gas` engine · Julia `gas_optimize` · `monad.gas-bills-limit` · native 21k  

---

## 3. Celebrate a REJECT (agents need brakes)

**Who:** User who almost funded a reckless agent plan.  
**Pain:** Soft UIs “succeed” on bad leverage / perps.  
**In app:** **Arena** or RUN SYSTEM → DESK shows rejects with reasons.  
**Surfaces:** DESK · PLATFORM · NOMOS  
**Engines/laws:** desk arena · `sys.nomos-veto` · `intel.explain-rejects`  

---

## 4. SovereignVault simulation before signing

**Who:** Owner about to route a ticket onchain.  
**Pain:** Silent broadcast / blank-check execute.  
**In app:** DESK → accept ticket → **Vault route sim** (or RUN SYSTEM vault step).  
**Surfaces:** DESK · CODEX (deployment)  
**Engines/laws:** `simulate_vault_route` · `exec.no-silent-broadcast` · Solidity `SovereignVault`  

---

## 5. Link wallet without leaking keys

**Who:** Phantom / MetaMask user.  
**Pain:** Dapps or AI that want seeds.  
**In app:** **Link wallet** (use bar) → AI NODE sync twins — public address only.  
**Surfaces:** AI · sticky bar  
**Engines/laws:** `/wallets/link` · `sys.no-real-keys` · `sys.sandbox-first`  

---

## 6. AI sandbox twins (not live capital)

**Who:** User who wants AI help without custody risk.  
**Pain:** AI with real keys.  
**In app:** AI NODE chat “gas tip and balances” · twins only · promote needs you.  
**Surfaces:** AI  
**Engines/laws:** AI node · sandbox · `sys.sandbox-first`  

---

## 7. Staff the miniature DeFi company

**Who:** One person acting as a whole desk.  
**Pain:** Research, risk, execution, teaching scattered.  
**In app:** **Staff company** → HQ mission room → approve/reject.  
**Surfaces:** HQ · PLATFORM  
**Engines/laws:** `/company/run` · dual law stacks · departments  

---

## 8. Constitution as personal financial law

**Who:** Owner with “30% liquid, no leverage” rules.  
**Pain:** Apps ignore personal risk limits.  
**In app:** HQ constitution · RUN SYSTEM company mission respects laws.  
**Surfaces:** HQ  
**Engines/laws:** constitution + ecosystem laws  

---

## 9. Teach-as-you-operate (not a slide deck)

**Who:** Learner who only remembers lessons mid-action.  
**Pain:** Abstract tutorials.  
**In app:** LOCAL AI → **Teach & Security** lessons + quizzes; PLATFORM law chips.  
**Surfaces:** LOCAL AI · PLATFORM live stream  
**Engines/laws:** `intel.teach-on-action` · teach curriculum  

---

## 10. Security gate on pasted secrets

**Who:** Tired operator pasting into chat.  
**Pain:** Accidental seed/key paste.  
**In app:** LOCAL AI remember/research · CLOUD security engine — critical patterns block.  
**Surfaces:** LOCAL AI · CLOUD  
**Engines/laws:** security scan · `sys.no-real-keys`  

---

## 11. Cloud research brief (hosted web app)

**Who:** Operator on the hosted product (not a toy HTML file).  
**Pain:** Manual RPC + docs hunting.  
**In app:** CLOUD → **research** or full pipeline · query “gas and vault”.  
**Surfaces:** CLOUD  
**Engines/laws:** research engine · chain pulse · desk marks  

---

## 12. Live Monad chain pulse

**Who:** Builder verifying testnet connectivity.  
**Pain:** Wrong chain / dead RPC.  
**In app:** CLOUD → **chain** engine · see block, chainId match, gasPrice.  
**Surfaces:** CLOUD · CODEX RPC probe  
**Engines/laws:** chain engine · network docs  

---

## 13. Julia Monte Carlo risk on desk equity

**Who:** Quant-minded owner.  
**Pain:** No risk numbers before sizing.  
**In app:** POLYGLOT → **monte_carlo** / **Run polyglot mesh**.  
**Surfaces:** POLYGLOT · RUN SYSTEM polyglot step  
**Engines/laws:** Julia `monte_carlo` · desk equity input  

---

## 14. Julia spectral / phi features on marks

**Who:** Trader watching MON/USDC path.  
**Pain:** Flat price without structure.  
**In app:** POLYGLOT → **spectral**.  
**Surfaces:** POLYGLOT  
**Engines/laws:** Julia spectral · marks series  

---

## 15. Node agent ranking (lawful wins)

**Who:** Multi-agent strategy user.  
**Pain:** Highest return agent is unlawful.  
**In app:** POLYGLOT → Node **agent-rank** · mesh winner often `mm` not `degen`.  
**Surfaces:** POLYGLOT · DESK agents  
**Engines/laws:** Node agent-rank · Julia agent_score · NOMOS  

---

## 16. Browser WebGPU + WASM local compute

**Who:** User offline or privacy-first.  
**Pain:** All intel requires cloud GPU.  
**In app:** POLYGLOT probes WebGPU adapter + WASM `add` · LOCAL AI Transformers.js embeddings.  
**Surfaces:** POLYGLOT · LOCAL AI  
**Engines/laws:** browser WebGPU/WASM · MiniLM  

---

## 17. Custom / offline Transformers.js models

**Who:** Team that cannot hit Hugging Face Hub in prod.  
**Pain:** Remote model downloads.  
**In app:** LOCAL AI → Models → Offline preset · `/models/` · `/wasm/`.  
**Surfaces:** LOCAL AI  
**Engines/laws:** `env.localModelPath` · `allowRemoteModels`  

---

## 18. PDF / Excel audit pack for ops or judges

**Who:** Operator or Spark judge needing proof.  
**Pain:** Screenshots only.  
**In app:** LOCAL AI → Export · Security PDF · Inventory Excel · cloud docs markdown.  
**Surfaces:** LOCAL AI · CLOUD docs  
**Engines/laws:** jspdf/xlsx · DocEngine  

---

## 19. Packaged security extension download

**Who:** User who lives in the browser all day.  
**Pain:** Only in-app scan.  
**In app:** LOCAL AI → Export → **Download extension ZIP** → load unpacked.  
**Surfaces:** LOCAL AI  
**Engines/laws:** extension package · activeTab+storage only  

---

## 20. Forge installable app package (workspace app)

**Who:** Builder turning policy into a real package.  
**Pain:** One-off scripts, no package.  
**In app:** STUDIO → pipeline → IDE opens files · PLATFORM registry shows forged package.  
**Surfaces:** STUDIO · IDE · PLATFORM apps  
**Engines/laws:** `/pipeline` · receipts · adapter honesty  

---

## Quick map: ask → use case #

| What they asked for | Use cases |
|---------------------|-----------|
| Personal problem / roommate test | 1, 3, 5, 7 |
| Monad gas best practices | 2, 11, 12, 13 |
| Agents + brakes / reject | 3, 7, 15 |
| Vault / onchain | 4, 8, 20 |
| Platform not pitch deck | 1, 7, 11, 20 |
| Teach as you use | 9, 10 |
| Wallets + AI twins | 5, 6 |
| Local AI / Transformers / security | 9, 10, 16, 17, 18, 19 |
| Cloud engines / hosted web app | 11, 12, 18 |
| Polyglot Julia/Node/WASM/WebGPU/Python | 13, 14, 15, 16 |
| Usable in the app | All — sticky bar + RUN SYSTEM |
| Competition / judge proof | 3, 18, PROOF tab |

## Demo script (5 minutes)

1. **▶ RUN SYSTEM** (use case 1+3+4+7+13)  
2. **DESK** — open rejects (3)  
3. **HQ** — mission awaiting approval (7)  
4. **CLOUD** — gas + chain (2, 12)  
5. **POLYGLOT** — mesh VaR + winner (13–15)  
6. **LOCAL AI** — teach quiz + scan (9–10)  
7. **PROOF** — scorecard / vaporware=false  
