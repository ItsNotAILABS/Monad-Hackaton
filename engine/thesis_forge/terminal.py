"""Sovereign embedded web terminal — THESIS command surface only.

Not a system shell. No OS exec. No private keys. Owner remains sovereign.
Agents and the platform share the same command dictionary.
"""

from __future__ import annotations

import shlex
import time
from typing import Any, Dict, List, Optional, Tuple

from . import __version__
from .receipts import seal

DOCTRINE = "Agents propose. Laws decide. Owner signs. Receipts remember."

# Session history (in-process; fine for demo / single operator)
_HISTORY: List[Dict[str, Any]] = []
_MAX_HIST = 200


COMMANDS: Dict[str, Dict[str, str]] = {
    "help": {"usage": "help [cmd]", "desc": "List commands or detail one"},
    "clear": {"usage": "clear", "desc": "Clear terminal history (session)"},
    "status": {"usage": "status", "desc": "Platform pulse: laws, desk, vault, AI"},
    "brief": {"usage": "brief", "desc": "AI daily brief (MonadBuilder seatbelt)"},
    "morning": {"usage": "morning", "desc": "One-tap AI morning: checkin+gas+reject+signal"},
    "daily": {"usage": "daily", "desc": "Daily loop XP / streak / missions"},
    "vault": {"usage": "vault", "desc": "SovereignVault address + policy gate status"},
    "ecosystem": {"usage": "ecosystem [token]", "desc": "Ecosystem catalog / token lookup"},
    "laws": {"usage": "laws [id]", "desc": "Dual law stack / one law"},
    "lawbook": {"usage": "lawbook", "desc": "On-chain LawBook seed alignment"},
    "desk": {"usage": "desk", "desc": "Trading desk snapshot"},
    "arena": {"usage": "arena", "desc": "Desk arena — prove REJECT is a feature"},
    "nomos": {"usage": "nomos", "desc": "NOMOS multi-agent arena under dual stack"},
    "workflow": {"usage": "workflow [name]", "desc": "Tailored workflows (list or run)"},
    "action": {"usage": "action <name>", "desc": "Tailored actions (list or run)"},
    "tools": {"usage": "tools [id]", "desc": "Shippable tools catalog or run tool"},
    "report": {"usage": "report [pdf|md]", "desc": "Generate FULL report + download links"},
    "reports": {"usage": "reports", "desc": "List generated reports"},
    "company": {"usage": "company [objective…]", "desc": "Staff Company OS mission"},
    "gas": {"usage": "gas [estimate]", "desc": "Monad gas limit coach"},
    "agent": {"usage": "agent [message…]", "desc": "Talk to in-app AI node (twins only)"},
    "signals": {"usage": "signals", "desc": "Alpha signal board (winner pattern + brakes)"},
    "auto": {"usage": "auto", "desc": "Auto paper loop: arena + signals + strategy fills"},
    "intel": {"usage": "intel", "desc": "Intelligence pulse: coach + signals + reject"},
    "hybrid": {"usage": "hybrid [op]", "desc": "Node worker_threads hybrid (pulse/arena/bench)"},
    "doctrine": {"usage": "doctrine", "desc": "Print platform doctrine"},
    "whoami": {"usage": "whoami", "desc": "Sovereign operator context (no keys)"},
}


WORKFLOWS: Dict[str, Dict[str, Any]] = {
    "morning": {
        "name": "Morning seatbelt",
        "steps": ["brief", "laws", "desk", "gas", "arena"],
        "why": "Replace 20 min of tab hell",
    },
    "judge": {
        "name": "Judge proof path",
        "steps": ["lawbook", "arena", "nomos", "auto", "report pdf"],
        "why": "Live rejects + auto paper exec + dual stack + report",
    },
    "risk": {
        "name": "Risk / NOMOS",
        "steps": ["laws", "nomos", "desk", "vault"],
        "why": "Brakes before capital moves",
    },
    "ops": {
        "name": "Daily ops",
        "steps": ["brief", "daily", "ecosystem", "company"],
        "why": "Company OS + ecosystem pulse",
    },
    "alpha": {
        "name": "Winner-class alpha",
        "steps": ["signals", "auto", "intel"],
        "why": "Absorb KiSignal/Gorillionaire utility under THESIS laws",
    },
}


