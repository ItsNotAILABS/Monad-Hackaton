# NOMOS Arena — Core Implementation

The multi-agent **proposal + evaluation** system at the heart of THESIS.

| File | Role |
|------|------|
| `engine/thesis_forge/policy.py` | Arena logic: **evaluate → arbitrate → arena_report** |
| `engine/thesis_forge/agents.py` | Deterministic multi-agent proposal generation |
| `engine/thesis_forge/models.py` | `Action`, `Policy`, `Evaluation` |
| `engine/thesis_forge/api.py` | FastAPI surface (`/nomos`, `/arena`, `/arena/auto`, `/evaluate`, `/desk/arena`) |
| `engine/thesis_forge/nomos.py` | Department catalog + dual-stack `run_nomos_arena` |

> **Doctrine:** *Agents propose. Laws decide. Owner signs. Receipts remember.*  
> **REJECT is a feature** — deliberate, logged, teachable — not a failure.

---

## 1. Key models

### Action

A proposed plan or ticket:

| Field | Meaning |
|-------|---------|
| `agent` | Who proposed |
| `category` | dex / lending / vault / staking / perps / … |
| `protocol` | Target venue (kuru, aave, beefy, …) |
| `action` | Verb (swap, supply, deposit, open, …) |
| `value` | Notional size |
| `slippage_bps` | Price impact budget |
| `resulting_protocol_exposure_bps` | Concentration after action |
| `resulting_liquid_reserve_bps` | Liquidity left after action |
| `resulting_leverage_bps` | Leverage after action (10000 = 1×) |
| `expected_gain_bps` | Claimed upside |
| `risk_bps` | Claimed risk |
| `rationale` | Human/agent note |

### Policy

Owner rulebook / constitution (plus ecosystem layer elsewhere):

| Field | Meaning |
|-------|---------|
| `max_slippage_bps` | Cap on slippage |
| `max_protocol_exposure_bps` | Cap on single-protocol concentration |
| `min_liquid_reserve_bps` | Floor on liquid reserve |
| `max_leverage_bps` | Cap on leverage |
| `max_action_value` | Cap on notional per action |
| `allowed_categories` | Category allowlist |
| `require_simulation` | Product flag for PRAXIS/mission path |

### Evaluation

Result of one Action vs Policy:

| Field | Meaning |
|-------|---------|
| `accepted` | `True` only if **zero** violations |
| `violations` | Machine ids (`slippage-limit`, …) |
| `score` | `expected_gain_bps - risk_bps - slippage_bps` |
| `reasons` | Human strings for each violation |
| `human_summary` | Full ACCEPT / REJECT sentence |

---

## 2. Heart of the arena: `policy.py`

### `evaluate(action, policy) → Evaluation`

Checks a single proposal against **all** rules (no short-circuit — every brake is visible):

```
category ∈ allowed_categories
slippage_bps ≤ max_slippage_bps
resulting_protocol_exposure_bps ≤ max_protocol_exposure_bps
resulting_liquid_reserve_bps ≥ min_liquid_reserve_bps
resulting_leverage_bps ≤ max_leverage_bps
value ≤ max_action_value
```

```python
accepted = len(violations) == 0
score = float(action.expected_gain_bps - action.risk_bps - action.slippage_bps)
```

- **REJECTED:** `human_summary` lists reasons (for UI + ACADEMY).  
- **ACCEPTED:** summary includes score; plan may compete for winner.

### `arbitrate(actions, policy) → (evaluated, winner)`

1. `evaluate` every action  
2. Filter to **accepted** only  
3. Winner = **max score** among lawful plans  
4. If none lawful → `winner is None` (valid outcome)

### `arena_report(actions, policy) → dict`

Full machine + human report:

| Key | Content |
|-----|---------|
| `schema` | `thesis.arena.v1` |
| `doctrine` / `tagline` | Full doctrine + REJECT slogan |
| `n_plans` / `n_accepted` / `n_rejected` | Counts |
| `evaluations` | `[{action, evaluation}, …]` |
| `scoreboard` | Ranked ACCEPT first, then REJECT |
| `winner` | Best lawful plan or `null` |
| `reject_is_a_feature` | always `true` |
| `rules_applied` | Rule ids used |
| `owner_next` | What owner can do next |

### `rule_catalog()`

Public description of models + rules for `GET /nomos` and docs.

---

## 3. Proposal generation: `agents.py`

`propose_plans(request, policy)` always emits competing agents, including a **deliberate unlawful control** (e.g. reckless leverage/perps) so REJECT is demoable without LLM:

- `reckless-agent` — expected REJECT  
- `balanced-agent` — conservative ACCEPT  
- `yield-agent` — vault yield within caps  
- `dust-agent` — small DEX hygiene  

---

## 4. API surface (`api.py`)

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/nomos` | Department + rule catalog + dual stack |
| `POST` | `/nomos/run` | Propose + dual-stack arena report |
| `POST` | `/agents/propose` | Plans only |
| `POST` | `/arena` | `arena_report` on provided actions + receipt |
| `POST` | `/arena/auto` | `propose_plans` → `arena_report` + receipt |
| `POST` | `/evaluate` | Single Action vs Policy |
| `POST` | `/desk/arena` | Trading tickets under desk risk + NOMOS |

```bash
# Single gate
curl -s -X POST http://127.0.0.1:8043/evaluate \
  -H "content-type: application/json" \
  -d '{"agent":"x","category":"perps","protocol":"perpl","action":"open","value":5000,"slippage_bps":800,"resulting_protocol_exposure_bps":9000,"resulting_liquid_reserve_bps":100,"resulting_leverage_bps":50000}'

# Full auto arena (expect n_rejected >= 1)
curl -s -X POST http://127.0.0.1:8043/arena/auto \
  -H "content-type: application/json" \
  -d '{"name":"Arena Demo","objective":"Grow under laws with explicit rejects","categories":["vault","dex"],"network":"monad-testnet"}'
```

Receipts: each arena call seals `nomos.arena` or `nomos.arena.auto` on the hash-linked chain.

---

## 5. Flow diagram

```
  Agents (propose_plans / AGORA)
           │
           ▼
     list[Action]
           │
           ▼
   evaluate(action, policy)  × N     ◄── policy.py RULES
           │
           ▼
   list[(Action, Evaluation)]
           │
           ▼
   arbitrate → winner (max score among accepted)
           │
           ▼
   arena_report + scoreboard + receipt
           │
           ▼
   Owner: approve | reject | simulate_again | revise
           │
           ▼
   PRAXIS (signed) · NERVUS (seal) · ACADEMY (learn rejects)
```

---

## 6. Why REJECT is a feature

1. **Safety** — unlawful capital paths never become winners  
2. **Explainability** — every violation id + human reason  
3. **Teaching** — ACADEMY failure-first labs use live rejects  
4. **Demo / non-vaporware** — Spark judges see `n_rejected >= 1`  
5. **Sovereignty** — laws decide; AI does not override owner constitution  

---

## Related

- [NOMOS.md](./NOMOS.md) — department product view  
- [COMPANY_OS.md](./COMPANY_OS.md) — workflow  
- [ECOSYSTEM_LAWS.md](./ECOSYSTEM_LAWS.md) — second law stack  
- [EXPLAINABILITY_CONTRACT.md](./EXPLAINABILITY_CONTRACT.md) — receipts  
