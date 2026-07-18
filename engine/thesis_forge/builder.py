"""MonadBuilder HQ — easy, AI-delivered platform utilities.

One surface for:
  - Daily AI brief (addictive, helpful)
  - One-tap morning (check-in + gas + reject celebrate + signal)
  - Next best action with XP rewards
  - Delivered by AI node + tools + terminal
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from . import __version__
from .brand import DOCTRINE, ONE_LINER, PRODUCT, PRODUCT_SHORT, TAGLINE, brand_payload
from .daily import complete_mission, home as daily_home
from .receipts import seal

# Micro-copy for addictive-but-helpful loops
CELEBRATIONS = [
    "Seatbelt on. You just saved future-you twenty minutes.",
    "Reject enjoyed. Capital protected. Streak breathing.",
    "Gas literate move — Monad bills the limit, you paid smart.",
    "Signal under law. Not CT cosplay — dual stack approved.",
    "AI ran the boring parts. You stay sovereign.",
]


def _pick_celebration(seed: int) -> str:
    return CELEBRATIONS[seed % len(CELEBRATIONS)]


def daily_ai_brief(network: str = "monad-testnet") -> Dict[str, Any]:
    """AI-shaped daily brief — short, sticky, actionable."""
    from .auto_exec import intelligence_pulse
    from .company.os import morning_brief
    from .gas_intel import gas_coach
    from .signals import generate_signals

    t0 = time.time()
    h = daily_home(network)
    brief = morning_brief()
    pulse = intelligence_pulse(network)
    gas = gas_coach()
    sig = generate_signals(network, n=5)
    top = (sig.get("leaderboard") or [{}])[0]

    # AI narrative (deterministic template — feels delivered, no LLM required)
    streak = int(h.get("streak") or 0)
    level = int(h.get("level") or 1)
    xp = int(h.get("xp") or 0)
    day_pnl = (h.get("desk") or {}).get("day_pnl") if isinstance(h.get("desk"), dict) else None
    if day_pnl is None:
        from .trading import desk_snapshot

        day_pnl = desk_snapshot().get("day_pnl")

    mood = "steady"
    if streak >= 3:
        mood = "on_fire"
    if float(day_pnl or 0) < 0:
        mood = "careful"

    # TEXT ONLY — never TTS / robot voice. Speech-to-text is for input (notes/exec), not brief playback.
    brief_text = (
        f"Good morning. {PRODUCT_SHORT} seatbelt · "
        f"Level {level} · {xp} XP · streak {streak}. "
    )
    if mood == "on_fire":
        brief_text += "Streak is hot — keep the loop tiny so you don't break it. "
    elif mood == "careful":
        brief_text += "Desk is red — shrink size, celebrate rejects, no hero tickets. "
    else:
        brief_text += "Three micro-missions. Under five minutes. Then you're free. "

    gas_tip = (gas.get("tip") or {})
    actions: List[Dict[str, Any]] = [
        {
            "id": "checkin",
            "label": "✓ Check in (1 min)",
            "why": "Streak + XP — addiction that protects capital",
            "api": "POST /home/mission {mission_id: checkin}",
            "tool": "builder_morning",
            "xp": 10,
        },
        {
            "id": "gas",
            "label": "Gas tip",
            "why": gas_tip.get("title") or "Monad bills gas_limit",
            "api": "POST /home/mission {mission_id: gas-tip, acknowledged: true}",
            "xp": 40,
        },
        {
            "id": "reject",
            "label": "Celebrate a REJECT",
            "why": "Feel the brakes — winner demos show this live",
            "api": "POST /tools/reject_demo/run",
            "xp": 40,
        },
        {
            "id": "signal",
            "label": f"Top signal: {top.get('side')} {top.get('symbol')}",
            "why": f"score {top.get('score')} · auto={top.get('auto')}",
            "api": "GET /signals · POST /auto/signals",
            "xp": 20,
        },
    ]

    nba = h.get("next_best_action") or actions[0]
    celebration = _pick_celebration(level + streak + xp)

    out = {
        "schema": "monadbuilder.daily_brief.v1",
        "product": PRODUCT,
        "version": __version__,
        "network": network,
        "ai_delivered": True,
        "easy": True,
        "format": "text",
        "tts": False,
        "speech_to_text": True,
        "speech_to_text_for": ["notes", "executions", "terminal", "ai_chat"],
        "mood": mood,
        "brief_text": brief_text,
        # alias kept for older clients — still plain text, never spoken
        "ai_voice": brief_text,
        "celebration": celebration,
        "tagline": TAGLINE,
        "doctrine": DOCTRINE,
        "stats": {
            "level": level,
            "xp": xp,
            "streak": streak,
            "best_streak": h.get("best_streak"),
            "day_pnl": day_pnl,
        },
        "company_brief": brief.get("narrative") or brief.get("headline"),
        "bullets": (brief.get("bullets") or [])[:6],
        "gas": {
            "title": gas_tip.get("title"),
            "body": gas_tip.get("body") or gas_tip.get("roommate"),
        },
        "intelligence": {
            "recommendation": pulse.get("recommendation"),
            "headline": pulse.get("headline"),
        },
        "signal_top": top,
        "actions": actions,
        "next_best": nba,
        "missions_today": h.get("missions") or [],
        "badges": h.get("badges") or [],
        "addictive_loop": {
            "hook": "Open HQ → read text brief (no robot TTS)",
            "action": "One tap morning (3 missions) or speak notes/commands via STT",
            "reward": "XP + streak + celebration text",
            "invest": "Reject count + badges compound identity",
        },
        "one_tap": "POST /builder/morning",
        "elapsed_ms": (time.time() - t0) * 1000,
    }
    seal("builder.daily_brief", {"streak": streak, "level": level})
    return out


def run_morning(
    network: str = "monad-testnet",
    *,
    auto_reject: bool = True,
    auto_signals: bool = True,
) -> Dict[str, Any]:
    """One-tap AI morning — checkin + gas + reject demo + optional signal paper."""
    t0 = time.time()
    steps: List[Dict[str, Any]] = []

    # 1 check-in
    try:
        c1 = complete_mission("checkin")
        steps.append(
            {
                "id": "checkin",
                "ok": bool(c1.get("ok", True)),
                "detail": c1.get("message") or ("already" if c1.get("already") else "checked in"),
                "xp": c1.get("xp_gained") or c1.get("xp"),
            }
        )
    except Exception as exc:
        steps.append({"id": "checkin", "ok": False, "detail": str(exc)[:120]})

    # 2 gas
    try:
        c2 = complete_mission("gas-tip", payload={"acknowledged": True})
        steps.append(
            {
                "id": "gas-tip",
                "ok": bool(c2.get("ok", True)),
                "detail": "gas acknowledged" if c2.get("ok", True) else c2.get("error"),
                "xp": c2.get("xp_gained") or c2.get("xp"),
            }
        )
    except Exception as exc:
        steps.append({"id": "gas-tip", "ok": False, "detail": str(exc)[:120]})

    # 3 reject demo
    reject_n = 0
    if auto_reject:
        from .trading import load_desk, run_desk_arena

        arena = run_desk_arena(load_desk())
        reject_n = int(arena.get("n_rejected") or 0)
        try:
            c3 = complete_mission("desk-arena", payload={"n_rejected": reject_n, "n_accepted": arena.get("n_accepted")})
            steps.append(
                {
                    "id": "desk-arena",
                    "ok": reject_n >= 1 and bool(c3.get("ok", True)),
                    "detail": f"n_rejected={reject_n}",
                    "xp": c3.get("xp_gained") or c3.get("xp"),
                }
            )
        except Exception as exc:
            steps.append({"id": "desk-arena", "ok": reject_n >= 1, "detail": f"rejects={reject_n} ({exc})"})

    # 4 optional signal paper fill
    fills = 0
    if auto_signals:
        from .auto_exec import auto_paper_from_signals

        sig = auto_paper_from_signals(network, max_fills=1)
        fills = int(sig.get("n_filled") or 0)
        steps.append({"id": "auto_signals", "ok": True, "detail": f"paper_fills={fills}"})

    h = daily_home(network)
    brief = daily_ai_brief(network)
    ok = all(s.get("ok") for s in steps if s["id"] != "auto_signals")

    out = {
        "schema": "monadbuilder.morning.v1",
        "product": PRODUCT,
        "ok": ok,
        "ai_delivered": True,
        "easy": True,
        "headline": (
            f"{PRODUCT_SHORT} morning done · streak {h.get('streak')} · "
            f"lvl {h.get('level')} · rejects {reject_n} · fills {fills}"
        ),
        "celebration": brief.get("celebration"),
        "brief_text": brief.get("brief_text") or brief.get("ai_voice"),
        "format": "text",
        "tts": False,
        "steps": steps,
        "stats": {
            "xp": h.get("xp"),
            "level": h.get("level"),
            "streak": h.get("streak"),
            "badges": h.get("badges"),
        },
        "brief": {
            "mood": brief.get("mood"),
            "next_actions": brief.get("actions"),
            "signal_top": brief.get("signal_top"),
        },
        "elapsed_ms": (time.time() - t0) * 1000,
        "doctrine": DOCTRINE,
        "owner_still_sovereign": True,
        "chain_broadcast": False,
    }
    seal(
        "builder.morning",
        {"ok": ok, "streak": h.get("streak"), "rejects": reject_n, "fills": fills},
    )
    return out


def utilities_catalog() -> Dict[str, Any]:
    """Winning, easy utilities — each is one tap or one AI phrase."""
    return {
        "schema": "monadbuilder.utilities.v1",
        "product": PRODUCT,
        "tagline": TAGLINE,
        "one_liner": ONE_LINER,
        "ai_delivered": True,
        "utilities": [
            {
                "id": "daily_brief",
                "name": "Daily AI brief",
                "say_to_ai": "daily brief",
                "api": "GET /builder/brief",
                "seconds": 3,
                "habit": "Open every morning",
            },
            {
                "id": "morning",
                "name": "One-tap morning",
                "say_to_ai": "run my morning",
                "api": "POST /builder/morning",
                "seconds": 15,
                "habit": "Streak + rejects + gas in one shot",
            },
            {
                "id": "reject",
                "name": "Celebrate REJECT",
                "say_to_ai": "show a reject",
                "api": "POST /tools/reject_demo/run",
                "seconds": 5,
                "habit": "Dopamine from safety",
            },
            {
                "id": "auto",
                "name": "Auto paper loop",
                "say_to_ai": "auto exec",
                "api": "POST /auto/loop",
                "seconds": 12,
                "habit": "Winner utility under brakes",
            },
            {
                "id": "signals",
                "name": "Alpha signals",
                "say_to_ai": "signals",
                "api": "GET /signals",
                "seconds": 4,
                "habit": "Leaderboard glance",
            },
            {
                "id": "report",
                "name": "Full PDF report",
                "say_to_ai": "report pdf",
                "api": "POST /reports/full",
                "seconds": 8,
                "habit": "Weekly archive",
            },
            {
                "id": "hybrid",
                "name": "Worker hybrid pulse",
                "say_to_ai": "hybrid",
                "api": "POST /hybrid/run",
                "seconds": 5,
                "habit": "Novel tech demo",
            },
            {
                "id": "terminal",
                "name": "Sovereign terminal",
                "say_to_ai": "open terminal workflow morning",
                "api": "POST /terminal/exec",
                "seconds": 10,
                "habit": "Power users",
            },
        ],
        "brand": brand_payload(),
    }


def builder_home(network: str = "monad-testnet") -> Dict[str, Any]:
    """Landing payload for MonadBuilder HQ — easy first screen."""
    brief = daily_ai_brief(network)
    utils = utilities_catalog()
    return {
        "schema": "monadbuilder.home.v1",
        "product": PRODUCT,
        "version": __version__,
        "tagline": TAGLINE,
        "one_liner": ONE_LINER,
        "brand": brand_payload(),
        "brief": brief,
        "utilities": utils["utilities"],
        "start_here": [
            {"step": 1, "do": "Read AI brief", "api": "GET /builder/brief"},
            {"step": 2, "do": "Tap morning", "api": "POST /builder/morning"},
            {"step": 3, "do": "Optional: WIN PATH for judges", "api": "POST /demo/win-path"},
        ],
        "ai_phrases": [
            "daily brief",
            "run my morning",
            "show a reject",
            "auto exec",
            "report pdf",
            "signals",
        ],
    }


def utility_now(network: str = "monad-testnet") -> Dict[str, Any]:
    """Right-away utility pack — one response with everything useful on first paint."""
    t0 = time.time()
    brief = daily_ai_brief(network)
    from .signals import generate_signals
    from .trading import load_desk, run_desk_arena, desk_snapshot
    from .gas_intel import gas_coach
    from .edge_workers import edge_run_local

    sig = generate_signals(network, n=5)
    desk = desk_snapshot()
    gas = gas_coach()
    # cheap reject peek without full morning XP double-spend
    try:
        arena = run_desk_arena(load_desk())
    except Exception:
        arena = {"n_rejected": 0, "n_accepted": 0}
    edge = edge_run_local("seatbelt", "brief", network=network)

    top = (sig.get("leaderboard") or [{}])[0]
    taps = [
        {
            "id": "morning",
            "label": "▶ AI Morning",
            "desc": "Check-in · gas · REJECT · signal fill",
            "api": "POST /builder/morning",
            "primary": True,
            "seconds": 15,
        },
        {
            "id": "reject",
            "label": "Celebrate REJECT",
            "desc": f"Live peek: {arena.get('n_rejected')} rejected last arena",
            "api": "POST /tools/reject_demo/run",
            "seconds": 5,
        },
        {
            "id": "auto",
            "label": "Auto paper loop",
            "desc": "Signals + strategy fills under laws",
            "api": "POST /auto/loop",
            "seconds": 12,
        },
        {
            "id": "signals",
            "label": f"Signal {top.get('side') or '—'} {top.get('symbol') or ''}",
            "desc": f"score {top.get('score')} · auto={top.get('auto')}",
            "api": "GET /signals",
            "seconds": 3,
        },
        {
            "id": "x",
            "label": "Draft X post",
            "desc": "Ecosystem marketing from real actions",
            "api": "POST /x/from-actions",
            "seconds": 4,
        },
        {
            "id": "edge",
            "label": "Edge seatbelt",
            "desc": "CF Worker route (local sim)",
            "api": "POST /edge/run",
            "seconds": 4,
        },
        {
            "id": "agent",
            "label": "Agent step",
            "desc": "Delta attention long-horizon",
            "api": "POST /agent/step",
            "seconds": 8,
        },
        {
            "id": "report",
            "label": "Full PDF report",
            "desc": "Downloadable ops pack",
            "api": "POST /reports/full",
            "seconds": 8,
        },
    ]

    return {
        "schema": "monadbuilder.utility_now.v1",
        "product": PRODUCT,
        "version": __version__,
        "network": network,
        "ready_ms": round((time.time() - t0) * 1000, 1),
        "format": "text",
        "tts": False,
        "speech_to_text": True,
        "headline": brief.get("brief_text") or brief.get("ai_voice"),
        "celebration": brief.get("celebration"),
        "mood": brief.get("mood"),
        "stats": brief.get("stats"),
        "gas": {
            "title": (gas.get("tip") or {}).get("title"),
            "body": (gas.get("tip") or {}).get("body") or (gas.get("tip") or {}).get("roommate"),
            "limit": (gas.get("demo_margin") or {}).get("recommended_gas_limit"),
        },
        "desk": {
            "equity": desk.get("equity"),
            "day_pnl": desk.get("day_pnl"),
            "cash_usdc": desk.get("cash_usdc"),
        },
        "arena_peek": {
            "n_rejected": arena.get("n_rejected"),
            "n_accepted": arena.get("n_accepted"),
            "reject_is_a_feature": int(arena.get("n_rejected") or 0) >= 1,
        },
        "signal_top": top,
        "signals": (sig.get("leaderboard") or [])[:5],
        "edge_brief": (edge.get("result") or {}).get("summary"),
        "taps": taps,
        "doctrine": DOCTRINE,
        "one_liner": ONE_LINER,
    }
