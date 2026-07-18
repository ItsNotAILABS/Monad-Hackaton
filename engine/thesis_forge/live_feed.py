"""Live market + teaching feed for the landing command center.

Constantly updating (on poll) market board that:
- shows twin/desk/marks pulse
- teaches ecosystem laws *as they apply*
- surfaces Monad best practices (docs.monad.xyz)
- attaches AI daily brief analysis
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from .company.os import morning_brief
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


# Sourced from https://docs.monad.xyz/developer-essentials/best-practices
# + gas-pricing. Each card maps to runtime ecosystem law IDs so the UI can
# "explain the law as it is being used."
BEST_PRACTICES: List[Dict[str, Any]] = [
    {
        "id": "bp.hardcode-static-gas",
        "title": "Hardcode gas when usage is static",
        "body": (
            "Many on-chain actions have fixed gas. Native MON transfer is always "
            "21,000. Calling eth_estimateGas for static ops slows wallets and can "
            "trigger bad fallbacks when estimate reverts."
        ),
        "do": "Use gasLimit: 21000n for pure native transfers. Skip estimateGas.",
        "why_now": "Every MON tip or transfer on this desk can hardcode 21k.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["monad.native-transfer-gas", "monad.gas-bills-limit"],
    },
    {
        "id": "bp.concurrent-eth-call",
        "title": "Batch reads concurrently (Multicall3)",
        "body": (
            "Serial eth_call round-trips kill UX on 400ms blocks. Aggregate with "
            "Multicall3 or Promise.all RPC batches. Multicall is serial on-chain — "
            "don't pack too many expensive calls; parallel RPC batches run on the node."
        ),
        "do": "Multicall3 @ 0xcA11bde05977b3631167028862bE2a173976CA11 (mainnet+testnet).",
        "why_now": "Daily brief balance snapshots should be one multicall, not N RPCs.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["monad.no-invent-addresses", "intel.no-hallucinated-apy"],
    },
    {
        "id": "bp.indexer-not-getlogs",
        "title": "Use an indexer instead of eth_getLogs loops",
        "body": (
            "Don't poll eth_getLogs forever for activity feeds. Use Envio, Goldsky, "
            "The Graph, QuickNode Streams, Allium, Ghost, or thirdweb Insight."
        ),
        "do": "Index once; query your DB/API for product features and daily briefs.",
        "why_now": "LIVE stream prefers indexed marks + desk state over raw log spam.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["intel.no-hallucinated-apy", "sys.adapter-honesty"],
    },
    {
        "id": "bp.local-nonce",
        "title": "Track nonces locally for burst sends",
        "body": (
            "eth_getTransactionCount is a network hop. Burst txs from one wallet need "
            "local nonce tracking. Monad has no global mempool — pending is local."
        ),
        "do": "Increment nonce client-side when sending concurrent txs from one account.",
        "why_now": "PRAXIS multi-step missions may queue several signed steps.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["monad.no-global-mempool"],
    },
    {
        "id": "bp.concurrent-submit",
        "title": "Submit independent txs concurrently",
        "body": (
            "Instead of sequential sendTransaction loops, Promise.all independent "
            "transfers. Monad is built for throughput — use it. Owner still signs."
        ),
        "do": "Batch independent sends; keep each signature explicit and user-approved.",
        "why_now": "exec.no-silent-broadcast still applies — concurrent ≠ unattended.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["exec.no-silent-broadcast", "sys.owner-sovereign"],
    },
    {
        "id": "bp.gas-limit-margin",
        "title": "Tight gas-limit margin (~7.5%)",
        "body": (
            "On Monad you pay gas_limit × price, not gas used. Fat 2× buffers burn MON. "
            "Start near estimate × 1.075 (10750 bps)."
        ),
        "do": "applyGasLimitMargin(chainId, estimate) with ~7.5% headroom — not 2×.",
        "why_now": "CUSTOS and gas coach enforce this on every mission plan.",
        "docs": "https://docs.monad.xyz/developer-essentials/gas-pricing",
        "law_ids": ["monad.gas-bills-limit"],
    },
    {
        "id": "bp.hosting-costs",
        "title": "Control web hosting data-transfer costs",
        "body": (
            "Vercel/Railway are convenient but can spike past loss-leader tiers. "
            "High-traffic apps: S3+CloudFront for static, Lambda/ECS for compute, "
            "watch $/GB after the free tier cliff."
        ),
        "do": "Serve static assets via CDN; never stream RPC responses through your edge uncached.",
        "why_now": "This landing board polls every 4s — keep payloads lean and cacheable.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["sys.receipt-every-material-act"],
    },
    {
        "id": "bp.finality-before-settle",
        "title": "Wait for finalized before off-chain settlement",
        "body": (
            "Receipt = local execution on Monad. For irreversible off-chain effects "
            "(credits, unlocks), wait for the finalized tag — ~2 blocks at 400ms."
        ),
        "do": "Poll until block is finalized before treating a fill as settled capital.",
        "why_now": "PRAXIS verify step and MEMORIA receipts depend on this law.",
        "docs": "https://docs.monad.xyz/developer-essentials/best-practices",
        "law_ids": ["monad.finality", "sys.mandatory-simulation"],
    },
]


COOL_MOVES: List[Dict[str, Any]] = [
    {
        "id": "move.desk-reject",
        "title": "Celebrate a REJECT",
        "body": "Run the desk arena. When degen perps die under NOMOS, you just saved a blank check.",
        "cta": "Open DESK · Run arena",
        "href": "desk",
        "law_ids": ["sys.nomos-veto", "intel.explain-rejects"],
        "teach": "NOMOS veto is a feature, not a bug. Explained rejects train better instincts than silent fails.",
    },
    {
        "id": "move.company-mission",
        "title": "Staff the whole company",
        "body": "One objective → SENSUS research, AGORA compete, NOMOS veto, PRAXIS plan, ACADEMY teach.",
        "cta": "HQ · Assign THESIS",
        "href": "hq",
        "law_ids": ["sys.owner-sovereign", "intel.compete-plans"],
        "teach": "You remain sovereign. Departments recommend; you sign.",
    },
    {
        "id": "move.twin-sync",
        "title": "Sync digital twins",
        "body": "Connect Phantom/MetaMask publicly, mirror into the AI sandbox wallet — real keys never leave your extension.",
        "cta": "AI NODE · Sync twins",
        "href": "ai",
        "law_ids": ["sys.sandbox-first", "sys.no-real-keys"],
        "teach": "AI mutates twins only. Promote to chain requires your signature path.",
    },
    {
        "id": "move.multicall",
        "title": "Think Multicall3",
        "body": "Batch balance reads with Multicall3 instead of serial RPC — snappier briefs on 400ms blocks.",
        "cta": "Read best practices",
        "href": "codex",
        "law_ids": ["monad.no-invent-addresses"],
        "teach": "Only use the canonical Multicall3 address — never invent contract addresses.",
    },
    {
        "id": "move.gas-hardcode",
        "title": "Hardcode 21k transfers",
        "body": "Native MON send always costs 21,000. Skip estimateGas — wallets get faster and safer.",
        "cta": "Gas coach",
        "href": "home",
        "law_ids": ["monad.native-transfer-gas"],
        "teach": "Static gas = hardcoded limit. Dynamic gas = tight 7.5% margin on estimate.",
    },
    {
        "id": "move.academy",
        "title": "Learn on your money story",
        "body": "Academy lessons attach to the mission you're reviewing — not abstract Lesson 4.",
        "cta": "ACADEMY",
        "href": "academy",
        "law_ids": ["intel.teach-on-action"],
        "teach": "Laws explain themselves mid-action so you build muscle memory.",
    },
    {
        "id": "move.live-laws",
        "title": "Watch laws fire live",
        "body": "This LIVE board rotates Monad best practices and stamps each with the law ID being enforced.",
        "cta": "Stay on LIVE",
        "href": "live",
        "law_ids": ["intel.teach-on-action", "sys.nomos-veto"],
        "teach": "If you only remember one thing: the company loads the lawbook before it acts.",
    },
]


# Contextual "as used" explanations — keyed by law id
AS_USED: Dict[str, str] = {
    "sys.no-real-keys": "Wallet link rejected any private key field. Public address only.",
    "sys.sandbox-first": "AI mutations stay on digital twins until you promote with a signature.",
    "sys.nomos-veto": "NOMOS can kill any plan that violates constitution or ecosystem law.",
    "sys.receipt-every-material-act": "This poll sealed desk/marks state into the live feed payload.",
    "sys.mandatory-simulation": "Irreversible steps require a dry-run before signature.",
    "sys.owner-sovereign": "Departments recommend; you remain the only signer of capital moves.",
    "sys.adapter-honesty": "planned/simulated adapters are labeled — not sold as live capital rails.",
    "sys.kill-switch": "Sandbox kill freezes all AI twin mutations immediately.",
    "monad.gas-bills-limit": "Gas coach applied ~7.5% margin — you pay the limit on Monad, not used gas.",
    "monad.native-transfer-gas": "Native transfer path uses hardcoded 21,000 gas (no estimateGas).",
    "monad.no-global-mempool": "No pending-tx gossip. Local nonce + receipt polling only.",
    "monad.finality": "Receipt ≠ irreversible settle — wait for finalized before off-chain credits.",
    "monad.reserve-balance-10-mon": "Spending that would drop undelegated account under 10 MON can fail.",
    "monad.tx-types": "Type-3 blob txs rejected. Support 0/1/2/4 only.",
    "monad.no-invent-addresses": "Multicall3 and tokens come from the embedded catalog only.",
    "monad.priority-fee-not-live": "maxPriorityFeePerGas may be 2 gwei hardcoded — not live tip advice.",
    "proto.live-only-when-live": "Non-live adapters cannot force_live real capital.",
    "proto.category-gate": "Actions must match protocol category + your allowed_categories.",
    "proto.exact-approval": "Approvals are exact amount — never unlimited by default.",
    "intel.no-hallucinated-apy": "Marks/APY only from live_marks + desk — never invented yields.",
    "intel.explain-rejects": "Every reject carries human-readable reasons for you and agents.",
    "intel.teach-on-action": "This card is teaching because a mission/poll is active right now.",
    "intel.compete-plans": "AGORA must file multiple plans so NOMOS can demonstrate veto.",
    "exec.ordered-mission": "PRAXIS steps: approve exact → action → verify → receipt.",
    "exec.no-silent-broadcast": "No chain broadcast without your approval path.",
    "exec.re-sim-before-sign": "Stale quotes get re-simulated before you sign.",
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


def _ticker_lines(marks: Dict[str, float], desk: dict, gas_demo: dict) -> List[Dict[str, Any]]:
    """Build scrolling ticker — markets + desk + law pulse."""
    lines: List[Dict[str, Any]] = []
    t = time.time()
    for i, (sym, px) in enumerate((marks or {}).items()):
        # Micro pulse so the board feels alive every poll without claiming CEX prices
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
            "symbol": "DESK.CASH",
            "price": float(desk.get("cash_usdc") or 0),
            "change_pct": 0.0,
            "side": "up",
        }
    )
    lines.append(
        {
            "symbol": "GAS.LIMIT",
            "price": float(gas_demo.get("recommended_gas_limit") or 0),
            "change_pct": 7.5,
            "side": "up",
            "note": "margin_bps",
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
        sample = _explain_laws(ids[:2], context=f"pillar:{name}")
        out[name] = {"count": len(ids), "sample": sample}
    return out


def landing_feed(network: str = "monad-testnet") -> Dict[str, Any]:
    """Primary landing payload — market board + teaching + AI brief."""
    t0 = time.time()
    eco_laws = embed_ecosystem_laws()
    marks_feed = live_marks(network)
    desk = desk_snapshot()
    brief = morning_brief()
    ai_coach = coach(network)
    gas = gas_coach(int(time.time()) // 3600)
    eco = ecosystem_bundle(network)
    # Rotate teaching every ~20s so the board teaches continuously
    day_i = int(time.time()) // 20

    bp = BEST_PRACTICES[day_i % len(BEST_PRACTICES)]
    move = COOL_MOVES[day_i % len(COOL_MOVES)]
    next_bp = BEST_PRACTICES[(day_i + 1) % len(BEST_PRACTICES)]
    bp_laws = _explain_laws(bp.get("law_ids") or [], context="best-practice")
    move_laws = _explain_laws(move.get("law_ids") or [], context="cool-move")

    # Always-on laws the company is enforcing right now
    active_law_ids = [
        "sys.nomos-veto",
        "monad.gas-bills-limit",
        "sys.sandbox-first",
        "sys.owner-sovereign",
        "intel.teach-on-action",
        "exec.no-silent-broadcast",
    ]
    active_laws = _explain_laws(active_law_ids, context="always-on")

    chain_id = 10143 if "testnet" in network or "10143" in network else 143
    gas_demo = apply_gas_limit_margin(chain_id, 80_000)

    # Demo enforcement stamp — shows laws being used on a sample proposal
    demo_enforce = enforce_on_department(
        "THESIS",
        {
            "network": network,
            "proposal": {
                "title": "Landing board pulse — no live capital",
                "thesis": "teach ecosystem laws while streaming desk marks",
                "actions": [],
            },
        },
    )

    ticker = _ticker_lines(marks_feed.get("marks") or {}, desk, gas_demo)
    venues = list_venues()
    pillars = _pillar_snapshot()

    mon_px = (marks_feed.get("marks") or {}).get("MON/USDC")
    stream = [
        {
            "ts": time.time(),
            "kind": "market",
            "text": f"MON/USDC {mon_px} · desk equity {float(desk.get('equity') or 0):.2f} · day PnL {float(desk.get('day_pnl') or 0):+.2f}",
            "explain": "Marks refresh every poll. Synthetic walk + optional RPC entropy — not a CEX oracle claim.",
            "laws": _explain_laws(["intel.no-hallucinated-apy", "sys.adapter-honesty"], context="ticker"),
        },
        {
            "ts": time.time(),
            "kind": "brief",
            "text": brief.get("narrative") or ai_coach.get("headline") or "Company online",
            "explain": "AI daily brief: wallets, idle capital, gas tip — your morning desk in one paragraph.",
            "laws": _explain_laws(["intel.teach-on-action"], context="daily-brief"),
            "bullets": brief.get("bullets") or [],
        },
        {
            "ts": time.time(),
            "kind": "law",
            "text": (
                f"Ecosystem lawbook LIVE: {eco_laws.get('law_count')} laws · "
                f"domains {list((eco_laws.get('domains') or {}).keys())} · "
                f"THESIS enforcement ok={demo_enforce.get('ok')} consulted={demo_enforce.get('laws_consulted')}"
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
        },
        {
            "ts": time.time(),
            "kind": "gas",
            "text": f"Gas coach: {gas['tip']['title']}",
            "explain": (
                f"{gas['tip']['body']} Demo: estimate {gas_demo['estimated_gas']} → "
                f"limit {gas_demo['recommended_gas_limit']} "
                f"(margin {gas_demo.get('margin_bps', 10750)} bps)."
            ),
            "laws": _explain_laws(
                ["monad.gas-bills-limit", "monad.native-transfer-gas"],
                context="gas-coach",
            ),
        },
        {
            "ts": time.time(),
            "kind": "up_next",
            "text": f"Next practice rotating in: {next_bp['title']}",
            "explain": next_bp["body"][:160] + "…",
            "laws": _explain_laws(next_bp.get("law_ids") or [], context="upcoming"),
            "docs": next_bp["docs"],
        },
    ]

    return {
        "schema": "thesis.landing.v1",
        "ts": time.time(),
        "poll_ms_hint": 3500,
        "network": network,
        "headline": "THESIS LIVE — market · laws · company brief",
        "tagline": "Your DeFi company is ON. Ecosystem laws embed at runtime. Learn every cool move as it fires.",
        "ticker": ticker,
        "stream": stream,
        "ai_brief": {
            "narrative": brief.get("narrative"),
            "bullets": brief.get("bullets"),
            "coach_headline": ai_coach.get("headline"),
            "tips": (ai_coach.get("tips") or [])[:5],
            "pitch": ai_coach.get("pitch") or brief.get("headline"),
            "gas_tip": gas.get("tip"),
        },
        "market_panel": {
            "marks": marks_feed.get("marks"),
            "mark_sources": marks_feed.get("sources"),
            "desk_equity": desk.get("equity"),
            "desk_cash": desk.get("cash_usdc"),
            "day_pnl": desk.get("day_pnl"),
            "open_notional": desk.get("open_notional"),
            "venues": [{"id": v["id"], "name": v["name"], "kind": v["kind"]} for v in venues],
            "gas_demo": gas_demo,
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
        "pillars": pillars,
        "enforcement_demo": {
            "department": demo_enforce.get("department"),
            "ok": demo_enforce.get("ok"),
            "laws_consulted": demo_enforce.get("laws_consulted"),
            "law_ids_sample": demo_enforce.get("law_ids_sample"),
            "as_used": "Landing poll just consulted the full THESIS pillar set against a zero-capital pulse proposal.",
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
        },
        "elapsed_ms": (time.time() - t0) * 1000,
    }
