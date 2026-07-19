# LawBook — on-chain ecosystem law registry

One half of the **dual law stack** that powers NOMOS and the Company OS.

| Stack half | Where | Role |
|------------|-------|------|
| **Owner constitution** | `PolicyKernel.sol` · company constitution | Personal limits, allowlists, daily caps |
| **Ecosystem laws** | **`LawBook.sol`** · `ecosystem_laws.py` | Platform-wide Monad + safety + protocol rules |

> Doctrine: *Agents propose. Laws decide. Owner signs. Receipts remember.*

## Why it beats light agent wallets

Typical agentic winners: allowlists or simple policy checks.  
**LawBook** is a real registry (pillars, severity, domains) mirrored at runtime and consulted in the arena.

## Structure

- **Pillars:** safety · governance · execution · intelligence  
- **Severity:** critical · high · medium  
- **Domains:** system_self · monad_network · protocols · intelligence · execution  

Seed ids include `sys.nomos-veto`, `monad.gas-bills-limit`, `proto.exact-approval`, `exec.no-silent-broadcast`, …

## Together with

| Contract | Role |
|----------|------|
| PolicyKernel | Owner policy + optional `lawBook` link |
| ProposalBook | Proposal lifecycle + reject reasons |
| SovereignVault | Policy-gated execute (Spark primary) |
| ReceiptChain | Hash-linked audit (NERVUS) |
| ThesisFactory | One-tx stack; seeds LawBook defaults |

## Runtime

- `embed_ecosystem_laws()` · `GET /laws` · `GET /laws/full`  
- NOMOS / tools: dual stack in arena + `laws` tool  

See [ECOSYSTEM_LAWS.md](./ECOSYSTEM_LAWS.md) · [NOMOS.md](./NOMOS.md) · [VS_WINNERS.md](./VS_WINNERS.md).
