"""Hash-linked receipt chain (off-chain NERVUS spine)."""

from __future__ import annotations

import json
import time
from hashlib import sha256
from typing import Any, Dict, Optional

_GENESIS = "0" * 64
_TIP = _GENESIS
_HISTORY: list[dict[str, Any]] = []


def seal(
    kind: str,
    payload: dict,
    previous_hash: Optional[str] = None,
    *,
    remember: bool = True,
) -> dict:
    global _TIP
    prev = previous_hash if previous_hash is not None else (_TIP if remember else _GENESIS)
    body: Dict[str, Any] = {
        "schema": "thesis.receipt.v1",
        "kind": kind,
        "payload": payload,
        "previous_hash": prev,
        "ts": time.time(),
    }
    receipt_hash = sha256(
        json.dumps(body, sort_keys=True, default=str).encode()
    ).hexdigest()
    out = {**body, "receipt_hash": receipt_hash}
    if remember:
        _TIP = receipt_hash
        _HISTORY.append(out)
        if len(_HISTORY) > 500:
            del _HISTORY[:-500]
    return out


def tip() -> str:
    return _TIP


def recent(n: int = 20) -> list[dict[str, Any]]:
    return list(_HISTORY[-n:])


def reset_chain() -> None:
    """Test helper only."""
    global _TIP, _HISTORY
    _TIP = _GENESIS
    _HISTORY = []
