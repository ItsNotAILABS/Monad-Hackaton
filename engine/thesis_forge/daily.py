"""Daily habit loop — missions, streaks, XP, rewards.

Everyday problem (Spark):
  DeFi confuses people; crypto workflow is tedious tab-hell;
  agents need seatbelts. Practical impact > ZK cosplay.

Reward loop (good addiction):
  Check-in → complete 3 teach-by-doing missions → XP + streak + badges.
  Miss a day → streak decays (gentle, not punitive spam).
"""

from __future__ import annotations

import json
import time
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from .academy import grade_quest, list_quests
from .ecosystem import ecosystem_bundle
from .gas_intel import gas_coach
from .receipts import seal
from .trading import desk_snapshot, load_desk, run_desk_arena

_ROOT = Path(__file__).resolve().parents[2]
_PATH = _ROOT / "receipts" / "daily_loop.json"

# XP economy
XP_CHECKIN = 10
XP_MISSION = 40
XP_STREAK_BONUS = 5  # per streak day, capped
XP_BADGE = 100

BADGES = [
    {"id": "first-blood", "name": "First blood", "need": "missions_total", "n": 1, "desc": "Complete any mission"},
    {"id": "reject-enjoyer", "name": "Reject enjoyer", "need": "rejects_seen", "n": 5, "desc": "Witness 5 policy/desk rejects"},
    {"id": "week-warrior", "name": "Week warrior", "need": "best_streak", "n": 7, "desc": "7-day streak"},
    {"id": "gas-literate", "name": "Gas literate", "need": "mission:gas-tip", "n": 1, "desc": "Complete gas coach mission"},
    {"id": "desk-pilot", "name": "Desk pilot", "need": "mission:desk-arena", "n": 3, "desc": "Desk arena mission ×3"},
    {"id": "academy-grad", "name": "Academy grad", "need": "mission:academy-lab", "n": 4, "desc": "Four academy missions"},
]


def _today() -> str:
    return date.today().isoformat()


def _load() -> Dict[str, Any]:
    if _PATH.exists():
        try:
            return json.loads(_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "schema": "thesis.daily.v1",
        "xp": 0,
        "level": 1,
        "streak": 0,
        "best_streak": 0,
        "last_checkin": None,
        "missions_total": 0,
        "rejects_seen": 0,
        "badges": [],
        "history": {},  # day -> {missions completed ids, xp_earned}
        "stats": {},
    }


def _save(data: Dict[str, Any]) -> None:
    _PATH.parent.mkdir(parents=True, exist_ok=True)
    data["updated_at"] = time.time()
    _PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _level(xp: int) -> int:
    # soft curve
    return max(1, int((xp / 100) ** 0.5) + 1)


def _day_missions(day_key: str) -> List[Dict[str, Any]]:
    """Rotate missions so every day feels fresh but teach-by-doing."""
    # hash day for rotation
    h = sum(ord(c) for c in day_key)
    quests = list_quests()
    q = quests[h % len(quests)] if quests else None
    return [
        {
            "id": "checkin",
            "title": "Morning seatbelt",
            "kind": "checkin",
            "xp": XP_CHECKIN,
            "minutes": 1,
            "problem": "Tab hell — open one home instead of six apps.",
            "do": "Check in to start today's streak.",
            "teach": "Consistency beats one heroic late-night rebalance.",
            "cta": "Check in",
        },
        {
            "id": "gas-tip",
            "title": "Gas reality check",
            "kind": "gas",
            "xp": XP_MISSION,
            "minutes": 2,
            "problem": "Monad bills gas_limit — fat buffers burn MON.",
            "do": "Read today's gas coach tip and acknowledge.",
            "teach": "estimate × 1.075, not ×2. Wallet guide approved.",
            "cta": "Complete gas tip",
        },
        {
            "id": "desk-arena",
            "title": "Reject a bad trade",
            "kind": "desk",
            "xp": XP_MISSION,
            "minutes": 3,
            "problem": "Bots propose degen tickets; you re-check for 20 minutes.",
            "do": "Run desk arena and confirm at least one REJECT.",
            "teach": "Reject is a feature. Agents propose; desk+laws decide.",
            "cta": "Run desk arena",
        },
        {
            "id": "academy-lab",
            "title": f"Lab: {q['title'] if q else 'DeFi failure'}",
            "kind": "academy",
            "xp": XP_MISSION,
            "minutes": 4,
            "problem": "Slippage/leverage stay abstract until you get rekt.",
            "do": f"Pass academy quest `{q['id'] if q else 'slippage-trap'}` with understanding.",
            "teach": "Learn DeFi by using it safely — fail in sim, not on mainnet.",
            "cta": "Open academy",
            "quest_id": q["id"] if q else "slippage-trap",
        },
        {
            "id": "ecosystem-glance",
            "title": "Know one asset",
            "kind": "ecosystem",
            "xp": XP_MISSION // 2,
            "minutes": 2,
            "problem": "People paste random token addresses from CT.",
            "do": "View today's featured mainnet asset (from MONSKILLS addresses).",
            "teach": "Never invent addresses — explorer-verify always.",
            "cta": "View ecosystem card",
        },
    ]