ACTIONS: Dict[str, str] = {
    "reject": "arena",
    "win": "tools win_path",
    "easy": "tools easy_path",
    "pdf": "report pdf",
    "md": "report md",
    "staff": "company Grow safely under dual law stack",
    "alpha": "auto",
    "signals": "signals",
}


def _lines(text: str) -> List[str]:
    return text.rstrip().split("\n") if text else []


def _out(ok: bool, lines: List[str], data: Optional[Dict] = None) -> Dict[str, Any]:
    return {
        "ok": ok,
        "lines": lines,
        "text": "\n".join(lines),
        "data": data or {},
    }


def cmd_help(args: List[str]) -> Dict[str, Any]:
    if args and args[0] in COMMANDS:
        c = COMMANDS[args[0]]
        return _out(True, [f"{c['usage']} — {c['desc']}"])
    lines = [
        "THESIS sovereign terminal (not a system shell)",
        f"v{__version__} · {DOCTRINE}",
        "No OS exec · No private keys · Owner signs",
        "",
        "Commands:",
    ]
    for name, c in sorted(COMMANDS.items()):
        lines.append(f"  {c['usage']:<28} {c['desc']}")
    lines.append("")
    lines.append("Workflows: " + ", ".join(WORKFLOWS.keys()))
    lines.append("Actions:   " + ", ".join(ACTIONS.keys()))
    lines.append("Try: brief · vault · ecosystem · arena · report pdf · workflow morning")
    return _out(True, lines)


def cmd_status(args: List[str], network: str) -> Dict[str, Any]:
    from .unified import system_status

    st = system_status(network)
    lines = [
        f"THESIS v{st.get('version')} · {network}",
        f"Laws: {st.get('laws')} · Desk equity: {st.get('desk_equity')} · Wallets: {st.get('wallets_linked')}",
        f"Vault: {st.get('vault') or '(not recorded)'}",
        f"AI no keys: {st.get('ai_no_keys')} · Projects: {st.get('projects')}",
        f"Tools: {(st.get('tools') or {}).get('easy_path')}",
    ]
    return _out(True, lines, st)


def cmd_brief(args: List[str], network: str) -> Dict[str, Any]:
    from .builder import daily_ai_brief

    b = daily_ai_brief(network)
    lines = [
        "=== MONADBUILDER AI BRIEF ===",
        str(b.get("brief_text") or b.get("ai_voice") or ""),
        str(b.get("celebration") or ""),
        f"mood={b.get('mood')} streak={(b.get('stats') or {}).get('streak')} xp={(b.get('stats') or {}).get('xp')} · text-only (no TTS)",
    ]
    for a in (b.get("actions") or [])[:5]:
        lines.append(f"  → {a.get('label')}: {a.get('why')}")
    if b.get("signal_top"):
        s = b["signal_top"]
        lines.append(f"Top signal: {s.get('side')} {s.get('symbol')} score={s.get('score')}")
    return _out(True, lines, b)


def cmd_morning(args: List[str], network: str) -> Dict[str, Any]:
    from .builder import run_morning

    m = run_morning(network)
    lines = [
        "=== AI MORNING ===",
        m.get("headline") or "",
        m.get("celebration") or "",
        m.get("brief_text") or m.get("ai_voice") or "",
        "format=text · tts=false · use mic for STT notes/commands only",
    ]
    for s in m.get("steps") or []:
        lines.append(f"  {'✓' if s.get('ok') else '·'} {s.get('id')}: {s.get('detail')}")
    return _out(bool(m.get("ok")), lines, m)


def cmd_daily(args: List[str], network: str) -> Dict[str, Any]:
    from .daily import home as daily_home

    h = daily_home(network)
    lines = [
        f"Level {h.get('level')} · XP {h.get('xp')} · Streak {h.get('streak')}",
        "Missions:",
    ]
    for m in (h.get("missions") or [])[:8]:
        mid = m.get("id") or m.get("mission_id") or "?"
        lines.append(f"  [{m.get('status') or 'open'}] {mid}: {m.get('title') or m.get('label') or ''}")
    return _out(True, lines, h)


