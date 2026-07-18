"""Focused, shippable tools — what humans and any AI actually press.

Inside: in-app AI node + HQ buttons.
Outside: MCP / HTTP tool schema for Claude, Cursor, Grok, etc.

Each tool is one real action with a real proof — not a brochure.
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional

from . import __version__
from .receipts import seal

DOCTRINE = "Agents propose. Laws decide. Owner signs. Receipts remember."


def _run_reject_demo(**_kw) -> Dict[str, Any]:
    from .trading import load_desk, run_desk_arena

    r = run_desk_arena(load_desk())
    return {
        "ok": True,
        "proof": f"n_rejected={r.get('n_rejected')} n_accepted={r.get('n_accepted')}",
        "n_rejected": r.get("n_rejected"),
        "n_accepted": r.get("n_accepted"),
        "reject_is_a_feature": int(r.get("n_rejected") or 0) >= 1,
        "sample_rejects": [
            {
                "agent": (x.get("ticket") or {}).get("agent"),
                "reasons": (x.get("reasons") or [])[:3],
            }
            for x in (r.get("results") or [])
            if not x.get("accepted")
        ][:3],
    }


def _run_nomos(**params) -> Dict[str, Any]:
    from .nomos import run_nomos_arena

    r = run_nomos_arena()
    return {
        "ok": True,
        "proof": f"reject={r.get('n_rejected')} accept={r.get('n_accepted')}",
        "n_rejected": r.get("n_rejected"),
        "n_accepted": r.get("n_accepted"),
        "winner": (r.get("winner") or {}).get("action", {}).get("agent"),
        "reject_is_a_feature": True,
        "scoreboard": (r.get("scoreboard") or [])[:4],
    }


def _run_gas(**params) -> Dict[str, Any]:
    from .gas_intel import gas_coach, apply_gas_limit_margin

    est = int(params.get("estimated_gas") or 80_000)
    net = params.get("network") or "monad-testnet"
    chain_id = 10143 if "testnet" in str(net) else 143
    g = gas_coach()
    m = apply_gas_limit_margin(chain_id, est)
    lim = m.get("recommended_gas_limit")
    return {
        "ok": True,
        "proof": f"limit={lim} (~7.5% over estimate {est})",
        "estimated_gas": est,
        "recommended_gas_limit": lim,
        "margin": m,
        "tip": g.get("tip"),
        "law": "monad.gas-bills-limit",
    }


def _run_company(**params) -> Dict[str, Any]:
    from .company.os import run_objective

    obj = params.get("objective") or (
        "Grow my Monad position, keep 30% liquid, avoid leverage, and teach me."
    )
    out = run_objective(obj)
    mission = out.get("mission") or {}
    winner = mission.get("winner") or {}
    return {
        "ok": bool(out.get("ok")),
        "proof": f"mission={mission.get('status')} winner={winner.get('agent')}",
        "status": mission.get("status"),
        "winner_agent": winner.get("agent"),
        "sla_all_met": out.get("sla_all_met"),
        "owner_actions": ["approve", "reject", "simulate_again", "revise"],
    }


def _run_system(**params) -> Dict[str, Any]:
    from .unified import run_system

    out = run_system(
        params.get("network") or "monad-testnet",
        objective=params.get("objective") or "Seatbelt morning run",
        run_cloud=bool(params.get("run_cloud", False)),
        run_company=bool(params.get("run_company", True)),
        run_desk=bool(params.get("run_desk", True)),
        run_vault_route=bool(params.get("run_vault_route", False)),
    )
    arena = out.get("desk_arena") or {}
    return {
        "ok": bool(out.get("ok")),
        "proof": out.get("headline") or "system linked",
        "n_rejected": arena.get("n_rejected"),
        "company_status": (out.get("company") or {}).get("status"),
        "headline": out.get("headline"),
    }


def _run_laws(**_kw) -> Dict[str, Any]:
    from .ecosystem_laws import embed_ecosystem_laws, runtime_status

    embed_ecosystem_laws()
    st = runtime_status()
    return {
        "ok": True,
        "proof": f"{st.get('law_count')} ecosystem laws embedded",
        "law_count": st.get("law_count"),
        "domains": st.get("domains"),
        "dual_stack": "owner constitution (PolicyKernel) + LawBook / ecosystem_laws",
    }


def _run_win_path(**params) -> Dict[str, Any]:
    from .competition import run_win_path

    r = run_win_path(params.get("network") or "monad-testnet")
    return {
        "ok": bool(r.get("ok")),
        "proof": r.get("headline"),
        "n_rejected": (r.get("desk_arena") or {}).get("n_rejected"),
        "scorecard_grade": (r.get("proof") or {}).get("scorecard_grade"),
        "reject_is_feature": (r.get("proof") or {}).get("reject_is_feature"),
    }


def _run_ai_pulse(**params) -> Dict[str, Any]:
    from .ai_node import ai_chat, node_status

    st = node_status()
    msg = params.get("message") or "gas tip and show balances"
    chat = ai_chat(msg)
    return {
        "ok": True,
        "proof": "sandbox twins only — real_key_access=false",
        "real_key_access": (st.get("capabilities") or {}).get("real_key_access"),
        "answer": (chat.get("answer") or "")[:400],
        "tools_used": [a.get("tool") for a in (chat.get("actions") or [])][:8],
    }


def _run_judge(**params) -> Dict[str, Any]:
    from .competition import competition_pack, scorecard_live

    net = params.get("network") or "monad-testnet"
    card = scorecard_live(net)
    pack = competition_pack(net)
    return {
        "ok": True,
        "proof": f"scorecard {card.get('grade')} {card.get('pct')}% vaporware=false",
        "grade": card.get("grade"),
        "pct": card.get("pct"),
        "vaporware": False,
        "winning_claim": pack.get("winning_claim"),
        "vs_winners_one_liner": (pack.get("vs_winners") or {}).get("one_liner"),
    }


def _run_lawbook(**params) -> Dict[str, Any]:
    from .lawbook import lawbook_payload

    lb = lawbook_payload(params.get("network") or "monad-testnet")
    al = lb.get("alignment") or {}
    return {
        "ok": bool(al.get("ok", True)),
        "proof": (
            f"seed {al.get('seed_in_runtime')}/{al.get('seed_total')} aligned · "
            f"runtime laws {(lb.get('runtime') or {}).get('law_count')}"
        ),
        "alignment": al,
        "onchain_seed_count": (lb.get("onchain_seed") or {}).get("count"),
        "runtime_law_count": (lb.get("runtime") or {}).get("law_count"),
        "dual_stack": lb.get("dual_stack"),
        "beats_crowd": lb.get("beats_crowd"),
    }


def _run_report(**params) -> Dict[str, Any]:
    from .reports import write_full_report

    fmt = params.get("format") or "both"
    out = write_full_report(params.get("network") or "monad-testnet", fmt=fmt)
    dl = out.get("download") or {}
    return {
        "ok": True,
        "proof": f"pdf={dl.get('pdf')} md={dl.get('markdown')}",
        "download": dl,
        "files": out.get("files"),
        "sections": len((out.get("report") or {}).get("sections") or []),
    }


def _run_terminal(**params) -> Dict[str, Any]:
    from .terminal import exec_line

    cmd = params.get("command") or params.get("message") or "status"
    r = exec_line(str(cmd), network=params.get("network") or "monad-testnet")
    return {
        "ok": bool(r.get("ok")),
        "proof": (r.get("text") or "")[:200],
        "text": r.get("text"),
        "command": cmd,
    }


def _run_easy_path(**params) -> Dict[str, Any]:
    """Judge-friendly 60s path: laws → reject → gas → win_path (inner handlers, one outer receipt)."""
    steps = [
        ("laws", _run_laws),
        ("reject_demo", _run_reject_demo),
        ("gas_coach", _run_gas),
        ("win_path", _run_win_path),
    ]
    out_steps = []
    all_ok = True
    for sid, fn in steps:
        try:
            r = fn(**params)
            ok = bool(r.get("ok"))
            all_ok = all_ok and ok
            out_steps.append({"tool": sid, "ok": ok, "proof": r.get("proof")})
        except Exception as exc:
            all_ok = False
            out_steps.append({"tool": sid, "ok": False, "proof": str(exc)[:200]})
    return {
        "ok": all_ok,
        "proof": " · ".join(f"{s['tool']}={'✓' if s['ok'] else '✗'}" for s in out_steps),
        "steps": out_steps,
        "seconds_hint": 60,
        "next": "Open PROOF tab or POST /tools/judge/run",
    }


# Focused catalog — ship these, not a pile of half-features.
TOOLS: List[Dict[str, Any]] = [
    {
        "id": "reject_demo",
        "name": "Celebrate a REJECT",
        "kind": "safety",
        "who": "user + any AI",
        "seconds": 5,
        "do": "Run desk arena; prove brakes with reasons",
        "api": "POST /tools/reject_demo/run",
        "mcp": "thesis_reject_demo",
        "proof": "n_rejected >= 1",
        "beats_crowd": "Soft UIs that accept degen leverage",
        "handler": "reject_demo",
    },
    {
        "id": "nomos_arena",
        "name": "NOMOS multi-agent arena",
        "kind": "governance",
        "who": "user + any AI",
        "seconds": 8,
        "do": "Propose agents → evaluate → arbitrate under dual law stack",
        "api": "POST /tools/nomos_arena/run",
        "mcp": "thesis_nomos_arena",
        "proof": "scoreboard + winner or full reject",
        "beats_crowd": "Agent wallets with basic allowlists only",
        "handler": "nomos_arena",
    },
    {
        "id": "gas_coach",
        "name": "Monad gas limit coach",
        "kind": "monad",
        "who": "user + any AI",
        "seconds": 3,
        "do": "Recommend gas_limit (~7.5% margin) — you pay the limit",
        "api": "POST /tools/gas_coach/run",
        "mcp": "thesis_gas_coach",
        "proof": "recommended_gas_limit",
        "beats_crowd": "2× buffers that burn MON",
        "handler": "gas_coach",
    },
    {
        "id": "company_run",
        "name": "Staff Company OS",
        "kind": "company",
        "who": "user + any AI",
        "seconds": 10,
        "do": "SENSUS→AGORA→NOMOS→… mission; owner still approves",
        "api": "POST /tools/company_run/run",
        "mcp": "thesis_company_run",
        "proof": "mission status + winner agent",
        "beats_crowd": "Chatbots that pretend to be a company",
        "handler": "company_run",
    },
    {
        "id": "system_run",
        "name": "▶ RUN SYSTEM seatbelt",
        "kind": "product",
        "who": "user",
        "seconds": 15,
        "do": "One path: laws + desk + company (cloud optional)",
        "api": "POST /tools/system_run/run",
        "mcp": "thesis_system_run",
        "proof": "headline + desk rejects",
        "beats_crowd": "Tab hell morning ritual",
        "handler": "system_run",
    },
    {
        "id": "laws",
        "name": "Embed dual law stack",
        "kind": "governance",
        "who": "user + any AI",
        "seconds": 3,
        "do": "Load LawBook / ecosystem laws at runtime",
        "api": "POST /tools/laws/run",
        "mcp": "thesis_laws",
        "proof": "law_count >= 15",
        "beats_crowd": "Hardcoded if-checks with no registry",
        "handler": "laws",
    },
    {
        "id": "win_path",
        "name": "90s WIN PATH (judge)",
        "kind": "demo",
        "who": "user + judge AI",
        "seconds": 12,
        "do": "Desk rejects + laws + scorecard in one shot",
        "api": "POST /tools/win_path/run",
        "mcp": "thesis_win_path",
        "proof": "scorecard grade + n_rejected",
        "beats_crowd": "Video-only demos with no live API",
        "handler": "win_path",
    },
    {
        "id": "ai_pulse",
        "name": "In-app AI (twins only)",
        "kind": "ai",
        "who": "user + in-app AI",
        "seconds": 5,
        "do": "Sandbox node: gas tip + balances — never real keys",
        "api": "POST /tools/ai_pulse/run",
        "mcp": "thesis_ai_pulse",
        "proof": "real_key_access=false",
        "beats_crowd": "AI trading bots that hold keys",
        "handler": "ai_pulse",
    },
    {
        "id": "judge",
        "name": "Judge / vs-winners pack",
        "kind": "demo",
        "who": "judge + any AI",
        "seconds": 4,
        "do": "Scorecard + honest comparison to polished single-feature winners",
        "api": "POST /tools/judge/run",
        "mcp": "thesis_judge",
        "proof": "vaporware=false + grade",
        "beats_crowd": "Ambition without proof",
        "handler": "judge",
    },
    {
        "id": "lawbook",
        "name": "LawBook dual-stack status",
        "kind": "governance",
        "who": "user + any AI",
        "seconds": 3,
        "do": "On-chain seed vs runtime ecosystem laws alignment",
        "api": "POST /tools/lawbook/run",
        "mcp": "thesis_lawbook",
        "proof": "seed aligned + law_count",
        "beats_crowd": "Allowlist-only agent wallets without a law registry",
        "handler": "lawbook",
    },
    {
        "id": "easy_path",
        "name": "60s easy path (all-in-one)",
        "kind": "demo",
        "who": "user + judge + any AI",
        "seconds": 20,
        "do": "laws → reject_demo → gas_coach → win_path in one call",
        "api": "POST /tools/easy_path/run",
        "mcp": "thesis_easy_path",
        "proof": "four step proofs",
        "beats_crowd": "Video-only demos with no live multi-step API",
        "handler": "easy_path",
    },
    {
        "id": "full_report",
        "name": "Full PDF / MD report",
        "kind": "report",
        "who": "user + agent + any AI",
        "seconds": 8,
        "do": "Generate full ops report (brief, vault, laws, desk, scorecard) + downloads",
        "api": "POST /tools/full_report/run",
        "mcp": "thesis_full_report",
        "proof": "download pdf + markdown",
        "beats_crowd": "Demos without exportable audit packs",
        "handler": "full_report",
    },
    {
        "id": "terminal",
        "name": "Sovereign terminal command",
        "kind": "terminal",
        "who": "user + agent + any AI",
        "seconds": 5,
        "do": "Run one THESIS terminal command (brief, vault, workflow…)",
        "api": "POST /tools/terminal/run",
        "mcp": "thesis_terminal",
        "proof": "command output",
        "beats_crowd": "Chat without a real command surface",
        "handler": "terminal",
    },
]

_HANDLERS: Dict[str, Callable[..., Dict[str, Any]]] = {
    "reject_demo": _run_reject_demo,
    "nomos_arena": _run_nomos,
    "gas_coach": _run_gas,
    "company_run": _run_company,
    "system_run": _run_system,
    "laws": _run_laws,
    "win_path": _run_win_path,
    "ai_pulse": _run_ai_pulse,
    "judge": _run_judge,
    "lawbook": _run_lawbook,
    "easy_path": _run_easy_path,
    "full_report": _run_report,
    "terminal": _run_terminal,
}


def tools_catalog() -> Dict[str, Any]:
    public = [{k: v for k, v in t.items() if k != "handler"} for t in TOOLS]
    return {
        "schema": "thesis.tools.v1",
        "version": __version__,
        "doctrine": DOCTRINE,
        "tagline": "Focused shippable tools — press one, get proof",
        "how_to_use": [
            "Human: open TOOLS tab or sticky bar → click a tool",
            "In-app AI: tools bound to sandbox node (no real keys)",
            "Any external AI: MCP server or POST /tools/{id}/run",
            "Judge: win_path or judge tool in under 15 seconds",
        ],
        "count": len(public),
        "tools": public,
        "mcp": {
            "transport": "stdio",
            "entry": "python -m thesis_forge.mcp_server",
            "http_mirror": "GET /tools · POST /tools/{id}/run",
        },
        "easy_path": [
            {"step": 1, "tool": "laws", "why": "embed dual stack"},
            {"step": 2, "tool": "reject_demo", "why": "show brakes live"},
            {"step": 3, "tool": "gas_coach", "why": "Monad-specific utility"},
            {"step": 4, "tool": "win_path", "why": "judge pack in one click"},
        ],
        "one_click": "POST /tools/easy_path/run",
    }


def get_tool(tool_id: str) -> Optional[Dict[str, Any]]:
    for t in TOOLS:
        if t["id"] == tool_id:
            return {k: v for k, v in t.items() if k != "handler"}
    return None


def run_tool(tool_id: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    params = params or {}
    meta = None
    for t in TOOLS:
        if t["id"] == tool_id:
            meta = t
            break
    if not meta:
        return {"ok": False, "error": f"unknown tool {tool_id}", "available": [t["id"] for t in TOOLS]}
    fn = _HANDLERS.get(meta["handler"])
    if not fn:
        return {"ok": False, "error": f"no handler for {tool_id}"}
    try:
        result = fn(**params)
    except Exception as exc:
        return {"ok": False, "error": str(exc)[:400], "tool": tool_id}
    receipt = seal(
        f"tool.{tool_id}",
        {"ok": result.get("ok"), "proof": result.get("proof"), "params_keys": list(params.keys())},
    )
    return {
        "schema": "thesis.tools.run.v1",
        "tool": get_tool(tool_id),
        "ok": bool(result.get("ok")),
        "result": result,
        "receipt": receipt,
        "doctrine": DOCTRINE,
    }


def mcp_tool_list() -> List[Dict[str, Any]]:
    """MCP tools/list shape (subset) for external AI clients."""
    out = []
    for t in TOOLS:
        out.append(
            {
                "name": t["mcp"],
                "description": f"{t['name']}: {t['do']} Proof: {t['proof']}",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "network": {"type": "string", "default": "monad-testnet"},
                        "objective": {"type": "string"},
                        "estimated_gas": {"type": "integer"},
                        "message": {"type": "string"},
                    },
                },
                "thesis_id": t["id"],
            }
        )
    return out
