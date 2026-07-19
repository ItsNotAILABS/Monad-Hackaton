"""Research engine — server-side autonomous research using platform state + chain pulse."""

from __future__ import annotations

import re
import time
from typing import Any, Dict, List, Optional

from ..atlas import all_protocols
from ..ecosystem import ecosystem_bundle
from ..ecosystem_laws import embed_ecosystem_laws, laws_for_pillar
from ..gas_intel import gas_coach
from ..marks import live_marks
from ..trading import desk_snapshot
from .base import CloudEngine
from .chain_engine import ChainEngine


class ResearchEngine(CloudEngine):
    id = "research"
    name = "Research Engine"
    kind = "agent"
    description = "Cloud research: query → ecosystem + desk + laws + live chain pulse → brief"
    requires_chain = True

    def run(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        p = params or {}
        query = (p.get("query") or p.get("q") or "Monad gas and vault safety").strip()
        network = p.get("network") or "monad-testnet"
        t0 = time.time()

        # Block obvious secrets in cloud logs
        if re.search(r"\b([a-z]+\s+){11,23}[a-z]+\b", query, re.I) or re.search(
            r"\b(?:0x)?[a-fA-F0-9]{64}\b", query
        ):
            return {
                "ok": False,
                "error": "Refusing secret-like material in research query (keys/seeds).",
                "laws": ["sys.no-real-keys"],
            }

        embed_ecosystem_laws()
        eco = ecosystem_bundle(network)
        desk = desk_snapshot()
        marks = live_marks(network)
        gas = gas_coach(int(time.time()) // 3600)
        chain = ChainEngine().run({"network": network, "op": "pulse"})
        protocols = [
            {
                "id": x.id,
                "name": x.name,
                "category": x.category.value if hasattr(x.category, "value") else x.category,
                "adapter_status": x.adapter_status,
            }
            for x in all_protocols()[:12]
        ]

        qlow = query.lower()
        hits: List[Dict[str, str]] = []
        for tok in re.findall(r"[a-z0-9./-]{3,}", qlow):
            for pr in protocols:
                blob = f"{pr['id']} {pr['name']} {pr['category']}".lower()
                if tok in blob:
                    hits.append(
                        {
                            "type": "protocol",
                            "id": pr["id"],
                            "detail": f"{pr['name']} · {pr['adapter_status']}",
                        }
                    )
            for law in laws_for_pillar("safety") + laws_for_pillar("execution"):
                if tok in law["id"] or tok in (law.get("rule") or "").lower():
                    hits.append({"type": "law", "id": law["id"], "detail": law.get("rule", "")[:120]})

        # dedupe
        seen = set()
        uniq = []
        for h in hits:
            k = (h["type"], h["id"])
            if k in seen:
                continue
            seen.add(k)
            uniq.append(h)

        insights = []
        if "gas" in qlow or "limit" in qlow:
            insights.append(
                {
                    "title": "Monad gas bills the limit",
                    "body": f"Coach: {(gas.get('tip') or {}).get('title')}. Live gwei: {chain.get('gas_price_gwei')}",
                    "laws": ["monad.gas-bills-limit"],
                }
            )
        if "vault" in qlow or "policy" in qlow:
            insights.append(
                {
                    "title": "SovereignVault is policy-gated",
                    "body": "Execute only after PolicyKernel.validate; no silent broadcast.",
                    "laws": ["exec.no-silent-broadcast", "sys.owner-sovereign"],
                }
            )
        if "wallet" in qlow or "key" in qlow:
            insights.append(
                {
                    "title": "Public wallets only",
                    "body": "Link public addresses; AI twins never hold real keys.",
                    "laws": ["sys.no-real-keys", "sys.sandbox-first"],
                }
            )
        if not insights:
            insights.append(
                {
                    "title": "Platform pulse",
                    "body": (
                        f"Desk equity {desk.get('equity')} · laws embedded · "
                        f"chain block {chain.get('block_number')} · match={chain.get('chain_match')}"
                    ),
                    "laws": ["intel.no-hallucinated-apy"],
                }
            )

        brief = {
            "query": query,
            "summary": " · ".join(i["title"] for i in insights[:4]),
            "insights": insights,
            "hits": uniq[:16],
            "desk": {
                "equity": desk.get("equity"),
                "day_pnl": desk.get("day_pnl"),
                "paper_mode": desk.get("paper_mode"),
            },
            "marks": marks.get("marks"),
            "chain": {
                "ok": chain.get("ok"),
                "block": chain.get("block_number"),
                "chain_id": chain.get("observed_chain_id"),
                "gas_gwei": chain.get("gas_price_gwei"),
            },
            "ecosystem": {
                "token_count": len(eco.get("tokens") or []),
                "problems": eco.get("problems"),
            },
            "protocols_sample": protocols[:6],
            "elapsed_ms": (time.time() - t0) * 1000,
            "locality": "cloud",
            "hosted_web_app": True,
        }
        return {"ok": True, "brief": brief}
