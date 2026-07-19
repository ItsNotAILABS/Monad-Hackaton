# THESIS Company OS

The commercial product is not a pile of features. It is a **Company OS** that turns every engine into a governed department.

## Structure

| Role | Department | Backed by |
|------|------------|-----------|
| General Manager | **THESIS** | `company/os.py` |
| Research | **SENSUS** | wallets, desk, marks, ecosystem, sandbox, gas |
| Quant / sim | **MATHESIS** | cost, slip, worth-doing models |
| Risk / law | **NOMOS** | dual law stack → Policy + arena; **REJECT is a feature** ([docs/NOMOS.md](./NOMOS.md)) |
| Strategy competition | **AGORA** | multi-agent proposals |
| Execution | **PRAXIS** | ordered tx mission (signature required) |
| Security | **CUSTOS** | address/approval/gas hygiene checks |
| Accounting | **MEMORIA** | company state + metrics |
| Teacher | **ACADEMY** | lesson on live mission |
| Audit | **NERVUS** | hash-linked receipts |

## What the owner sees

1. **Morning Brief** — balances, idle %, urgency  
2. **Manager Inbox** — recommended / optional / auto-rejected / learning  
3. **Mission Room** — objective, departments, competing plans, txs, approve  
4. **Company Performance** — time saved, blocks, lessons, not only token PnL  

## API

- `GET /company` — full HQ  
- `POST /company/run` — staff all departments for an objective  
- `GET /company/missions/{id}` — mission room  
- `POST /company/missions/{id}/act` — approve | reject | simulate_again | revise  
- `GET/POST /company/constitution` — financial laws  
- `GET /nomos` — NOMOS department catalog (doctrine, dual stack, APIs)  
- `POST /nomos/run` — multi-agent propose + arena under dual law stack  
- `POST /arena/auto` · `POST /desk/arena` — arena surfaces  

## NOMOS (risk / law)

Auto multi-agent propose + arena. Every proposed action is a policy **Action**. Dual stack:

1. **Owner constitution** — liquidity, leverage, exposure, value caps  
2. **Ecosystem laws** — Monad gas discipline, exact approvals, no real keys  

Rejection is deliberate and receipt-sealed; ACADEMY trains on failure-first labs. See [NOMOS.md](./NOMOS.md).

## Sovereign owner

The wallet owner remains sovereign. Departments recommend. NOMOS can veto. PRAXIS never silent-broadcasts. Sandbox AI twins stay isolated.
