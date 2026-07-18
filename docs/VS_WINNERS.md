# THESIS vs typical winners — honest comparison

## What many winners do well

**Strong agentic on-chain integration** is a common winning pattern:

- Autonomous DAO agents or **AI trading bots** that execute via contracts  
- Real-time **signals**, governance automation, or **agent wallets**  
- Polished **single demos / MVPs** optimized for judging (strong videos, live proofs)  

Examples of the *shape* (not attacks on teams): focused AI signals products, automated trading helpers, agent wallets with basic policy.

They excel at:

| Strength | Why judges reward it |
|----------|----------------------|
| Focused execution | One clear story in 90s |
| Real-world utility | “I would use this tomorrow” |
| Demo polish | Video + one happy path |

They often **lack**:

- A registry of ecosystem laws (**LawBook**)  
- Dual-stack enforcement (owner constitution **+** ecosystem)  
- Structured **Company OS** workflow with **veto / REJECT as a feature**  
- Breadth that is still **production-shaped** (receipts, SLAs, teach-as-you-use)

## Where THESIS sits

| Dimension | Typical focused winner | THESIS |
|-----------|------------------------|--------|
| Story | One feature (signals / trade / wallet) | Personal problem → company OS |
| Governance | Basic allowlists / simple policy | **LawBook + PolicyKernel + NOMOS arena** |
| Rejection | Soft fail or hidden | **Explicit REJECT + reasons + receipts** |
| Agent path | Bot executes (or simulates) | Agents propose → laws decide → **owner signs** |
| Scope risk | Low (narrow win) | Higher — can look over-scoped |
| Scope reward | Less reuse | **Infrastructure reuse** · platform foundation |
| Spark fit | Medium if not personal | **High** — tab hell + reckless agents is personal |
| Bigger events | Demo impact / novelty | Systemic thinking + reusability |

## Trade-offs (real talk)

- **THESIS’s scope is a strength** (ambition, shared primitives, reuse) but some judges prefer **quick, narrow wins**.  
- **Spark’s practical / personal-problem** focus plays to THESIS.  
- Bigger events (e.g. broad EVM accathons) often reward **both depth and polish** — so we ship **focused tools** (`reject_demo`, `gas_coach`, `win_path`) as the narrow demos *inside* the platform.

## One-liner for judges

> Most AI-onchain winners are elegant single tools. THESIS is a **Company OS with brakes**: multi-agent arena, dual law stack, and owner-signed execution — with the same tools exposed one-click for humans and any external AI via MCP.

## How we stay easy to use

1. **TOOLS tab** — nine shippable actions, not 40 half-screens  
2. **Easy path** — laws → reject → gas → win_path (< 60s)  
3. **WIN PATH** — one button for judges  
4. **MCP** — any AI outside calls the same tools  
5. **Roommate test** — 20 minutes of bot re-checking becomes one explained mission  

API: `GET /tools` · `GET /competition` · `POST /demo/win-path` · `GET /judge`
