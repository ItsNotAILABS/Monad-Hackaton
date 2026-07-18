"""Academy learning progress — local JSON, no accounts required."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, List

from .academy import list_quests

_ROOT = Path(__file__).resolve().parents[2]
_PATH = _ROOT / "receipts" / "academy_progress.json"


def _load() -> Dict[str, Any]:
    if _PATH.exists():
        try:
            return json.loads(_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "schema": "thesis.academy.progress.v1",
        "passed": {},
        "attempts": {},
        "updated_at": 0,
    }


def _save(data: Dict[str, Any]) -> None:
    _PATH.parent.mkdir(parents=True, exist_ok=True)
    data["updated_at"] = time.time()
    _PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def record_attempt(quest_id: str, passed: bool) -> Dict[str, Any]:
    data = _load()
    attempts = data.setdefault("attempts", {})
    attempts[quest_id] = int(attempts.get(quest_id, 0)) + 1
    if passed:
        data.setdefault("passed", {})[quest_id] = {
            "at": time.time(),
            "attempts": attempts[quest_id],
        }
    _save(data)
    return summary()


def summary() -> Dict[str, Any]:
    data = _load()
    quests = list_quests()
    ids = [q["id"] for q in quests]
    passed = data.get("passed") or {}
    n_pass = sum(1 for i in ids if i in passed)
    return {
        "schema": "thesis.academy.progress.v1",
        "total_quests": len(ids),
        "passed_count": n_pass,
        "pct": round(100 * n_pass / max(len(ids), 1)),
        "passed_ids": list(passed.keys()),
        "attempts": data.get("attempts") or {},
        "certificate_ready": n_pass >= len(ids) and len(ids) > 0,
        "certificate_line": (
            "I failed safely on Monad before I spent for real — full Academy clear."
            if n_pass >= len(ids) and len(ids) > 0
            else f"Academy progress {n_pass}/{len(ids)}. Reject is a feature."
        ),
        "updated_at": data.get("updated_at"),
    }
