"""X (Twitter) marketing for user actions + Monad ecosystem.

Drafts and queues posts about real product activity (rejects, morning, signals, builds).
Does NOT spam without owner intent. Modes:
  - draft: generate copy + store
  - intent: return x.com/intent/tweet URL for user one-click post
  - queue: list pending
  - optional bearer post if X_BEARER_TOKEN + X_API enabled (opt-in)

MCP tools expose the same surface for any external AI.
"""

from __future__ import annotations

import json
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import quote

from .brand import PRODUCT, PRODUCT_SHORT, TAGLINE
from .receipts import seal

_ROOT = Path(__file__).resolve().parents[2]
_QUEUE = _ROOT / "receipts" / "x_marketing_queue.json"

HASHTAGS = "#Monad #MonadBuilder #BuildOnMonad #DeFi #Spark"


def _load_q() -> dict:
    if _QUEUE.exists():
        try:
            return json.loads(_QUEUE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"schema": "monadbuilder.x_queue.v1", "items": []}


def _save_q(data: dict) -> None:
    _QUEUE.parent.mkdir(parents=True, exist_ok=True)
    _QUEUE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def intent_url(text: str) -> str:
    return f"https://twitter.com/intent/tweet?text={quote(text[:280])}"


def compose_action_post(action: str, detail: Optional[Dict[str, Any]] = None) -> str:
    """Compose marketing post from a real action."""
    d = detail or {}
    action = (action or "ops").lower()

    if action in ("morning", "builder.morning", "habit.morning"):
        text = (
            f"Just ran my {PRODUCT_SHORT} AI morning on Monad — "
            f"seatbelt check-in, gas discipline, and celebrated a REJECT. "
            f"Agents propose. Laws decide. I sign. {HASHTAGS}"
        )
    elif action in ("reject", "arena", "safety.reject"):
        n = d.get("n_rejected", d.get("rejects", 1))
        text = (
            f"REJECT is a feature. Desk arena blocked {n} bad plan(s) under dual-stack law. "
            f"That's {PRODUCT_SHORT} on Monad — brakes before capital. {HASHTAGS}"
        )
    elif action in ("signal", "auto", "market.auto"):
        text = (
            f"Winner-class signals + paper auto-exec under LawBook on Monad. "
            f"Not allowlist cosplay — {PRODUCT_SHORT} keeps me sovereign. {HASHTAGS}"
        )
    elif action in ("report", "pdf"):
        text = (
            f"Exported a full ops report from {PRODUCT} — brief, vault, laws, scorecard. "
            f"Building in public on Monad. {HASHTAGS}"
        )
    elif action in ("hybrid", "worker"):
        text = (
            f"Blockchain + Web Worker hybrid: agents score off the main thread, "
            f"laws still decide on Monad. Novel tech in {PRODUCT_SHORT}. {HASHTAGS}"
        )
    elif action in ("forge", "code", "pipeline"):
        text = (
            f"Forged a package on Monad with {PRODUCT_SHORT} — pipeline + arena + receipts. "
            f"Building real product, not vapor. {HASHTAGS}"
        )
    elif action in ("streak", "daily", "brief"):
        streak = d.get("streak", "")
        text = (
            f"Day {streak} on the {PRODUCT_SHORT} seatbelt loop — "
            f"text brief, tiny missions, capital protected. {HASHTAGS}"
        )
    else:
        text = (
            f"Building on Monad with {PRODUCT}: {TAGLINE} "
            f"Action: {action}. {HASHTAGS}"
        )

    # hard cap 280
    if len(text) > 280:
        text = text[:277] + "…"
    return text


def draft_post(
    action: str,
    detail: Optional[Dict[str, Any]] = None,
    *,
    custom_text: str = "",
    network: str = "monad-testnet",
) -> Dict[str, Any]:
    text = (custom_text or "").strip() or compose_action_post(action, detail)
    item = {
        "id": f"x-{uuid.uuid4().hex[:10]}",
        "action": action,
        "text": text,
        "intent_url": intent_url(text),
        "network": network,
        "detail": detail or {},
        "status": "draft",
        "created_at": time.time(),
        "marketing": {
            "for_user": True,
            "for_ecosystem": True,
            "ecosystem": "Monad",
            "product": PRODUCT,
        },
    }
    q = _load_q()
    q.setdefault("items", []).insert(0, item)
    q["items"] = q["items"][:100]
    _save_q(q)
    seal("x.draft", {"id": item["id"], "action": action})
    return item


def draft_from_recent_actions(network: str = "monad-testnet") -> Dict[str, Any]:
    """Pick a strong recent-style action for marketing (from live pulse)."""
    from .daily import home as daily_home
    from .trading import load_desk, run_desk_arena

    h = daily_home(network)
    streak = h.get("streak") or 0
    # prefer reject story if arena has rejects
    try:
        ar = run_desk_arena(load_desk())
        if int(ar.get("n_rejected") or 0) >= 1:
            return draft_post("reject", {"n_rejected": ar.get("n_rejected")}, network=network)
    except Exception:
        pass
    if streak:
        return draft_post("streak", {"streak": streak}, network=network)
    return draft_post("morning", {"streak": streak}, network=network)


def list_queue(limit: int = 20) -> Dict[str, Any]:
    q = _load_q()
    items = (q.get("items") or [])[:limit]
    return {
        "schema": "monadbuilder.x_queue.list.v1",
        "n": len(items),
        "items": items,
        "note": "Owner posts via intent_url — AI drafts, you publish (sovereign marketing)",
    }


def mark_posted(draft_id: str) -> Dict[str, Any]:
    q = _load_q()
    for it in q.get("items") or []:
        if it.get("id") == draft_id:
            it["status"] = "posted_by_user"
            it["posted_at"] = time.time()
            _save_q(q)
            seal("x.posted_by_user", {"id": draft_id})
            return {"ok": True, "item": it}
    return {"ok": False, "error": "draft not found"}


def x_catalog() -> Dict[str, Any]:
    return {
        "schema": "monadbuilder.x_marketing.v1",
        "product": PRODUCT,
        "purpose": "AI drafts ecosystem + user marketing posts from real actions",
        "modes": {
            "draft": "POST /x/draft — generate + queue",
            "from_actions": "POST /x/from-actions — auto pick strong action",
            "queue": "GET /x/queue",
            "intent": "item.intent_url — user posts in browser (no API key)",
            "mark_posted": "POST /x/mark-posted — after user publishes",
        },
        "mcp_tools": [
            "thesis_x_draft",
            "thesis_x_from_actions",
            "thesis_x_queue",
        ],
        "sovereign": "AI never posts privately without owner; intent URL is default",
        "hashtags": HASHTAGS,
    }
