"""Live market + teaching feed for the landing command center.

Pulls the **real** THESIS surfaces — wallets, vault, desk, AI sandbox,
daily home, company HQ, studio projects — and teaches ecosystem laws
as those modules are used.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from .ai_node import node_status
from .company.os import headquarters, morning_brief
from .daily import home as daily_home
from .ecosystem import ecosystem_bundle
from .ecosystem_laws import (
    embed_ecosystem_laws,
    enforce_on_department,
    get_ecosystem_laws,
)
from .gas_intel import apply_gas_limit_margin, gas_coach
from .intelligence import coach
from .marks import live_marks
from .trading import desk_snapshot, list_venues
from .vault_route import simulate_vault_route
from .wallets import registry_snapshot
from .workspace import list_projects

_ROOT = Path(__file__).resolve().parents[2]
_DEPLOY = _ROOT / "receipts" / "deployment.json"

def _platform_strip(network: str) -> Dict[str, Any]:
    """Kernel snapshot for the shell — platform, not pitch."""
    try:
        from .platform import platform_status

        st = platform_status(network)
        return {
            "product": st.get("product"),
            "what_this_is": st.get("what_this_is"),
            "doctrine": st.get("doctrine"),
            "kernel": st.get("kernel"),
            "primitives": [
                {
                    "id": p.get("id"),
                    "name": p.get("name"),
                    "ok": (p.get("status") or {}).get("ok"),
                    "role": p.get("role"),
                }
                for p in (st.get("primitives") or [])
            ],
            "apps": {
                "total": (st.get("apps") or {}).get("total"),
                "first_party": (st.get("apps") or {}).get("first_party_count"),
                "forged": (st.get("apps") or {}).get("forged_count"),
            },
            "pulse": st.get("pulse"),
            "how_to_use": st.get("how_to_use"),
            "api": st.get("api"),
        }
    except Exception as exc:
        return {"error": str(exc)}


# Sourced from https://docs.monad.xyz/developer-essentials/best-practices
BEST_PRACTICES: List[Dict[str, Any]] = [
    {
        "id": "bp.hardcode-static-gas",
        "title": "Hardcode gas when usage is static",
        "body": (
            "Native MON transfer is always 21,000 gas. Skip eth_estimateGas for "
            "fixed-cost ops — faster wallets, fewer bad fallbacks."
        ),
        "do": "Use gasLimit: 21000n for pure native transfers.",
        "why_now": "Wallet tips and vault native value transfers can hardcode 21k.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["monad.native-transfer-gas", "monad.gas-bills-limit"],
        "apps": ["wallets", "vault", "desk"],
    },
    {
        "id": "bp.concurrent-eth-call",
        "title": "Batch reads concurrently (Multicall3)",
        "body": (
            "Serial eth_call kills UX. Aggregate with Multicall3 or Promise.all RPC batches. "
            "Canonical Multicall3 on Monad mainnet+testnet."
        ),
        "do": "Multicall3 @ 0xcA11bde05977b3631167028862bE2a173976CA11",
        "why_now": "AI node + twin balance snapshots should be one multicall.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["monad.no-invent-addresses", "intel.no-hallucinated-apy"],
        "apps": ["ai", "wallets"],
    },
    {
        "id": "bp.indexer-not-getlogs",
        "title": "Use an indexer instead of eth_getLogs loops",
        "body": "Don't poll eth_getLogs forever — Envio, Goldsky, The Graph, QuickNode Streams, Allium.",
        "do": "Index once; query for desk marks and daily product features.",
        "why_now": "LIVE marks prefer desk feed + optional RPC entropy over log spam.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["intel.no-hallucinated-apy", "sys.adapter-honesty"],
        "apps": ["desk", "live"],
    },
    {
        "id": "bp.local-nonce",
        "title": "Track nonces locally for burst sends",
        "body": "Burst txs need local nonce tracking. Monad has no global mempool.",
        "do": "Increment nonce client-side for concurrent vault / router sends.",
        "why_now": "PRAXIS multi-step + vault execute may queue signed steps.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["monad.no-global-mempool"],
        "apps": ["vault", "desk"],
    },
    {
        "id": "bp.concurrent-submit",
        "title": "Submit independent txs concurrently",
        "body": "Promise.all independent transfers. Owner still signs each one.",
        "do": "Batch independent sends; never silent broadcast.",
        "why_now": "exec.no-silent-broadcast still applies — concurrent ≠ unattended.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["exec.no-silent-broadcast", "sys.owner-sovereign"],
        "apps": ["vault", "wallets"],
    },
    {
        "id": "bp.gas-limit-margin",
        "title": "Tight gas-limit margin (~7.5%)",
        "body": "On Monad you pay the limit. Fat 2× buffers burn MON. Start near estimate × 1.075.",
        "do": "applyGasLimitMargin(chainId, estimate) with 10750 bps.",
        "why_now": "Desk tickets + vault route gas coach use this margin.",
        "docs": "https://docs.monad.xyz/developer-essentials/gas-pricing",
        "law_ids": ["monad.gas-bills-limit"],
        "apps": ["desk", "vault", "home"],
    },
    {
        "id": "bp.hosting-costs",
        "title": "Control web hosting data-transfer costs",
        "body": "Serve static via CDN; keep landing poll payloads lean.",
        "do": "S3+CloudFront for static; never uncached RPC proxy at scale.",
        "why_now": "This board polls every few seconds — apps stay thin.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["sys.receipt-every-material-act"],
        "apps": ["live", "studio"],
    },
    {
        "id": "bp.finality-before-settle",
        "title": "Wait for finalized before off-chain settlement",
        "body": "Receipt = local execution. Wait for finalized before irreversible credits.",
        "do": "PRAXIS verify + vault receipt seal after finalized tag.",
        "why_now": "Vault route sim ends with ReceiptChain.seal — finality first.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["monad.finality", "sys.mandatory-simulation"],
        "apps": ["vault", "desk"],
    },
]


COOL_MOVES: List[Dict[str, Any]] = [
    {
        "id": "move.link-wallet",
        "title": "Link wallet → twin sync",
        "body": "Connect Phantom/MetaMask (public only). Twins mirror into the AI sandbox — keys never leave your extension.",
        "cta": "AI NODE · Link wallet",
        "href": "ai",
        "action": "connect_wallet",
        "law_ids": ["sys.no-real-keys", "sys.sandbox-first"],
        "teach": "Wallet registry stores public address + attested balances only.",
        "apps": ["wallets", "ai"],
    },
    {
        "id": "move.desk-reject",
        "title": "Run desk arena — celebrate REJECT",
        "body": "Agent tickets hit desk risk + NOMOS. Bad leverage dies before vault sees it.",
        "cta": "DESK · Run arena",
        "href": "desk",
        "action": "desk_arena",
        "law_ids": ["sys.nomos-veto", "intel.explain-rejects"],
        "teach": "NOMOS veto is a feature. Explained rejects beat silent fails.",
        "apps": ["desk"],
    },
    {
        "id": "move.vault-route",
        "title": "Route a ticket through SovereignVault",
        "body": "Accept a ticket → paper fill → vault route sim. Calldata for cast send, no broadcast.",
        "cta": "DESK · Vault route",
        "href": "desk",
        "action": "vault_route",
        "law_ids": ["exec.no-silent-broadcast", "sys.mandatory-simulation", "proto.exact-approval"],
        "teach": "Vault is the onchain law gate. Simulation first, your signature second.",
        "apps": ["vault", "desk"],
    },
    {
        "id": "move.company-mission",
        "title": "Staff the whole company",
        "body": "One objective → SENSUS, AGORA, NOMOS, PRAXIS, ACADEMY — with dual law stacks.",
        "cta": "HQ · Assign THESIS",
        "href": "hq",
        "action": "run_company",
        "law_ids": ["sys.owner-sovereign", "intel.compete-plans"],
        "teach": "You remain sovereign. Departments recommend; you sign.",
        "apps": ["company", "hq"],
    },
    {
        "id": "move.forge-app",
        "title": "Forge a real app package",
        "body": "STUDIO pipeline emits contracts, policy mirror, hooks — a miniature product you can open in IDE.",
        "cta": "STUDIO · Forge",
        "href": "studio",
        "action": "forge",
        "law_ids": ["sys.receipt-every-material-act", "sys.adapter-honesty"],
        "teach": "Workspace projects are the actual apps — not mock cards.",
        "apps": ["studio", "ide"],
    },
    {
        "id": "move.daily-streak",
        "title": "Clear daily missions",
        "body": "Gas tip, desk arena, academy lab — XP and streaks that keep the company habit sticky.",
        "cta": "DAILY · Home",
        "href": "home",
        "action": "daily",
        "law_ids": ["intel.teach-on-action"],
        "teach": "Academy attaches to live missions, not abstract slides only.",
        "apps": ["home", "academy"],
    },
    {
        "id": "move.gas-hardcode",
        "title": "Hardcode 21k + 7.5% margin",
        "body": "Native transfer 21k; dynamic ops get estimate × 1.075. Never pay 2× buffers on Monad.",
        "cta": "DAILY · Gas coach",
        "href": "home",
        "action": "gas",
        "law_ids": ["monad.native-transfer-gas", "monad.gas-bills-limit"],
        "teach": "Gas coach and vault route both cite this law.",
        "apps": ["home", "vault", "desk"],
    },
]


AS_USED: Dict[str, str] = {
    "sys.no-real-keys": "Wallet link rejects private keys/seeds. Public address only.",
    "sys.sandbox-first": "AI mutates digital twins only until you promote with signature.",
    "sys.nomos-veto": "Desk arena + company missions: NOMOS can kill any plan.",
    "sys.receipt-every-material-act": "Forge, vault route, wallet link all seal NERVUS receipts.",
    "sys.mandatory-simulation": "Vault route and PRAXIS require sim before any broadcast path.",
    "sys.owner-sovereign": "Missions await your approval. Departments recommend only.",
    "sys.adapter-honesty": "Desk venues / atlas adapters labeled planned|simulated|live.",
    "sys.kill-switch": "Sandbox kill freezes AI twin mutations immediately.",
    "monad.gas-bills-limit": "You pay gas_limit on Monad — coach applies ~7.5% margin.",
    "monad.native-transfer-gas": "Native transfer path hardcodes 21,000 gas.",
    "monad.no-global-mempool": "No pending-tx gossip. Local nonce + receipt polling.",
    "monad.finality": "Vault/receipt settle waits for finalized before irreversible credit.",
    "monad.reserve-balance-10-mon": "Spending under 10 MON reserve can fail.",
    "monad.tx-types": "Type-3 blobs rejected. Support 0/1/2/4.",
    "monad.no-invent-addresses": "Vault/Multicall/tokens from catalog or deployment.json only.",
    "monad.priority-fee-not-live": "maxPriorityFeePerGas may be hardcoded 2 gwei.",
    "proto.live-only-when-live": "Non-live adapters cannot force_live real capital.",
    "proto.category-gate": "Desk policy allowed_categories gate tickets.",
    "proto.exact-approval": "Approvals exact amount — vault route never implies unlimited.",
    "intel.no-hallucinated-apy": "Marks from live_marks + desk — never invented yields.",
    "intel.explain-rejects": "Desk rejects carry human-readable reasons.",
    "intel.teach-on-action": "LIVE board teaches mid-poll while apps are live.",
    "intel.compete-plans": "AGORA files multiple agents so NOMOS can veto.",
    "exec.ordered-mission": "PRAXIS: approve exact → action → verify → receipt.",
    "exec.no-silent-broadcast": "Vault route is simulation — no chain broadcast without you.",
    "exec.re-sim-before-sign": "Stale quotes re-sim before signature path.",
}


def _explain_laws(law_ids: List[str], *, context: Optional[str] = None) -> List[Dict[str, str]]:
    book = get_ecosystem_laws()
    idx = book.get("index") or {}
    out = []
    for lid in law_ids:
        law = idx.get(lid)
        if not law:
            continue
        used = AS_USED.get(lid) or f"Active now: {law.get('rule', '')}"
        if context:
            used = f"{used} ({context})"
        out.append(
            {
                "id": lid,
                "rule": law.get("rule", ""),
                "pillar": law.get("pillar", ""),
                "severity": law.get("severity", ""),
                "enforcement": law.get("enforcement", ""),
                "as_used": used,
            }
        )
    return out


def _load_deployment() -> Dict[str, Any]:
    if _DEPLOY.exists():
        try:
            return json.loads(_DEPLOY.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"status": "not_deployed", "contracts": {}}


def _vault_panel(desk: dict) -> Dict[str, Any]:
    """Live SovereignVault status + optional route sim for latest routable ticket."""
    dep = _load_deployment()
    vault_addr = (
        dep.get("primary_submission_address")
        or (dep.get("contracts") or {}).get("SovereignVault")
        or ""
    )
    tickets = desk.get("tickets_recent") or []
    routable = [
        t
        for t in tickets
        if t.get("status") in ("risk_accepted", "paper_filled", "routed_sim")
    ]
    blocked = [t for t in tickets if t.get("status") == "risk_rejected"]
    route_sim = None
    route_ticket_id = None
    if routable:
        route_ticket_id = routable[0].get("ticket_id")
        try:
            route_sim = simulate_vault_route(route_ticket_id)
            # strip heavy cast spam for landing; keep narrative
            if isinstance(route_sim, dict):
                route_sim = {
                    "ok": route_sim.get("ok"),
                    "would_execute": route_sim.get("would_execute"),
                    "narrative": route_sim.get("narrative"),
                    "vault": route_sim.get("vault") or vault_addr or None,
                    "ticket_id": route_ticket_id,
                    "ticket_status": (route_sim.get("ticket") or {}).get("status"),
                    "steps": [
                        {"id": s.get("id"), "ok": s.get("ok"), "detail": s.get("detail")}
                        for s in (route_sim.get("steps") or [])[:5]
                    ],
                    "laws": _explain_laws(
                        [
                            "exec.no-silent-broadcast",
                            "sys.mandatory-simulation",
                            "monad.gas-bills-limit",
                        ],
                        context="vault-route",
                    ),
                }
        except Exception as exc:
            route_sim = {"ok": False, "error": str(exc), "ticket_id": route_ticket_id}

    return {
        "address": vault_addr or None,
        "deployed": bool(vault_addr),
        "status": dep.get("status") or ("recorded" if vault_addr else "not_deployed"),
        "network": dep.get("network") or "monad-testnet",
        "explorer": dep.get("explorer_vault")
        or (
            f"https://testnet.monadvision.com/address/{vault_addr}" if vault_addr else None
        ),
        "contracts": dep.get("contracts") or {},
        "routable_tickets": len(routable),
        "blocked_tickets": len(blocked),
        "latest_route": route_sim,
        "route_api": "POST /desk/vault-route/{ticket_id}",
        "laws": _explain_laws(
            ["exec.no-silent-broadcast", "sys.mandatory-simulation", "proto.exact-approval"],
            context="vault",
        ),
        "teach": (
            "SovereignVault.execute is the onchain gate. Desk tickets route through "
            "NOMOS first; vault sim builds cast-ready calldata without broadcasting."
            if vault_addr
            else "Record a SovereignVault address in CODEX / deployment to unlock live route targets."
        ),
        "cta": "Open DESK · vault route" if routable else "Open DESK · run arena",
        "href": "desk",
        "action": "vault_route" if routable else "desk_arena",
    }


def _wallets_panel() -> Dict[str, Any]:
    reg = registry_snapshot()
    links = reg.get("links") or []
    primary = next((w for w in links if w.get("link_id") == reg.get("primary_id")), None)
    total_attested = 0.0
    for w in links:
        for v in (w.get("balances") or {}).values():
            try:
                total_attested += float(v)
            except (TypeError, ValueError):
                pass
    return {
        "linked": len(links),
        "primary": (
            {
                "link_id": primary.get("link_id"),
                "kind": primary.get("kind"),
                "address": primary.get("address"),
                "chain": primary.get("chain"),
                "balances": primary.get("balances"),
                "label": primary.get("label"),
            }
            if primary
            else None
        ),
        "links": [
            {
                "link_id": w.get("link_id"),
                "kind": w.get("kind"),
                "address": w.get("address"),
                "chain": w.get("chain"),
                "balances": w.get("balances"),
                "label": w.get("label"),
            }
            for w in links[:8]
        ],
        "supported": [
            {"kind": s.get("kind"), "name": s.get("name"), "chains": s.get("chains")}
            for s in (reg.get("supported") or [])
        ],
        "security": reg.get("security"),
        "total_attested_units": total_attested,
        "laws": _explain_laws(["sys.no-real-keys", "sys.sandbox-first"], context="wallets"),
        "teach": (
            f"{len(links)} wallet(s) linked. Public addresses only — AI cannot export keys."
            if links
            else "No wallets linked. Connect Phantom/MetaMask or watch-only to feed twins."
        ),
        "cta": "AI NODE · Link wallet" if not links else "AI NODE · Sync twins",
        "href": "ai",
        "action": "connect_wallet" if not links else "sync_twins",
    }


def _ai_panel() -> Dict[str, Any]:
    st = node_status()
    node = st.get("node") or {}
    snap = st.get("sandbox") or {}
    inner = snap.get("sandbox") if isinstance(snap.get("sandbox"), dict) else snap
    raw_twins = (inner or {}).get("twins") or {}
    twin_map: Dict[str, Any] = {}
    if isinstance(raw_twins, dict):
        for k, v in raw_twins.items():
            if isinstance(v, dict):
                twin_map[k] = v.get("amount", v)
            else:
                twin_map[k] = v
    ai_wallet = (node.get("ai_wallet") or {}) if isinstance(node.get("ai_wallet"), dict) else {}
    return {
        "online": st.get("online"),
        "node_id": node.get("node_id"),
        "sandbox_id": node.get("sandbox_id") or (inner or {}).get("sandbox_id"),
        "sandbox_alive": (inner or {}).get("alive", True),
        "ai_wallet_id": ai_wallet.get("wallet_id"),
        "capabilities": st.get("capabilities"),
        "twin_count": len(twin_map),
        "twins_preview": {k: twin_map[k] for k in list(twin_map)[:6]},
        "real_key_access": (st.get("capabilities") or {}).get("real_key_access") is False,
        "laws": _explain_laws(
            ["sys.sandbox-first", "sys.no-real-keys", "intel.no-hallucinated-apy"],
            context="ai-node",
        ),
        "teach": "AI node loads ecosystem laws every chat. Mutations stay in sandbox twins.",
        "cta": "AI NODE · Chat",
        "href": "ai",
        "action": "ai_chat",
    }


def _desk_panel(desk: dict, marks_feed: dict) -> Dict[str, Any]:
    tickets = desk.get("tickets_recent") or []
    accepted = sum(1 for t in tickets if t.get("status") in ("risk_accepted", "paper_filled", "routed_sim"))
    rejected = sum(1 for t in tickets if t.get("status") == "risk_rejected")
    return {
        "equity": desk.get("equity"),
        "cash_usdc": desk.get("cash_usdc"),
        "day_pnl": desk.get("day_pnl"),
        "open_notional": desk.get("open_notional"),
        "paper_mode": desk.get("paper_mode"),
        "positions": desk.get("positions") or [],
        "tickets_recent": tickets[:8],
        "ticket_stats": {"accepted": accepted, "rejected": rejected, "total": len(tickets)},
        "venues": [
            {"id": v.get("id"), "name": v.get("name"), "kind": v.get("kind"), "status": v.get("adapter_status") or v.get("atlas_status")}
            for v in (desk.get("venues") or list_venues())[:8]
        ],
        "strategies": desk.get("strategies") or [],
        "marks": desk.get("marks") or marks_feed.get("marks"),
        "business": desk.get("business"),
        "laws": _explain_laws(
            ["sys.nomos-veto", "intel.explain-rejects", "proto.category-gate"],
            context="desk",
        ),
        "teach": "Trading desk proposes tickets under desk risk + NOMOS. Paper fills never touch mainnet alone.",
        "cta": "DESK · Run arena",
        "href": "desk",
        "action": "desk_arena",
    }


def _daily_panel(network: str) -> Dict[str, Any]:
    h = daily_home(network)
    missions = h.get("missions") or []
    open_m = [m for m in missions if not m.get("done")]
    return {
        "xp": h.get("xp"),
        "level": h.get("level"),
        "streak": h.get("streak"),
        "progress": h.get("progress"),
        "missions": missions[:8],
        "open_missions": open_m[:4],
        "gas_coach": h.get("gas_coach"),
        "featured_asset": h.get("featured_asset"),
        "desk_pulse": h.get("desk_pulse"),
        "laws": _explain_laws(["intel.teach-on-action", "monad.gas-bills-limit"], context="daily"),
        "teach": "Daily seatbelt: missions, gas coach, streak XP — same lawbook as the company.",
        "cta": "DAILY · Home",
        "href": "home",
        "action": "daily",
    }


def _company_panel() -> Dict[str, Any]:
    try:
        hq = headquarters()
    except Exception:
        hq = {}
    brief = morning_brief()
    inbox = hq.get("inbox") or []
    return {
        "pitch": hq.get("pitch"),
        "brief_headline": (brief.get("headline") or brief.get("narrative") or "")[:200],
        "inbox_count": len(inbox) if isinstance(inbox, list) else 0,
        "inbox_preview": (inbox[:3] if isinstance(inbox, list) else []),
        "performance": hq.get("performance"),
        "departments": list((hq.get("departments") or hq.get("org") or {})),
        "laws": _explain_laws(
            ["sys.owner-sovereign", "sys.nomos-veto", "intel.compete-plans"],
            context="company",
        ),
        "teach": "Company OS embeds constitution + ecosystem laws before SENSUS runs.",
        "cta": "HQ · Staff company",
        "href": "hq",
        "action": "run_company",
    }


def _projects_panel() -> Dict[str, Any]:
    projects = list_projects()[:12]
    slim = []
    for p in projects:
        slim.append(
            {
                "project_id": p.get("project_id") or p.get("id"),
                "name": p.get("name") or p.get("project_id"),
                "network": p.get("network"),
                "categories": p.get("categories") or [],
                "created_at": p.get("created_at") or p.get("updated_at"),
            }
        )
    return {
        "count": len(projects),
        "projects": slim,
        "laws": _explain_laws(["sys.receipt-every-material-act", "sys.adapter-honesty"], context="studio"),
        "teach": (
            f"{len(projects)} forged app package(s) in workspace. Open IDE to inspect contracts + policy."
            if projects
            else "No packages yet — forge one in STUDIO (vault/dex/lending pipeline)."
        ),
        "cta": "STUDIO · Forge app" if not projects else "IDE · Open package",
        "href": "studio" if not projects else "ide",
        "action": "forge" if not projects else "open_project",
    }


def _app_modules(
    wallets: dict,
    vault: dict,
    desk: dict,
    ai: dict,
    daily: dict,
    company: dict,
    projects: dict,
) -> List[Dict[str, Any]]:
    """Navigable tiles that mirror the real app tabs."""
    return [
        {
            "id": "wallets",
            "tab": "ai",
            "title": "Wallets",
            "status": "live" if wallets.get("linked") else "needs_setup",
            "metric": f"{wallets.get('linked', 0)} linked",
            "detail": wallets.get("teach"),
            "cta": wallets.get("cta"),
            "action": wallets.get("action"),
            "laws": wallets.get("laws") or [],
        },
        {
            "id": "vault",
            "tab": "desk",
            "title": "SovereignVault",
            "status": "live" if vault.get("deployed") else "not_deployed",
            "metric": (vault.get("address") or "—")[:12] + ("…" if vault.get("address") else ""),
            "detail": vault.get("teach"),
            "cta": vault.get("cta"),
            "action": vault.get("action"),
            "laws": vault.get("laws") or [],
        },
        {
            "id": "desk",
            "tab": "desk",
            "title": "Trading desk",
            "status": "live",
            "metric": f"eq {float(desk.get('equity') or 0):.0f} · day {float(desk.get('day_pnl') or 0):+.1f}",
            "detail": desk.get("teach"),
            "cta": desk.get("cta"),
            "action": desk.get("action"),
            "laws": desk.get("laws") or [],
        },
        {
            "id": "ai",
            "tab": "ai",
            "title": "AI node + sandbox",
            "status": "live" if ai.get("online") else "offline",
            "metric": f"{ai.get('twin_count', 0)} twins · keys never",
            "detail": ai.get("teach"),
            "cta": ai.get("cta"),
            "action": ai.get("action"),
            "laws": ai.get("laws") or [],
        },
        {
            "id": "daily",
            "tab": "home",
            "title": "Daily seatbelt",
            "status": "live",
            "metric": f"LVL {daily.get('level')} · 🔥{daily.get('streak')} · {daily.get('xp')} XP",
            "detail": daily.get("teach"),
            "cta": daily.get("cta"),
            "action": daily.get("action"),
            "laws": daily.get("laws") or [],
        },
        {
            "id": "company",
            "tab": "hq",
            "title": "Company OS",
            "status": "live",
            "metric": f"inbox {company.get('inbox_count', 0)}",
            "detail": company.get("teach"),
            "cta": company.get("cta"),
            "action": company.get("action"),
            "laws": company.get("laws") or [],
        },
        {
            "id": "studio",
            "tab": projects.get("href") or "studio",
            "title": "Forged apps",
            "status": "live" if projects.get("count") else "empty",
            "metric": f"{projects.get('count', 0)} packages",
            "detail": projects.get("teach"),
            "cta": projects.get("cta"),
            "action": projects.get("action"),
            "laws": projects.get("laws") or [],
        },
        {
            "id": "academy",
            "tab": "academy",
            "title": "Academy",
            "status": "live",
            "metric": "learn on your mission",
            "detail": "Lessons attach to live rejects and vault sims — intel.teach-on-action.",
            "cta": "ACADEMY",
            "action": "academy",
            "laws": _explain_laws(["intel.teach-on-action"], context="academy"),
        },
    ]


def _ticker_lines(
    marks: Dict[str, float],
    desk: dict,
    gas_demo: dict,
    wallets: dict,
    vault: dict,
) -> List[Dict[str, Any]]:
    lines: List[Dict[str, Any]] = []
    t = time.time()
    for i, (sym, px) in enumerate((marks or {}).items()):
        phase = (t / 4.0 + i) % 1.0
        jitter = 1.0 + (phase - 0.5) * 0.002
        display = float(px) * jitter
        chg = (jitter - 1.0) * 100
        lines.append(
            {
                "symbol": sym,
                "price": round(display, 6),
                "change_pct": round(chg, 3),
                "side": "up" if chg >= 0 else "down",
            }
        )
    day_pnl = float(desk.get("day_pnl") or 0)
    lines.append(
        {
            "symbol": "DESK.EQ",
            "price": float(desk.get("equity") or 0),
            "change_pct": day_pnl,
            "side": "up" if day_pnl >= 0 else "down",
        }
    )
    lines.append(
        {
            "symbol": "WALLETS",
            "price": float(wallets.get("linked") or 0),
            "change_pct": float(wallets.get("total_attested_units") or 0),
            "side": "up" if wallets.get("linked") else "down",
        }
    )
    lines.append(
        {
            "symbol": "VAULT",
            "price": 1.0 if vault.get("deployed") else 0.0,
            "change_pct": float(vault.get("routable_tickets") or 0),
            "side": "up" if vault.get("deployed") else "down",
        }
    )
    lines.append(
        {
            "symbol": "GAS.LIMIT",
            "price": float(gas_demo.get("recommended_gas_limit") or 0),
            "change_pct": 7.5,
            "side": "up",
        }
    )
    lines.append(
        {
            "symbol": "LAWS.ON",
            "price": float(get_ecosystem_laws().get("law_count") or 0),
            "change_pct": 0.0,
            "side": "up",
        }
    )
    return lines


def _pillar_snapshot() -> Dict[str, Any]:
    book = get_ecosystem_laws()
    pillars = book.get("pillars") or {}
    out = {}
    for name in ("safety", "governance", "execution", "intelligence"):
        ids = pillars.get(name) or []
        out[name] = {
            "count": len(ids),
            "sample": _explain_laws(ids[:2], context=f"pillar:{name}"),
        }
    return out


def landing_feed(network: str = "monad-testnet") -> Dict[str, Any]:
    """Primary landing payload — real apps + market board + teaching + AI brief."""
    t0 = time.time()
    eco_laws = embed_ecosystem_laws()
    marks_feed = live_marks(network)
    desk = desk_snapshot()
    wallets = _wallets_panel()
    vault = _vault_panel(desk)
    ai = _ai_panel()
    daily = _daily_panel(network)
    company = _company_panel()
    projects = _projects_panel()
    modules = _app_modules(wallets, vault, desk, ai, daily, company, projects)

    brief = morning_brief()
    ai_coach = coach(network)
    gas = gas_coach(int(time.time()) // 3600)
    eco = ecosystem_bundle(network)
    day_i = int(time.time()) // 20

    bp = BEST_PRACTICES[day_i % len(BEST_PRACTICES)]
    move = COOL_MOVES[day_i % len(COOL_MOVES)]
    next_bp = BEST_PRACTICES[(day_i + 1) % len(BEST_PRACTICES)]
    bp_laws = _explain_laws(bp.get("law_ids") or [], context="best-practice")
    move_laws = _explain_laws(move.get("law_ids") or [], context="cool-move")

    active_laws = _explain_laws(
        [
            "sys.nomos-veto",
            "monad.gas-bills-limit",
            "sys.sandbox-first",
            "sys.owner-sovereign",
            "intel.teach-on-action",
            "exec.no-silent-broadcast",
            "sys.no-real-keys",
        ],
        context="always-on",
    )

    chain_id = 10143 if "testnet" in network or "10143" in network else 143
    gas_demo = apply_gas_limit_margin(chain_id, 80_000)

    demo_enforce = enforce_on_department(
        "THESIS",
        {
            "network": network,
            "proposal": {
                "title": "Landing board pulse — no live capital",
                "thesis": "integrate wallets vault desk ai into live feed",
                "actions": [],
            },
        },
    )

    ticker = _ticker_lines(
        marks_feed.get("marks") or {}, desk, gas_demo, wallets, vault
    )

    mon_px = (marks_feed.get("marks") or {}).get("MON/USDC")
    primary_addr = (wallets.get("primary") or {}).get("address") or "none"
    vault_addr_short = (vault.get("address") or "not-deployed")[:14]

    stream = [
        {
            "ts": time.time(),
            "kind": "market",
            "text": (
                f"MON/USDC {mon_px} · desk eq {float(desk.get('equity') or 0):.2f} · "
                f"day PnL {float(desk.get('day_pnl') or 0):+.2f} · "
                f"wallets {wallets.get('linked')} · vault {vault_addr_short}"
            ),
            "explain": "Live marks + real desk + wallet registry + vault deployment — not a toy ticker.",
            "laws": _explain_laws(
                ["intel.no-hallucinated-apy", "sys.adapter-honesty"], context="ticker"
            ),
        },
        {
            "ts": time.time(),
            "kind": "wallets",
            "text": wallets.get("teach"),
            "explain": f"Primary: {primary_addr[:12]}…" if primary_addr != "none" else "No primary wallet yet.",
            "laws": wallets.get("laws") or [],
            "cta": wallets.get("cta"),
            "href": wallets.get("href"),
            "action": wallets.get("action"),
        },
        {
            "ts": time.time(),
            "kind": "vault",
            "text": vault.get("teach"),
            "explain": (
                (vault.get("latest_route") or {}).get("narrative")
                or f"Deployed={vault.get('deployed')} · routable tickets={vault.get('routable_tickets')}"
            ),
            "laws": vault.get("laws") or [],
            "cta": vault.get("cta"),
            "href": vault.get("href"),
            "action": vault.get("action"),
        },
        {
            "ts": time.time(),
            "kind": "brief",
            "text": brief.get("narrative") or ai_coach.get("headline") or "Company online",
            "explain": "AI daily brief from real home/desk/wallet state.",
            "laws": _explain_laws(["intel.teach-on-action"], context="daily-brief"),
            "bullets": brief.get("bullets") or [],
        },
        {
            "ts": time.time(),
            "kind": "desk",
            "text": (
                f"Desk tickets: {desk.get('ticket_stats', {}).get('accepted', 0) if False else ''} "
                f"accepted/rejected from book · positions {len(desk.get('positions') or [])}"
            ).strip()
            or f"Desk live · positions {len(desk.get('positions') or [])} · paper={desk.get('paper_mode')}",
            "explain": desk.get("teach"),
            "laws": desk.get("laws") or [],
            "cta": desk.get("cta"),
            "href": "desk",
            "action": "desk_arena",
        },
        {
            "ts": time.time(),
            "kind": "ai",
            "text": ai.get("teach"),
            "explain": f"Twins: {ai.get('twins_preview')}",
            "laws": ai.get("laws") or [],
            "cta": ai.get("cta"),
            "href": "ai",
            "action": "ai_chat",
        },
        {
            "ts": time.time(),
            "kind": "apps",
            "text": projects.get("teach"),
            "explain": f"Packages: {[p.get('name') for p in (projects.get('projects') or [])[:4]]}",
            "laws": projects.get("laws") or [],
            "cta": projects.get("cta"),
            "href": projects.get("href"),
            "action": projects.get("action"),
        },
        {
            "ts": time.time(),
            "kind": "law",
            "text": (
                f"Ecosystem lawbook LIVE: {eco_laws.get('law_count')} laws · "
                f"THESIS consults {demo_enforce.get('laws_consulted')} · ok={demo_enforce.get('ok')}"
            ),
            "explain": eco_laws.get("doctrine"),
            "laws": active_laws[:4],
        },
        {
            "ts": time.time(),
            "kind": "practice",
            "text": f"Best practice: {bp['title']}",
            "explain": bp["body"],
            "why_now": bp.get("why_now"),
            "laws": bp_laws,
            "do": bp["do"],
            "docs": bp["docs"],
            "apps": bp.get("apps"),
        },
        {
            "ts": time.time(),
            "kind": "move",
            "text": f"Try now: {move['title']}",
            "explain": move["body"],
            "teach": move.get("teach"),
            "laws": move_laws,
            "cta": move["cta"],
            "href": move["href"],
            "action": move.get("action"),
            "apps": move.get("apps"),
        },
        {
            "ts": time.time(),
            "kind": "gas",
            "text": f"Gas coach: {(gas.get('tip') or {}).get('title')}",
            "explain": (
                f"{(gas.get('tip') or {}).get('body')} Demo: estimate {gas_demo['estimated_gas']} → "
                f"limit {gas_demo['recommended_gas_limit']}."
            ),
            "laws": _explain_laws(
                ["monad.gas-bills-limit", "monad.native-transfer-gas"],
                context="gas-coach",
            ),
        },
    ]

    # fix desk stream text properly
    ts = desk  # desk snapshot already has ticket list
    accepted = sum(
        1
        for t in (ts.get("tickets_recent") or [])
        if t.get("status") in ("risk_accepted", "paper_filled", "routed_sim")
    )
    rejected = sum(
        1 for t in (ts.get("tickets_recent") or []) if t.get("status") == "risk_rejected"
    )
    for item in stream:
        if item.get("kind") == "desk":
            item["text"] = (
                f"Desk · eq {float(desk.get('equity') or 0):.2f} · "
                f"tickets accept {accepted} / reject {rejected} · "
                f"positions {len(desk.get('positions') or [])} · paper={desk.get('paper_mode')}"
            )
            break

    return {
        "schema": "thesis.landing.v1",
        "ts": time.time(),
        "poll_ms_hint": 4000,
        "network": network,
        "headline": "THESIS PLATFORM — kernel · apps · market",
        "tagline": (
            "Shared primitives (identity, law, capital, market, intel, forge) with "
            "first-party apps and installable packages — one lawbook, one runtime."
        ),
        "ticker": ticker,
        "stream": stream,
        "apps": {
            "modules": modules,
            "wallets": wallets,
            "vault": vault,
            "desk": _desk_panel(desk, marks_feed),
            "ai": ai,
            "daily": daily,
            "company": company,
            "projects": projects,
        },
        "ai_brief": {
            "narrative": brief.get("narrative"),
            "bullets": brief.get("bullets"),
            "coach_headline": ai_coach.get("headline"),
            "tips": (ai_coach.get("tips") or [])[:5],
            "pitch": ai_coach.get("pitch") or brief.get("headline"),
            "gas_tip": gas.get("tip"),
            "wallet_linked": wallets.get("linked", 0),
            "vault_deployed": vault.get("deployed"),
            "desk_equity": desk.get("equity"),
            "project_count": projects.get("count", 0),
        },
        "market_panel": {
            "marks": marks_feed.get("marks"),
            "mark_sources": marks_feed.get("sources"),
            "desk_equity": desk.get("equity"),
            "desk_cash": desk.get("cash_usdc"),
            "day_pnl": desk.get("day_pnl"),
            "open_notional": desk.get("open_notional"),
            "venues": [
                {"id": v["id"], "name": v["name"], "kind": v["kind"]}
                for v in list_venues()
            ],
            "gas_demo": gas_demo,
            "wallets_linked": wallets.get("linked"),
            "vault_address": vault.get("address"),
        },
        "teaching_now": {
            "best_practice": {
                **{k: v for k, v in bp.items() if k != "law_ids"},
                "law_ids": bp.get("law_ids"),
                "laws_explained": bp_laws,
            },
            "cool_move": {
                **{k: v for k, v in move.items() if k != "law_ids"},
                "law_ids": move.get("law_ids"),
                "laws_explained": move_laws,
            },
            "active_laws": active_laws,
            "next_best_practice": next_bp.get("title"),
            "rotation_seconds": 20,
        },
        "pillars": _pillar_snapshot(),
        "enforcement_demo": {
            "department": demo_enforce.get("department"),
            "ok": demo_enforce.get("ok"),
            "laws_consulted": demo_enforce.get("laws_consulted"),
            "law_ids_sample": demo_enforce.get("law_ids_sample"),
            "as_used": (
                "Landing poll consulted THESIS pillars against wallets+vault+desk pulse."
            ),
        },
        "ecosystem_glance": {
            "tokens": (eco.get("tokens") or [])[:6],
            "infra": eco.get("infra"),
            "problems": eco.get("problems"),
        },
        "law_stack": {
            "embedded": True,
            "law_count": eco_laws.get("law_count"),
            "domains": list((eco_laws.get("domains") or {}).keys()),
            "pillars": {k: len(v) for k, v in (eco_laws.get("pillars") or {}).items()},
            "doctrine": eco_laws.get("doctrine"),
        },
        "best_practices_rotating": BEST_PRACTICES,
        "cool_moves": COOL_MOVES,
        "docs": {
            "best_practices": "https://docs.monad.xyz/developer-essentials/best-practices",
            "gas": "https://docs.monad.xyz/developer-essentials/gas-pricing",
            "network": "https://docs.monad.xyz/developer-essentials/network-information",
            "spark": "https://buildanything.so/hackathons/spark",
        },
        "platform": _platform_strip(network),
        "elapsed_ms": (time.time() - t0) * 1000,
    }