def cmd_vault(args: List[str], network: str) -> Dict[str, Any]:
    from .vault_route import _load_vault_address
    from pathlib import Path
    import json

    vault = _load_vault_address()
    dep_path = Path(__file__).resolve().parents[2] / "receipts" / "deployment.json"
    contracts = {}
    if dep_path.exists():
        try:
            contracts = (json.loads(dep_path.read_text(encoding="utf-8")).get("contracts") or {})
        except Exception:
            pass
    lines = [
        "=== SOVEREIGN VAULT ===",
        f"Address: {vault or '(not deployed / not recorded)'}",
        f"PolicyKernel: {contracts.get('PolicyKernel') or '—'}",
        f"LawBook: {contracts.get('LawBook') or '—'}",
        f"ReceiptChain: {contracts.get('ReceiptChain') or '—'}",
        "Gate: PolicyKernel.validate · simulation first · owner signature",
        "Sim: POST /desk/vault-route/{ticket_id} after accepted ticket",
        "Doctrine: exec.no-silent-broadcast · sys.owner-sovereign",
    ]
    return _out(True, lines, {"vault": vault, "contracts": contracts})


def cmd_ecosystem(args: List[str], network: str) -> Dict[str, Any]:
    from .ecosystem import ecosystem_bundle
    from .atlas import all_protocols

    eco = ecosystem_bundle(network)
    tokens = eco.get("tokens") or []
    protos = all_protocols()
    q = (args[0].lower() if args else "")
    lines = [
        f"=== ECOSYSTEM · {network} ===",
        f"Tokens: {len(tokens)} · Protocols: {len(protos)}",
    ]
    if q:
        hits = [t for t in tokens if q in str(t.get("symbol", "")).lower() or q in str(t.get("name", "")).lower()]
        if not hits:
            hits = [
                {"id": p.id, "name": p.name, "category": str(p.category)}
                for p in protos
                if q in p.id.lower() or q in p.name.lower()
            ][:8]
            for h in hits:
                lines.append(f"  protocol {h.get('id')}: {h.get('name')} ({h.get('category')})")
        else:
            for t in hits[:10]:
                lines.append(
                    f"  {t.get('symbol')}: {t.get('name')} "
                    f"{(t.get('address') or '')[:14] or 'catalog'}…"
                )
        if len(lines) == 2:
            lines.append(f"  (no match for {q!r})")
    else:
        for t in tokens[:8]:
            lines.append(f"  {t.get('symbol')}: {t.get('name')}")
        lines.append("  … use: ecosystem USDC | ecosystem kuru")
        lines.append("Protocols sample:")
        for p in protos[:6]:
            lines.append(f"  {p.id} · {p.name} · {p.adapter_status}")
    lines.append("Law: monad.no-invent-addresses · proto.live-only-when-live")
    return _out(True, lines, {"token_count": len(tokens), "protocol_count": len(protos)})


def cmd_laws(args: List[str], network: str) -> Dict[str, Any]:
    from .ecosystem_laws import embed_ecosystem_laws, get_law, runtime_status

    embed_ecosystem_laws()
    st = runtime_status()
    if args:
        law = get_law(args[0])
        if not law:
            return _out(False, [f"law not found: {args[0]}"])
        return _out(
            True,
            [
                f"{law.get('id')} [{law.get('pillar')}/{law.get('severity')}]",
                law.get("rule") or "",
                f"enforcement: {law.get('enforcement')}",
            ],
            law,
        )
    lines = [
        f"Embedded laws: {st.get('law_count')} · domains: {st.get('domains')}",
        "Pillars: safety · governance · execution · intelligence",
        "Try: laws sys.nomos-veto | lawbook | laws monad.gas-bills-limit",
    ]
    return _out(True, lines, st)


