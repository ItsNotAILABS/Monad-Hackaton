# THESIS Company OS

The commercial product is not a pile of features. It is a **Company OS** that turns every engine into a governed department.

## Structure

| Role | Department | Backed by |
|------|------------|-----------|
| General Manager | **THESIS** | `company/os.py` |
| Research | **SENSUS** | wallets, desk, marks, ecosystem, sandbox, gas |
| Quant / sim | **MATHESIS** | cost, slip, worth-doing models |
| Risk / law | **NOMOS** | constitution → Policy + evaluate |
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

## Sovereign owner

The wallet owner remains sovereign. Departments recommend. NOMOS can veto. PRAXIS never silent-broadcasts. Sandbox AI twins stay isolated.