def home(network: str = "monad-testnet") -> Dict[str, Any]:
    data = _load()
    day = _today()
    hist = data.setdefault("history", {}).setdefault(day, {"completed": [], "xp": 0})
    missions = _day_missions(day)
    for m in missions:
        m["done"] = m["id"] in hist.get("completed", [])

    day_i = datetime.now(timezone.utc).timetuple().tm_yday
    gas = gas_coach(day_i)
    eco = ecosystem_bundle(network)
    tokens = eco.get("tokens") or []
    featured = tokens[day_i % len(tokens)] if tokens else {}

    desk = desk_snapshot()
    completed_n = len(hist.get("completed", []))
    total_n = len(missions)
    return {
        "schema": "thesis.home.v1",
        "product": "MonadBuilder HQ",
        "pitch": {
            "problem": "DeFi is confusing, crypto workflow is tedious, agents need brakes.",
            "solution": (
                "MonadBuilder HQ is your daily AI seatbelt: learn by doing, auto-reject bad plans, "
                "one home for the Monad ecosystem — AI delivers the morning."
            ),
            "roommate": "This saved me 20 minutes of re-checking bots and stopped a fat gas limit bill.",
        },
        "day": day,
        "xp": data.get("xp", 0),
        "level": _level(int(data.get("xp", 0))),
        "streak": data.get("streak", 0),
        "best_streak": data.get("best_streak", 0),
        "missions": missions,
        "progress": {
            "completed": completed_n,
            "total": total_n,
            "pct": round(100 * completed_n / max(total_n, 1)),
            "all_clear": completed_n >= total_n,
        },
        "badges": _badge_state(data),
        "gas_coach": gas,
        "featured_asset": featured,
        "ecosystem_preview": {
            "infra": eco.get("infra"),
            "problems": eco.get("problems"),
            "token_count": len(tokens),
        },
        "desk_pulse": {
            "equity": desk.get("equity"),
            "day_pnl": desk.get("day_pnl"),
            "open_notional": desk.get("open_notional"),
            "paper_mode": desk.get("paper_mode"),
        },
        "intelligence": _intel_blurb(data, desk, gas),
        "next_best_action": _next_action(missions, hist),
    }


def _intel_blurb(data: dict, desk: dict, gas: dict) -> Dict[str, str]:
    pnl = float(desk.get("day_pnl") or 0)
    if pnl < -50:
        mood = "Protect mode: day PnL is red — skip size, run rejects only."
    elif data.get("streak", 0) >= 3:
        mood = f"Streak {data['streak']}: keep the boring healthy loop. That's edge."
    else:
        mood = "Start with gas tip + one reject. Small daily reps compound."
    return {
        "headline": mood,
        "gas": gas["tip"]["title"],
        "detail": gas["tip"]["body"],
        "desk": f"Equity {desk.get('equity')} · open notional {desk.get('open_notional')}",
    }


def _next_action(missions: list, hist: dict) -> Dict[str, str]:
    done = set(hist.get("completed") or [])
    for m in missions:
        if m["id"] not in done:
            return {"mission_id": m["id"], "title": m["title"], "cta": m["cta"]}
    return {"mission_id": "done", "title": "Daily clear", "cta": "Come back tomorrow"}


def _badge_state(data: dict) -> List[Dict[str, Any]]:
    owned = set(data.get("badges") or [])
    out = []
    for b in BADGES:
        out.append({**b, "earned": b["id"] in owned})
    return out


def _award_badges(data: dict) -> List[str]:
    newly = []
    owned = set(data.get("badges") or [])
    stats = data.setdefault("stats", {})

    def has(need: str, n: int) -> bool:
        if need.startswith("mission:"):
            mid = need.split(":", 1)[1]
            return int(stats.get(f"mission_{mid}", 0)) >= n
        return int(data.get(need, 0) or stats.get(need, 0) or 0) >= n

    for b in BADGES:
        if b["id"] in owned:
            continue
        if has(b["need"], b["n"]):
            owned.add(b["id"])
            newly.append(b["id"])
            data["xp"] = int(data.get("xp", 0)) + XP_BADGE
    data["badges"] = sorted(owned)
    return newly


