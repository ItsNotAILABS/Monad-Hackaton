# Focused, shippable tools

THESIS is a **platform foundation** — but you do not need the whole map to ship value.

Nine **one-press tools** give the same kind of quick utility judges love in single-feature winners (signal bots, gas helpers, reject demos), while still sitting under **LawBook + NOMOS + Company OS**.

## Easy path (under 60 seconds)

| Step | Tool | Proof you see |
|------|------|----------------|
| 1 | **laws** | dual stack embedded |
| 2 | **reject_demo** | `n_rejected ≥ 1` with reasons |
| 3 | **gas_coach** | Monad limit (~7.5% margin) |
| 4 | **win_path** | scorecard grade · live API |

**One call:** `POST /tools/easy_path/run` (or TOOLS → **EASY PATH**).

Also: `lawbook` tool / `GET /lawbook` for seed ↔ runtime alignment.

In the UI: open **TOOLS** tab, or sticky bar → tools.

```bash
# HTTP
curl -s http://127.0.0.1:8043/tools
curl -s -X POST http://127.0.0.1:8043/tools/easy_path/run -d "{}" -H "content-type: application/json"
curl -s http://127.0.0.1:8043/lawbook

# Any external AI via MCP (stdio)
cd engine
python -m thesis_forge.mcp_server
```

## Who can call tools

| Actor | How |
|-------|-----|
| **You** | TOOLS tab, sticky bar, HQ / DESK buttons |
| **In-app AI** | Sandbox node tools (twins only, no real keys) |
| **Any AI outside** | MCP server or `POST /tools/{id}/run` |

## Catalog

| id | What it ships | Beats |
|----|---------------|--------|
| `reject_demo` | Desk arena REJECT | Soft UIs / degen defaults |
| `nomos_arena` | Multi-agent evaluate → winner | Allowlist-only agent wallets |
| `gas_coach` | Monad gas limit | Fat 2× buffers |
| `company_run` | Staffed mission | Chat pretending to be ops |
| `system_run` | Morning seatbelt | Tab hell |
| `laws` | Dual stack embed | Hardcoded ifs |
| `win_path` | 90s judge proof | Video without API |
| `ai_pulse` | In-app AI pulse | Key-holding bots |
| `judge` | Scorecard + vs-winners | Ambition without proof |

## Why this matters vs polished winners

Single-feature AI/DeFi winners often win on **demo impact** (signals, auto-trade, strong video).  
THESIS ships those **narrow wins as tools**, then keeps **governance depth** (LawBook, NOMOS arena, veto/rejection, owner signature) that most agent-wallet demos skip.

See [VS_WINNERS.md](./VS_WINNERS.md) for the honest comparison.