def cmd_lawbook(args: List[str], network: str) -> Dict[str, Any]:
    from .lawbook import lawbook_payload

    lb = lawbook_payload(network)
    al = lb.get("alignment") or {}
    lines = [
        "=== LAWBOOK DUAL STACK ===",
        f"Seed aligned: {al.get('seed_in_runtime')}/{al.get('seed_total')} ok={al.get('ok')}",
        f"Runtime laws: {(lb.get('runtime') or {}).get('law_count')}",
        "Owner: PolicyKernel · Ecosystem: LawBook.sol + ecosystem_laws.py",
        lb.get("beats_crowd") or "",
    ]
    return _out(True, lines, lb)


def cmd_desk(args: List[str], network: str) -> Dict[str, Any]:
    from .trading import desk_snapshot

    d = desk_snapshot()
    lines = [
        f"Equity {d.get('equity')} · Cash {d.get('cash_usdc')} · Day PnL {d.get('day_pnl')}",
        f"Paper: {d.get('paper_mode')} · Open notional: {d.get('open_notional')}",
    ]
    return _out(True, lines, d)


def cmd_arena(args: List[str], network: str) -> Dict[str, Any]:
    from .trading import load_desk, run_desk_arena

    r = run_desk_arena(load_desk())
    lines = [
        f"DESK ARENA · accept {r.get('n_accepted')} / reject {r.get('n_rejected')}",
        "REJECT is a feature:",
    ]
    for row in (r.get("results") or []):
        if not row.get("accepted"):
            t = row.get("ticket") or {}
            lines.append(
                f"  ✗ {t.get('agent')} {t.get('pair')} — "
                + "; ".join((row.get("reasons") or row.get("violations") or [])[:3])
            )
    return _out(True, lines, r)


def cmd_nomos(args: List[str], network: str) -> Dict[str, Any]:
    from .nomos import run_nomos_arena

    r = run_nomos_arena()
    w = (r.get("winner") or {}).get("action") or {}
    lines = [
        f"NOMOS · accept {r.get('n_accepted')} / reject {r.get('n_rejected')}",
        f"Winner: {w.get('agent') or 'none'}",
        f"Dual stack eco laws: {(r.get('dual_law_stack') or {}).get('ecosystem_law_count')}",
    ]
    for b in (r.get("scoreboard") or [])[:6]:
        mark = "✓" if b.get("accepted") else "✗"
        lines.append(f"  {mark} #{b.get('rank')} {b.get('agent')} score={b.get('score')}")
    return _out(True, lines, {"n_rejected": r.get("n_rejected"), "winner": w.get("agent")})


def cmd_tools(args: List[str], network: str) -> Dict[str, Any]:
    from .tools import get_tool, run_tool, tools_catalog

    if not args:
        cat = tools_catalog()
        lines = [f"Tools ({cat.get('count')}):"]
        for t in cat.get("tools") or []:
            lines.append(f"  {t['id']:<14} {t['name']} ({t.get('seconds')}s)")
        lines.append("Run: tools reject_demo | tools easy_path | tools win_path")
        return _out(True, lines, cat)
    tid = args[0]
    if not get_tool(tid):
        return _out(False, [f"unknown tool {tid}"])
    out = run_tool(tid, {"network": network})
    lines = [
        f"tool {tid} ok={out.get('ok')}",
        f"proof: {(out.get('result') or {}).get('proof')}",
    ]
    return _out(bool(out.get("ok")), lines, out)


def cmd_report(args: List[str], network: str) -> Dict[str, Any]:
    from .reports import write_full_report

    kind = (args[0].lower() if args else "both")
    fmt = "pdf" if kind == "pdf" else ("md" if kind in ("md", "markdown") else "both")
    out = write_full_report(network, fmt=fmt)
    dl = out.get("download") or {}
    lines = [
        "=== FULL REPORT GENERATED ===",
        f"Sections: {len((out.get('report') or {}).get('sections') or [])}",
        f"Markdown: {dl.get('markdown')}",
        f"PDF: {dl.get('pdf') or '(skipped)'}",
        f"PDF bytes: {out.get('bytes_pdf')}",
        "Download via platform REPORTS / terminal reports · agent: report pdf",
    ]
    return _out(True, lines, out)


