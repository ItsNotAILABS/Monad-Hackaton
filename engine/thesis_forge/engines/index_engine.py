"""Index engine — workspace packages, protocols, receipts tip, deployment."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

from ..atlas import all_protocols
from ..receipts import recent, tip
from ..workspace import list_projects
from .base import CloudEngine

_ROOT = Path(__file__).resolve().parents[3]
_DEPLOY = _ROOT / "receipts" / "deployment.json"


class IndexEngine(CloudEngine):
    id = "index"
    name = "Index Engine"
    kind = "data"
    description = "Index forged packages, protocols atlas, receipts, deployment for the web app"
    requires_chain = False

    def run(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        p = params or {}
        op = (p.get("op") or "all").lower()
        projects = list_projects()
        protocols = [
            {
                "id": x.id,
                "name": x.name,
                "category": x.category.value if hasattr(x.category, "value") else str(x.category),
                "adapter_status": x.adapter_status,
            }
            for x in all_protocols()
        ]
        dep = {}
        if _DEPLOY.exists():
            try:
                dep = json.loads(_DEPLOY.read_text(encoding="utf-8"))
            except Exception:
                dep = {}

        receipts = recent(int(p.get("n") or 12))
        out = {
            "ok": True,
            "op": op,
            "projects": {
                "count": len(projects),
                "items": [
                    {
                        "project_id": x.get("project_id"),
                        "n_files": x.get("n_files"),
                        "network": x.get("network"),
                        "saved_at": x.get("saved_at"),
                    }
                    for x in projects[:25]
                ],
            },
            "protocols": {
                "count": len(protocols),
                "by_status": _count_by(protocols, "adapter_status"),
                "items": protocols[:20],
            },
            "receipts": {
                "tip": tip()[:24],
                "recent": [
                    {"kind": r.get("kind"), "hash": (r.get("receipt_hash") or "")[:18]}
                    for r in receipts
                ],
            },
            "deployment": {
                "status": dep.get("status"),
                "vault": dep.get("primary_submission_address")
                or (dep.get("contracts") or {}).get("SovereignVault"),
                "chainId": dep.get("chainId") or dep.get("chain_id"),
                "network": dep.get("network"),
            },
            "locality": "cloud",
        }
        if op == "projects":
            return {"ok": True, "op": op, "projects": out["projects"]}
        if op == "protocols":
            return {"ok": True, "op": op, "protocols": out["protocols"]}
        if op == "deployment":
            return {"ok": True, "op": op, "deployment": out["deployment"]}
        return out


def _count_by(items: list, key: str) -> Dict[str, int]:
    d: Dict[str, int] = {}
    for it in items:
        k = str(it.get(key) or "unknown")
        d[k] = d.get(k, 0) + 1
    return d
