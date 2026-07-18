"""AI ecosystem node — DeFi/blockchain intelligence inside a sandbox.

The node is a **policy-bound agent** with tools limited to:
- read ecosystem catalog, marks, desk, gas coach
- operate on **digital twin** balances in sandbox
- propose desk tickets / academy guidance
- NEVER request or store real private keys
- NEVER broadcast chain txs without user promote path
"""

from __future__ import annotations

import json
import re
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .ecosystem import ecosystem_bundle
from .gas_intel import gas_coach
from .intelligence import coach
from .receipts import seal
from .sandbox import (
    SandboxMode,
    ensure_default_sandbox,
    get_sandbox,
    mutate_twin,
    sandbox_snapshot,
)
from .trading import desk_snapshot, load_desk, propose_ticket, TradeTicket

_ROOT = Path(__file__).resolve().parents[2]
_PATH = _ROOT / "receipts" / "ai_node.json"


class AIWallet(BaseModel):
    """Secure AI wallet — holds only inner digital twins, synced from user wallets."""

    wallet_id: str
    sandbox_id: str
    label: str = "THESIS AI Secure Wallet"
    created_at: float = 0.0
    # twins live in sandbox; this is the identity + policy shell
    allow_twin_spend: bool = True
    allow_chain_broadcast: bool = False  # hard default off
    max_twin_spend_per_turn: float = 100.0
    doctrine: List[str] = Field(
        default_factory=lambda: [
            "Inner tokens are digital twins of user coins",
            "Sync keeps twins mirrored until AI mutates (then mark dirty)",
            "Real wallet keys never loaded into this process",
            "Chain actions require user signature (promote)",
            "All AI trades run in sandbox technology",
        ]
    )


class AINode(BaseModel):
    node_id: str
    name: str = "THESIS Ecosystem Node"
    role: str = "defi_blockchain_node"
    sandbox_id: str
    ai_wallet: AIWallet
    memory: List[Dict[str, str]] = Field(default_factory=list)
    tools: List[str] = Field(
        default_factory=lambda: [
            "ecosystem.lookup",
            "gas.coach",
            "desk.pulse",
            "twin.balance",
            "twin.transfer_sim",
            "desk.propose_ticket",
            "coach.next",
            "sandbox.status",
            "terminal.exec",
            "report.full",
            "brief.daily",
            "vault.status",
            "workflow.run",
        ]
    )
    created_at: float = 0.0


def _load_node() -> Optional[AINode]:
    if _PATH.exists():
        try:
            raw = json.loads(_PATH.read_text(encoding="utf-8"))
            raw["ai_wallet"] = AIWallet(**raw["ai_wallet"])
            return AINode(**raw)
        except Exception:
            pass
    return None


def _save_node(node: AINode) -> None:
    _PATH.parent.mkdir(parents=True, exist_ok=True)
    _PATH.write_text(json.dumps(node.model_dump(mode="json"), indent=2), encoding="utf-8")


def ensure_ai_node() -> AINode:
    node = _load_node()
    if node:
        # rebind sandbox if missing
        if not get_sandbox(node.sandbox_id):
            sb = ensure_default_sandbox()
            node.sandbox_id = sb.sandbox_id
            node.ai_wallet.sandbox_id = sb.sandbox_id
            _save_node(node)
        return node
    sb = ensure_default_sandbox()
    sb.mode = SandboxMode.AGENT
    from .sandbox import save_sandbox

    wid = f"aiw-{uuid.uuid4().hex[:10]}"
    nid = f"node-{uuid.uuid4().hex[:10]}"
    sb.ai_node_id = nid
    save_sandbox(sb)
    wallet = AIWallet(
        wallet_id=wid,
        sandbox_id=sb.sandbox_id,
        created_at=time.time(),
    )
    node = AINode(
        node_id=nid,
        sandbox_id=sb.sandbox_id,
        ai_wallet=wallet,
        created_at=time.time(),
    )
    _save_node(node)
    seal("ai_node.create", {"node_id": nid, "sandbox_id": sb.sandbox_id, "wallet_id": wid})
    return node


def node_status() -> Dict[str, Any]:
    node = ensure_ai_node()
    sb = sandbox_snapshot(node.sandbox_id)
    return {
        "schema": "thesis.ai_node.v1",
        "node": node.model_dump(mode="json"),
        "sandbox": sb,
        "online": True,
        "capabilities": {
            "defi_routing": True,
            "ecosystem_knowledge": True,
            "twin_wallet": True,
            "real_key_access": False,
            "phantom_key_export": False,
            "sandbox_only_mutations": True,
        },
    }