def cmd_reports(args: List[str], network: str) -> Dict[str, Any]:
    from .reports import list_reports

    lst = list_reports()
    lines = [f"Reports ({lst.get('n')}):"]
    for r in lst.get("reports") or []:
        lines.append(f"  {r['name']} ({r['size']} b) → {r['download']}")
    if not lst.get("reports"):
        lines.append("  (none yet — run: report pdf)")
    return _out(True, lines, lst)


def cmd_company(args: List[str], network: str) -> Dict[str, Any]:
    from .company.os import run_objective

    obj = " ".join(args) if args else "Grow my Monad position, keep 30% liquid, avoid leverage."
    out = run_objective(obj)
    m = out.get("mission") or {}
    w = m.get("winner") or {}
    lines = [
        f"Mission status: {m.get('status')}",
        f"Winner agent: {w.get('agent')}",
        f"SLA all met: {out.get('sla_all_met')}",
        "Owner actions: approve | reject | simulate_again | revise",
    ]
    return _out(bool(out.get("ok")), lines, out)


def cmd_gas(args: List[str], network: str) -> Dict[str, Any]:
    from .gas_intel import apply_gas_limit_margin, gas_coach

    est = int(args[0]) if args and args[0].isdigit() else 80_000
    chain = 10143 if "testnet" in network else 143
    m = apply_gas_limit_margin(chain, est)
    g = gas_coach()
    lines = [
        f"Estimate {est} → limit {m.get('recommended_gas_limit')} (margin {m.get('margin_bps')} bps)",
        f"Tip: {(g.get('tip') or {}).get('title')} — {(g.get('tip') or {}).get('body')}",
        "Law: monad.gas-bills-limit (you pay the limit on Monad)",
    ]
    return _out(True, lines, m)


def cmd_agent(args: List[str], network: str) -> Dict[str, Any]:
    from .ai_node import ai_chat

    msg = " ".join(args) if args else "gas tip and daily brief"
    r = ai_chat(msg, network=network)
    lines = ["[agent]", r.get("answer") or "(empty)"]
    for a in (r.get("actions") or [])[:6]:
        lines.append(f"  tool:{a.get('tool')}")
    return _out(True, lines, r)


def cmd_signals(args: List[str], network: str) -> Dict[str, Any]:
    from .signals import generate_signals

    s = generate_signals(network)
    lines = [
        f"=== SIGNALS ({s.get('n')}) · {s.get('tagline')} ===",
        f"Absorbs: {', '.join(s.get('absorbs') or [])}",
    ]
    for b in (s.get("leaderboard") or [])[:8]:
        mark = "AUTO" if b.get("auto") else ("OK" if b.get("policy_ok") else "BLOCK")
        lines.append(
            f"  #{b.get('rank')} {b.get('side'):<4} {b.get('symbol'):<12} "
            f"score={b.get('score')} [{mark}] {b.get('id')}"
        )
    lines.append("Next: auto · or POST /signals/{id}/ticket")
    return _out(True, lines, s)


def cmd_auto(args: List[str], network: str) -> Dict[str, Any]:
    from .auto_exec import auto_loop

    r = auto_loop(network)
    lines = [
        f"=== AUTO EXEC (paper) ===",
        r.get("headline") or "",
        f"Chain broadcast: {r.get('chain_broadcast', False)}",
    ]
    for st in r.get("steps") or []:
        lines.append(f"  {'✓' if st.get('ok') else '✗'} {st.get('step')}: {st.get('detail')}")
    lines.append(f"Desk equity {(r.get('desk') or {}).get('equity')} dayPnL {(r.get('desk') or {}).get('day_pnl')}")
    lines.append(r.get("owner_next") or "")
    return _out(bool(r.get("ok")), lines, r)


def cmd_intel(args: List[str], network: str) -> Dict[str, Any]:
    from .auto_exec import intelligence_pulse

    p = intelligence_pulse(network)
    lines = [
        "=== INTELLIGENCE PULSE ===",
        str(p.get("headline") or ""),
        f"Recommendation: {p.get('recommendation')}",
        f"Brief: {p.get('brief')}",
    ]
    for t in (p.get("tips") or [])[:3]:
        lines.append(f"  → {t.get('title')}: {t.get('body')}")
    lines.append("Signals top:")
    for s in (p.get("signals_top") or [])[:4]:
        lines.append(f"  #{s.get('rank')} {s.get('side')} {s.get('symbol')} score={s.get('score')}")
    return _out(True, lines, p)