def complete_mission(mission_id: str, *, payload: Optional[dict] = None) -> Dict[str, Any]:
    """Complete a daily mission with proof hooks."""
    data = _load()
    day = _today()
    hist = data.setdefault("history", {}).setdefault(day, {"completed": [], "xp": 0})
    missions = {m["id"]: m for m in _day_missions(day)}
    if mission_id not in missions:
        return {"ok": False, "error": f"unknown mission {mission_id}"}
    if mission_id in hist["completed"]:
        return {"ok": True, "already": True, "home": home()}

    proof = payload or {}
    # Mission-specific gates
    if mission_id == "checkin":
        _checkin(data, day)
    elif mission_id == "gas-tip":
        if not proof.get("acknowledged"):
            return {"ok": False, "error": "Set acknowledged=true after reading the gas tip"}
    elif mission_id == "desk-arena":
        # auto-run arena if not provided
        if not proof.get("n_rejected"):
            report = run_desk_arena(load_desk())
            proof["n_rejected"] = report.get("n_rejected", 0)
            proof["n_accepted"] = report.get("n_accepted", 0)
        if int(proof.get("n_rejected") or 0) < 1:
            return {"ok": False, "error": "Need at least one REJECT from desk arena"}
        data["rejects_seen"] = int(data.get("rejects_seen", 0)) + int(proof["n_rejected"])
    elif mission_id == "academy-lab":
        qid = missions[mission_id].get("quest_id") or "slippage-trap"
        if proof.get("passed"):
            pass
        else:
            # try grade if client sent selection
            if "selected_action_index" in proof:
                g = grade_quest(qid, int(proof["selected_action_index"]), bool(proof.get("understood")))
                if not g.get("passed"):
                    return {"ok": False, "error": "Academy lab not passed", "grade": g}
            else:
                return {
                    "ok": False,
                    "error": "Pass academy lab first (selected_action_index + understood) or send passed=true",
                    "quest_id": qid,
                }
    elif mission_id == "ecosystem-glance":
        if not proof.get("viewed"):
            return {"ok": False, "error": "Set viewed=true after opening the featured asset"}

    m = missions[mission_id]
    xp_gain = int(m["xp"])
    if mission_id != "checkin":
        # streak bonus only after checkin exists
        xp_gain += min(int(data.get("streak", 0)), 7) * XP_STREAK_BONUS

    hist["completed"].append(mission_id)
    hist["xp"] = int(hist.get("xp", 0)) + xp_gain
    data["xp"] = int(data.get("xp", 0)) + xp_gain
    data["missions_total"] = int(data.get("missions_total", 0)) + 1
    stats = data.setdefault("stats", {})
    stats[f"mission_{mission_id}"] = int(stats.get(f"mission_{mission_id}", 0)) + 1
    data["level"] = _level(int(data["xp"]))

    new_badges = _award_badges(data)
    _save(data)
    seal(
        "daily.mission",
        {"day": day, "mission_id": mission_id, "xp_gain": xp_gain, "badges": new_badges},
    )
    return {
        "ok": True,
        "mission_id": mission_id,
        "xp_gain": xp_gain,
        "new_badges": new_badges,
        "home": home(),
    }


def _checkin(data: dict, day: str) -> None:
    last = data.get("last_checkin")
    if last == day:
        return
    if last:
        try:
            prev = date.fromisoformat(last)
            today = date.fromisoformat(day)
            delta = (today - prev).days
            if delta == 1:
                data["streak"] = int(data.get("streak", 0)) + 1
            elif delta > 1:
                data["streak"] = 1
            # delta==0 already returned
        except Exception:
            data["streak"] = 1
    else:
        data["streak"] = 1
    data["best_streak"] = max(int(data.get("best_streak", 0)), int(data.get("streak", 0)))
    data["last_checkin"] = day


def leaderboard_self() -> Dict[str, Any]:
    data = _load()
    return {
        "xp": data.get("xp", 0),
        "level": _level(int(data.get("xp", 0))),
        "streak": data.get("streak", 0),
        "best_streak": data.get("best_streak", 0),
        "missions_total": data.get("missions_total", 0),
        "badges": data.get("badges") or [],
        "rejects_seen": data.get("rejects_seen", 0),
    }