def _remember(node: AINode, role: str, text: str) -> None:
    node.memory.append({"role": role, "text": text[:800], "ts": str(time.time())})
    node.memory = node.memory[-40:]
    _save_node(node)


def ai_chat(message: str, *, network: str = "monad-testnet") -> Dict[str, Any]:
    """Deterministic intelligent node (no external LLM required) with tool use."""
    node = ensure_ai_node()
    # AI node loads ecosystem laws at runtime (governance + safety)
    from .ecosystem_laws import embed_ecosystem_laws, enforce_on_department, laws_for_pillar

    eco = embed_ecosystem_laws()
    _remember(node, "user", message)
    low = (message or "").lower()
    actions: List[Dict[str, Any]] = []
    replies: List[str] = []
    actions.append(
        {
            "tool": "ecosystem_laws.load",
            "result": {
                "law_count": eco.get("law_count"),
                "domains": list((eco.get("domains") or {}).keys()),
            },
        }
    )

    # Tool routing
    if any(k in low for k in ("law", "laws", "governance", "ecosystem law")):
        safety = laws_for_pillar("safety")[:3]
        gov = laws_for_pillar("governance")[:2]
        actions.append({"tool": "ecosystem_laws.pillars", "result": {"safety": len(safety), "gov": len(gov)}})
        replies.append(
            f"**Law node:** {eco.get('law_count')} ecosystem laws embedded "
            f"(domains: {', '.join((eco.get('domains') or {}).keys())}). "
            f"Safety: {', '.join(x['id'] for x in safety)}. "
            f"Governance: {', '.join(x['id'] for x in gov)}. "
            f"{eco.get('doctrine')}"
        )

    if any(k in low for k in ("gas", "fee", "gwei", "overcharge")):
        g = gas_coach()
        actions.append({"tool": "gas.coach", "result": g["tip"]})
        replies.append(
            f"**Gas node:** {g['tip']['title']}. {g['tip']['body']} "
            f"({g['tip']['roommate']}) — ecosystem law `monad.gas-bills-limit`."
        )

    if any(k in low for k in ("wallet", "phantom", "metamask", "connect", "twin")):
        from .wallets import registry_snapshot

        w = registry_snapshot()
        actions.append({"tool": "wallet.registry", "result": {"n": len(w["links"])}})
        replies.append(
            f"**Wallet node:** {len(w['links'])} linked wallet(s). "
            "I only see public addresses + attested balances. "
            "I never load Phantom/MetaMask private keys. "
            "Say 'sync twins' after connecting to mirror into my secure AI wallet."
        )

    if "sync" in low and "twin" in low:
        from .wallets import sync_twins_from_wallets

        syn = sync_twins_from_wallets(node.sandbox_id)
        actions.append({"tool": "twin.sync", "result": syn})
        if syn.get("ok"):
            replies.append(
                f"**Twin sync:** mirrored {len(syn.get('synced') or [])} asset(s) into sandbox "
                f"`{node.sandbox_id}`. My AI wallet now holds digital twins only."
            )
        else:
            replies.append(f"**Twin sync failed:** {syn.get('error')}")

    if any(k in low for k in ("balance", "holdings", "twins", "ai wallet")):
        sb = get_sandbox(node.sandbox_id)
        twins = sb.twins if sb else {}
        actions.append({"tool": "twin.balance", "result": {k: v.amount for k, v in twins.items()}})
        if twins:
            lines = ", ".join(f"{k}={v.amount}" for k, v in twins.items())
            replies.append(f"**AI secure wallet (twins):** {lines}. Dirty twins need re-sync to re-mirror reality.")
        else:
            replies.append("**AI secure wallet empty.** Connect a wallet and sync twins first.")

    if any(k in low for k in ("trade", "swap", "buy", "sell", "desk")):
        # propose a small twin-aware paper ticket if twins exist
        sb = get_sandbox(node.sandbox_id)
        mon = (sb.twins.get("MON") or sb.twins.get("SOL") or None) if sb else None
        if mon and mon.amount > 0:
            spend = min(node.ai_wallet.max_twin_spend_per_turn, mon.amount * 0.1, mon.amount)
            try:
                mutate_twin(node.sandbox_id, mon.symbol, -spend, reason="ai_node simulated spend")
                actions.append({"tool": "twin.transfer_sim", "result": {"symbol": mon.symbol, "delta": -spend}})
                replies.append(
                    f"**Sandbox trade sim:** spent {spend} twin {mon.symbol} inside sandbox only. "
                    "No chain broadcast (allow_chain_broadcast=false)."
                )
            except Exception as exc:
                replies.append(f"**Sandbox trade blocked:** {exc}")
        desk = desk_snapshot()
        actions.append({"tool": "desk.pulse", "result": {"equity": desk.get("equity")}})
        replies.append(
            f"**Desk pulse:** equity {desk.get('equity')}, day PnL {desk.get('day_pnl')}. "
            "Use DESK tab for full arena / strategies."
        )

    if any(k in low for k in ("ecosystem", "token", "usdc", "protocol", "monad")):
        eco = ecosystem_bundle(network)
        actions.append({"tool": "ecosystem.lookup", "result": {"tokens": len(eco.get("tokens") or [])}})
        feat = (eco.get("tokens") or [{}])[0]
        replies.append(
            f"**Ecosystem node:** {len(eco.get('tokens') or [])} catalog assets. "
            f"Example: {feat.get('symbol')} {feat.get('name')} — verify on explorer, never invent addresses."
        )

    if any(k in low for k in ("what should", "help", "coach", "next", "daily")):
        c = coach(network)
        actions.append({"tool": "coach.next", "result": c.get("tips", [])[:2]})
        replies.append(f"**Coach:** {c.get('headline')}")
        for t in (c.get("tips") or [])[:2]:
            replies.append(f"- {t['title']}: {t['body']}")

    if any(k in low for k in ("brief", "morning", "seatbelt", "run my morning", "start my day")):
        if "run my morning" in low or "start my day" in low or low.strip() in ("morning", "run morning"):
            from .builder import run_morning

            m = run_morning(network)
            actions.append({"tool": "builder.morning", "result": {"ok": m.get("ok"), "streak": (m.get("stats") or {}).get("streak")}})
            replies.append(
                f"**{m.get('headline')}**\n{m.get('celebration')}\n"
                f"{m.get('brief_text') or m.get('ai_voice')}\n"
                "_(text only — no robot voice)_"
            )
            for s in m.get("steps") or []:
                replies.append(f"- {s.get('id')}: {s.get('detail')}")
        else:
            from .builder import daily_ai_brief

            b = daily_ai_brief(network)
            actions.append({"tool": "builder.brief", "result": {"mood": b.get("mood"), "streak": (b.get("stats") or {}).get("streak"), "tts": False}})
            replies.append(
                f"**MonadBuilder daily brief** (text only)\n"
                f"{b.get('brief_text') or b.get('ai_voice')}\n\n{b.get('celebration')}"
            )
            for a in (b.get("actions") or [])[:4]:
                replies.append(f"- {a.get('label')}: {a.get('why')}")

    if any(k in low for k in ("vault", "sovereignvault", "capital gate")):
        from .vault_route import _load_vault_address

        v = _load_vault_address()
        actions.append({"tool": "vault.status", "result": {"vault": v or None}})
        replies.append(
            f"**SovereignVault:** {v or 'not recorded yet'}. "
            "Policy-gated execute · simulation first · you sign. "
            "Open TERM → `vault` or DESK vault route after accept."
        )

    if any(k in low for k in ("report", "pdf", "download report", "full report")):
        from .reports import write_full_report

        rep = write_full_report(network, fmt="both")
        actions.append(
            {
                "tool": "report.full",
                "result": {
                    "pdf": (rep.get("download") or {}).get("pdf"),
                    "md": (rep.get("download") or {}).get("markdown"),
                },
            }
        )
        dl = rep.get("download") or {}
        replies.append(
            f"**Full report ready.** PDF: `{dl.get('pdf')}` · Markdown: `{dl.get('markdown')}`. "
            "Download from TERM / REPORTS — I cannot email keys or files with secrets."
        )

    if any(k in low for k in ("workflow", "terminal", "run morning")):
        from .terminal import exec_line

        wf = "workflow morning" if "morning" in low or "workflow" in low else "status"
        if "judge" in low:
            wf = "workflow judge"
        if "risk" in low:
            wf = "workflow risk"
        tr = exec_line(wf, network=network)
        actions.append({"tool": "workflow.run", "result": {"command": wf, "ok": tr.get("ok")}})
        replies.append(f"**Terminal workflow** `{wf}`:\n```\n{(tr.get('text') or '')[:1200]}\n```")

    if any(k in low for k in ("arena", "reject", "nomos")):
        from .terminal import exec_line

        cmd = "nomos" if "nomos" in low else "arena"
        tr = exec_line(cmd, network=network)
        actions.append({"tool": "terminal.exec", "result": {"command": cmd, "ok": tr.get("ok")}})
        replies.append(f"**{cmd}:**\n```\n{(tr.get('text') or '')[:900]}\n```")

    if any(k in low for k in ("signal", "alpha", "gorillionaire", "kisignal", "leaderboard")):
        from .signals import generate_signals

        s = generate_signals(network, n=6)
        actions.append({"tool": "signals.board", "result": {"n": s.get("n"), "top": (s.get("leaderboard") or [{}])[0]}})
        lines = [f"**Signals** ({s.get('n')}): {s.get('tagline')}"]
        for b in (s.get("leaderboard") or [])[:5]:
            lines.append(
                f"- #{b.get('rank')} {b.get('side')} {b.get('symbol')} score={b.get('score')} "
                f"{'AUTO' if b.get('auto') else ''}"
            )
        replies.append("\n".join(lines))

    if any(k in low for k in ("auto exec", "auto-exec", "auto loop", "auto trade", "paper fill", "run auto")):
        from .auto_exec import auto_loop

        loop = auto_loop(network)
        actions.append(
            {
                "tool": "auto_exec.loop",
                "result": {
                    "fills": (loop.get("signals") or {}).get("n_filled"),
                    "rejects": (loop.get("arena") or {}).get("n_rejected"),
                },
            }
        )
        replies.append(
            f"**Auto paper loop:** {loop.get('headline')}\n"
            f"Chain broadcast: false · Owner still signs for vault/mainnet.\n"
            f"Absorbs winner utility (signals→ticket→fill) under dual-stack brakes."
        )

    if any(k in low for k in ("intel pulse", "what now", "recommend")):
        from .auto_exec import intelligence_pulse

        p = intelligence_pulse(network)
        actions.append({"tool": "intelligence.pulse", "result": {"rec": p.get("recommendation")}})
        replies.append(
            f"**Intelligence:** {p.get('headline')}\n"
            f"Recommendation: `{p.get('recommendation')}`\n"
            f"{p.get('brief')}"
        )

    if not replies:
        replies.append(
            "**MonadBuilder AI online** (sandbox mode · THESIS engine). "
            "I deliver your day: *daily brief*, *run my morning*, rejects, signals, auto paper loop, PDF reports. "
            "Open **BUILDER** or **TERM**. I never hold keys or silent-broadcast. "
            "Try: *run my morning* · *daily brief* · *show a reject* · *auto exec*."
        )

    text = "\n\n".join(replies)
    _remember(node, "assistant", text)
    seal(
        "ai_node.chat",
        {"node_id": node.node_id, "tools": [a["tool"] for a in actions], "n": len(actions)},
    )
    return {
        "schema": "thesis.ai_node.chat.v1",
        "node_id": node.node_id,
        "sandbox_id": node.sandbox_id,
        "ai_wallet_id": node.ai_wallet.wallet_id,
        "answer": text,
        "actions": actions,
        "memory_len": len(node.memory),
        "safety": {
            "sandbox": True,
            "real_keys": False,
            "chain_broadcast": node.ai_wallet.allow_chain_broadcast,
        },
    }


def promote_request(symbol: str, amount: float) -> Dict[str, Any]:
    """Create a user-facing promote intent — never auto-broadcasts."""
    node = ensure_ai_node()
    sb = get_sandbox(node.sandbox_id)
    twin = sb.twins.get(symbol.upper()) if sb else None
    if not twin or twin.amount < amount:
        return {"ok": False, "error": "insufficient twin balance for promote request"}
    intent = {
        "type": "user_signature_required",
        "from_sandbox": node.sandbox_id,
        "symbol": symbol.upper(),
        "amount": amount,
        "twin_of": twin.twin_of,
        "message": (
            "AI requests promote of twin → real chain. "
            "Sign in your Phantom/MetaMask UI; backend will not hold the key."
        ),
    }
    seal("ai_node.promote_request", intent)
    return {"ok": True, "intent": intent, "status": "awaiting_user_signature"}