def cmd_hybrid(args: List[str], network: str) -> Dict[str, Any]:
    from .hybrid import hybrid_catalog, run_hybrid_node

    op = args[0] if args else "pulse"
    if op in ("help", "catalog", "info"):
        c = hybrid_catalog()
        lines = [
            "=== HYBRID (blockchain + workers) ===",
            c.get("description", "")[:200],
            f"Layers: {', '.join(x['id'] for x in c.get('layers') or [])}",
            "Browser: HYBRID tab · Node: hybrid pulse|arena|bench",
        ]
        return _out(True, lines, c)
    r = run_hybrid_node(op, {"network": network})
    res = r.get("result") or {}
    lines = [
        f"=== HYBRID NODE WORKER · {op} ===",
        f"ok={r.get('ok')} novel={r.get('novel_tech')}",
        f"engine={(res.get('engine') or res.get('worker') or 'node')}",
    ]
    inner = res.get("result") if isinstance(res.get("result"), dict) else res
    if isinstance(inner, dict):
        if "arena" in inner:
            a = inner["arena"]
            lines.append(
                f"arena accept={a.get('n_accepted')} reject={a.get('n_rejected')} winner={a.get('winner')}"
            )
        if "agents" in inner:
            lines.append(f"agents winner={(inner.get('agents') or {}).get('winner')}")
        if inner.get("n_rejected") is not None:
            lines.append(f"n_rejected={inner.get('n_rejected')} n_accepted={inner.get('n_accepted')}")
    lines.append("Browser workers: open HYBRID tab for off-main-thread scoring")
    return _out(bool(r.get("ok")), lines, r)


def cmd_workflow(args: List[str], network: str) -> Dict[str, Any]:
    if not args:
        lines = ["Workflows:"]
        for k, w in WORKFLOWS.items():
            lines.append(f"  {k:<10} {w['name']} — {w['why']}")
            lines.append(f"             steps: {' → '.join(w['steps'])}")
        lines.append("Run: workflow morning | workflow judge | workflow risk")
        return _out(True, lines)
    name = args[0]
    wf = WORKFLOWS.get(name)
    if not wf:
        return _out(False, [f"unknown workflow {name}"])
    lines = [f"=== WORKFLOW {name}: {wf['name']} ==="]
    results = []
    for step in wf["steps"]:
        r = exec_line(step, network=network, record=False)
        results.append({"step": step, "ok": r.get("ok")})
        lines.append(f"$ {step}")
        lines.extend("  " + ln for ln in (r.get("lines") or [])[:8])
        lines.append("")
    lines.append("Workflow complete.")
    return _out(all(x["ok"] for x in results), lines, {"steps": results})


def cmd_action(args: List[str], network: str) -> Dict[str, Any]:
    if not args:
        lines = ["Tailored actions:"]
        for k, v in ACTIONS.items():
            lines.append(f"  {k:<10} → {v}")
        return _out(True, lines)
    name = args[0]
    mapped = ACTIONS.get(name)
    if not mapped:
        return _out(False, [f"unknown action {name}"])
    return exec_line(mapped, network=network, record=False)


