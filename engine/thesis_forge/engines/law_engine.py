"""Law engine — runtime ecosystem laws + proposal checks on the server."""

from __future__ import annotations

from typing import Any, Dict, Optional

from ..ecosystem_laws import (
    check_proposal_against_ecosystem,
    embed_ecosystem_laws,
    enforce_on_department,
    get_law,
    laws_for_pillar,
    runtime_status,
)
from .base import CloudEngine


class LawEngine(CloudEngine):
    id = "law"
    name = "Law Engine"
    kind = "governance"
    description = "Embed/consult ecosystem laws; check proposals; department enforcement"
    requires_chain = False

    def run(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        p = params or {}
        op = (p.get("op") or "status").lower()
        embed_ecosystem_laws()

        if op == "pillar":
            pillar = p.get("pillar") or "safety"
            laws = laws_for_pillar(pillar)
            return {
                "ok": True,
                "op": "pillar",
                "pillar": pillar,
                "count": len(laws),
                "laws": laws[:20],
            }

        if op == "get":
            law_id = p.get("law_id") or "monad.gas-bills-limit"
            law = get_law(law_id)
            return {"ok": law is not None, "op": "get", "law": law}

        if op == "check":
            proposal = p.get("proposal") or {
                "title": p.get("title") or "cloud check",
                "tx_type": p.get("tx_type"),
                "actions": p.get("actions") or [],
            }
            ok, viol, reasons = check_proposal_against_ecosystem(
                proposal, network=p.get("network") or "monad-testnet"
            )
            return {
                "ok": True,
                "op": "check",
                "accepted": ok,
                "violations": viol,
                "reasons": reasons,
            }

        if op == "enforce":
            dept = p.get("department") or "THESIS"
            ctx = p.get("context") or {
                "network": p.get("network") or "monad-testnet",
                "proposal": p.get("proposal") or {"title": "cloud enforce", "actions": []},
            }
            return {"ok": True, "op": "enforce", "result": enforce_on_department(dept, ctx)}

        st = runtime_status()
        return {
            "ok": True,
            "op": "status",
            "status": st,
            "sample_safety": [x["id"] for x in laws_for_pillar("safety")[:5]],
            "sample_execution": [x["id"] for x in laws_for_pillar("execution")[:5]],
        }
