# Spark · Build Anything — THESIS submission notes

**Hackathon:** [Spark](https://buildanything.so/hackathons/spark)  
**Prompt:** Build Anything onchain that solves a **personal problem**  
**Product:** THESIS v2.0 — Monad DeFi Company OS  
**Repo:** https://github.com/ItsNotAILABS/Monad-Hackaton  

---

## Personal problem

AI + DeFi is fast but reckless. Agents invent plans that can spend capital. Gas on Monad bills the **limit**. Docs and protocols are scattered. I either re-check bots for 20 minutes or I don't automate.

**Roommate test:**  
*This saved me 20 minutes of re-checking bots, stopped a fat gas-limit bill, and taught me slippage by forcing a bad plan to fail.*

---

## Winning claim

> Everyone teaches you to click go. THESIS teaches you and your AI **when go is illegal** — then deploys what passed under laws you can audit.

---

## 90-second demo (operators)

1. Open **LIVE** — market ticker, wallets/vault/desk/AI modules, law chips.  
2. Click **▶ WIN PATH** — desk arena rejects + machine scorecard.  
3. Open **JUDGE** — personal problem, scorecard PASS rows, differentiation.  
4. Optional: **AI NODE** link public wallet → twin sync (keys never leave extension).  
5. Optional: **HQ** staff company mission under dual law stacks.  
6. Optional: **STUDIO** forge package → **IDE** files.

API equivalent:

```bash
curl -X POST http://127.0.0.1:8043/demo/win-path
curl http://127.0.0.1:8043/judge
curl http://127.0.0.1:8043/competition
```

---

## Onchain story

| Contract | Role |
|----------|------|
| `PolicyKernel` | Onchain policy / law gate |
| `SovereignVault` | **Spark submission address** — execute under policy |
| `ReceiptChain` | Audit seal |
| `AgentRegistry` / `ProposalBook` / `ExecutionRouter` | Agent propose path |

Desk tickets simulate `SovereignVault.execute` via `POST /desk/vault-route/{ticket_id}` (no silent broadcast).

---

## Non-vaporware proofs

| Check | How |
|-------|-----|
| Live API | `GET /health` → operational |
| Reject feature | `POST /desk/arena` → `n_rejected >= 1` |
| Runtime laws | `GET /laws` → 26+ laws |
| AI no keys | `GET /ai` → `real_key_access: false` |
| Scorecard | `GET /competition/scorecard` |
| Smoke | `python scripts/smoke_all.py` |

---

## Monad-specific

- Gas bills **limit** (~7.5% margin coach)  
- Hardcode 21k native transfers  
- Multicall3 catalog address  
- Best practices: https://docs.monad.xyz/developer-essentials/best-practices  
