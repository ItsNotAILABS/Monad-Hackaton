# THESIS Sovereign Web Terminal

Embedded command surface for the platform **and** the in-app agent.

> Not bash. Not a remote shell. **THESIS commands only.**  
> No private keys · No OS exec · Owner remains sovereign.

## Open it

- UI tab: **TERM**
- API: `GET /terminal` · `POST /terminal/exec` `{"command":"brief"}`
- Agent: chat *report pdf* / *daily brief* / or `agent gas tip` inside the terminal

## What you can reach

| Command | Purpose |
|---------|---------|
| `brief` | Daily morning brief + coach |
| `daily` | XP / streak / missions |
| `vault` | SovereignVault + kernel addresses |
| `ecosystem [q]` | Tokens / protocols |
| `laws` / `lawbook` | Dual law stack |
| `desk` / `arena` / `nomos` | Markets + REJECT demos |
| `workflow morning\|judge\|risk\|ops` | Tailored multi-step workflows |
| `action reject\|pdf\|easy\|win\|staff` | Short tailored actions |
| `tools [id]` | Shippable tools |
| `report pdf` / `report md` | **Full report** + download links |
| `reports` | List generated reports |
| `company …` | Staff Company OS |
| `agent …` | Talk to sandbox AI node |

## Full reports

```bash
curl -s -X POST http://127.0.0.1:8043/terminal/exec \
  -H "content-type: application/json" \
  -d "{\"command\":\"report pdf\"}"

curl -s -X POST http://127.0.0.1:8043/reports/full \
  -H "content-type: application/json" \
  -d "{\"network\":\"monad-testnet\",\"format\":\"both\"}"

# Download
curl -OJ http://127.0.0.1:8043/reports/download/<filename.pdf>
```

Reports include: doctrine, daily brief, LawBook dual stack, vault, ecosystem, desk, company, daily loop, gas, AI node, scorecard, packages, wallets.

## Agent + platform

Same command dictionary. The AI node may invoke terminal-backed tools (`report`, `brief`, `vault`, `ecosystem`) but **never** real keys or chain broadcast without owner promote.
