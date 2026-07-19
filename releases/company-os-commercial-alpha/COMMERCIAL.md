# THESIS Company OS — Commercial Alpha

THESIS is no longer presented as a collection of AI and DeFi features. The commercial product is a **governed miniature DeFi company for Monad**.

## Customer promise

A user gives THESIS an objective once. The company routes it across research, quant, risk, strategy, execution, security, accounting, education, and audit departments. The user receives one mission room with the recommendation, rejected alternatives, approval boundary, result, and receipt.

**Practical claim:** a recurring 15–30 minute workflow across wallets, dashboards, protocol sites, transaction simulation, and block explorers becomes one explained company mission.

## Commercial surfaces

| Surface | Customer job |
|---|---|
| Command Center | See priorities, operating KPIs, active missions, and safety state. |
| Manager Inbox | Review missions awaiting approval or execution. |
| Mission Room | Inspect department plan, risk, teaching, result, and receipt. |
| Departments | Understand which engine is accountable for each job. |
| Operating Memory | Review completed, rejected, and failed missions. |
| Workstation | Enter the existing sandbox, wallet, desk, Academy, Codex, and build surfaces. |

## Departments

- **THESIS:** General Manager
- **SENSUS:** Research
- **MATHESIS:** Quant and Simulation
- **NOMOS:** Risk and Compliance
- **AGORA:** Strategy
- **PRAXIS:** Execution Planning
- **CUSTOS:** Security
- **MEMORIA:** Accounting and Operations
- **ACADEMY:** Contextual Education
- **NERVUS:** Audit and Receipts

## Durable company state

The validated release uses SQLite with WAL journaling and explicit tables for organizations, departments, missions, approvals, and hash-linked audit events.

## Permission model

The commercial API recognizes four roles:

- `viewer`: read company state;
- `analyst`: propose missions;
- `manager`: approve and run governed analysis;
- `owner`: full local commercial-alpha authority.

A production deployment must terminate authentication at a trusted gateway and set role identity server-side.

## Execution boundary

No private keys are loaded by THESIS Company OS, and it does **not** silently broadcast transactions.

- analysis missions read current operating state;
- sandbox missions operate on digital twins;
- live chain actions remain a separate wallet-signed operation;
- high-risk work requires an explicit decision before running;
- every proposal, approval, rejection, run, completion, and failure emits an audit event.

## Release gate

The validated local package recorded:

- 238/238 structural, state-machine, safety, audit-chain, and application assertions passed;
- 7/7 focused Company OS backend tests passed;
- production multi-page frontend build passed.

A successful validator is not an external audit and does not authorize production capital.