def exec_line(line: str, *, network: str = "monad-testnet", record: bool = True) -> Dict[str, Any]:
    """Execute one sovereign terminal line."""
    line = (line or "").strip()
    if not line:
        return _out(True, [""])
    # Block dangerous patterns (sovereign: never a real shell)
    low = line.lower()
    banned = ("rm -", "curl ", "wget ", "ssh ", "private key", "mnemonic", "seed phrase", "export KEY")
    for b in banned:
        if b.lower() in low:
            return _out(False, [f"blocked: sovereign terminal refuses `{b.strip()}`"])

    try:
        parts = shlex.split(line)
    except ValueError:
        parts = line.split()
    if not parts:
        return _out(True, [""])

    cmd, args = parts[0].lower(), parts[1:]
    t0 = time.perf_counter()

    dispatch = {
        "help": lambda: cmd_help(args),
        "?": lambda: cmd_help(args),
        "clear": lambda: _clear(),
        "status": lambda: cmd_status(args, network),
        "brief": lambda: cmd_brief(args, network),
        "morning": lambda: cmd_morning(args, network),
        "daily": lambda: cmd_daily(args, network),
        "vault": lambda: cmd_vault(args, network),
        "ecosystem": lambda: cmd_ecosystem(args, network),
        "eco": lambda: cmd_ecosystem(args, network),
        "laws": lambda: cmd_laws(args, network),
        "lawbook": lambda: cmd_lawbook(args, network),
        "desk": lambda: cmd_desk(args, network),
        "arena": lambda: cmd_arena(args, network),
        "nomos": lambda: cmd_nomos(args, network),
        "tools": lambda: cmd_tools(args, network),
        "report": lambda: cmd_report(args, network),
        "reports": lambda: cmd_reports(args, network),
        "company": lambda: cmd_company(args, network),
        "gas": lambda: cmd_gas(args, network),
        "agent": lambda: cmd_agent(args, network),
        "signals": lambda: cmd_signals(args, network),
        "signal": lambda: cmd_signals(args, network),
        "auto": lambda: cmd_auto(args, network),
        "intel": lambda: cmd_intel(args, network),
        "intelligence": lambda: cmd_intel(args, network),
        "hybrid": lambda: cmd_hybrid(args, network),
        "worker": lambda: cmd_hybrid(args, network),
        "workflow": lambda: cmd_workflow(args, network),
        "wf": lambda: cmd_workflow(args, network),
        "action": lambda: cmd_action(args, network),
        "doctrine": lambda: _out(True, [DOCTRINE]),
        "whoami": lambda: _out(
            True,
            [
                "Operator: sovereign owner (you)",
                "AI agent: sandbox twins only",
                "Terminal: THESIS commands only — not bash",
                "Keys: never loaded",
            ],
        ),
    }

    if cmd not in dispatch:
        result = _out(False, [f"unknown command: {cmd}", "type: help"])
    else:
        try:
            result = dispatch[cmd]()
        except Exception as exc:
            result = _out(False, [f"error: {exc}"])

    ms = (time.perf_counter() - t0) * 1000
    result["command"] = line
    result["elapsed_ms"] = round(ms, 2)
    result["network"] = network
    result["schema"] = "thesis.terminal.exec.v1"

    if record and cmd != "clear":
        _HISTORY.append(
            {
                "ts": time.time(),
                "command": line,
                "ok": result.get("ok"),
                "text": (result.get("text") or "")[:2000],
            }
        )
        while len(_HISTORY) > _MAX_HIST:
            _HISTORY.pop(0)
        seal(
            "terminal.exec",
            {"cmd": cmd, "ok": result.get("ok"), "ms": result["elapsed_ms"]},
        )
    return result


def _clear() -> Dict[str, Any]:
    _HISTORY.clear()
    return _out(True, ["(history cleared)"])


def terminal_banner(network: str = "monad-testnet") -> Dict[str, Any]:
    return {
        "schema": "thesis.terminal.v1",
        "product": "MonadBuilder Terminal",
        "version": __version__,
        "doctrine": DOCTRINE,
        "network": network,
        "sovereign": True,
        "system_shell": False,
        "real_keys": False,
        "commands": COMMANDS,
        "workflows": {k: v for k, v in WORKFLOWS.items()},
        "actions": ACTIONS,
        "history": _HISTORY[-40:],
        "hints": [
            "brief — daily brief",
            "vault — SovereignVault",
            "ecosystem — catalog",
            "workflow morning — tailored ops",
            "report pdf — full downloadable report",
            "arena — REJECT is a feature",
        ],
        "agent_access": "AI node: agent <msg> · tools report · same command surface",
        "docs": "docs/TERMINAL.md",
    }


def terminal_history(limit: int = 50) -> List[Dict[str, Any]]:
    return _HISTORY[-limit:]
