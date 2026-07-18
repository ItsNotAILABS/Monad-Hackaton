"""Runtime-embedded laws of the ecosystem — governance, execution, intelligence, safety.

Mirrors how the company embeds owner constitution + protocol adapters at runtime:
the *ecosystem itself* has laws that every department must load and enforce.

Sources (compiled into deterministic runtime objects — no hallucination):
- Monad wallet/gas/async-execution doctrine
- MONSKILLS addresses / gas / tooling rules
- THESIS internal system laws (sandbox, twins, receipts)
- Protocol atlas adapter honesty

At startup / first call, `embed_ecosystem_laws()` freezes a lawbook into process memory
and seals a NERVUS receipt. Departments call `get_ecosystem_laws()` — never invent rules.
"""

from __future__ import annotations

import json
import threading
import time
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .atlas import PROTOCOLS, all_protocols
from .ecosystem import AGENT_STANDARDS, CANONICAL_MAINNET, TOKENS_MAINNET
from .network import NETWORKS
from .receipts import seal

_ROOT = Path(__file__).resolve().parents[2]
_CACHE_PATH = _ROOT / "receipts" / "ecosystem_laws_runtime.json"
_LOCK = threading.Lock()
_EMBEDDED: Optional[Dict[str, Any]] = None


# ── Law domains ────────────────────────────────────────────────────

def _system_self_laws() -> Dict[str, Any]:
    """Laws of THESIS itself — always on for governance of the company OS."""
    return {
        "domain": "system_self",
        "version": "1.0.0",
        "laws": [
            {
                "id": "sys.no-real-keys",
                "pillar": "safety",
                "severity": "critical",
                "rule": "Never store, request, log, or transmit private keys, seeds, or mnemonics.",
                "enforcement": "wallet_link_rejects_secrets; ai_node_no_export",
            },
            {
                "id": "sys.sandbox-first",
                "pillar": "safety",
                "severity": "critical",
                "rule": "AI mutations apply only to digital twins inside sandboxes unless owner promotes with signature.",
                "enforcement": "sandbox.mutate_twin; ai_wallet.allow_chain_broadcast=false",
            },
            {
                "id": "sys.nomos-veto",
                "pillar": "governance",
                "severity": "critical",
                "rule": "NOMOS may overrule every department. Profit never overrides constitution or ecosystem laws.",
                "enforcement": "company.run_nomos; evaluate()",
            },
            {
                "id": "sys.receipt-every-material-act",
                "pillar": "governance",
                "severity": "high",
                "rule": "Every material decision seals a hash-linked receipt (NERVUS).",
                "enforcement": "receipts.seal",
            },
            {
                "id": "sys.mandatory-simulation",
                "pillar": "execution",
                "severity": "high",
                "rule": "Irreversible execution requires simulation when constitution.mandatory_simulation is true.",
                "enforcement": "praxis; constitution",
            },
            {
                "id": "sys.owner-sovereign",
                "pillar": "governance",
                "severity": "critical",
                "rule": "Wallet owner remains sovereign; departments recommend; user signs.",
                "enforcement": "mission.awaiting_approval; praxis.requires_user_signature",
            },
            {
                "id": "sys.adapter-honesty",
                "pillar": "intelligence",
                "severity": "high",
                "rule": "adapter_status planned|simulated is not a live capital claim.",
                "enforcement": "atlas; custos",
            },
            {
                "id": "sys.kill-switch",
                "pillar": "safety",
                "severity": "critical",
                "rule": "Sandbox kill freezes all AI twin mutations immediately.",
                "enforcement": "sandbox.kill",
            },
        ],
    }


def _monad_network_laws() -> Dict[str, Any]:
    """Laws of the Monad chain ecosystem — embedded like protocol config."""
    return {
        "domain": "monad_network",
        "version": "1.0.0",
        "networks": {
            "monad-mainnet": {
                "chain_id": 143,
                "rpc": NETWORKS["monad-mainnet"]["rpc"],
                "explorer": NETWORKS["monad-mainnet"]["explorer"],
                "currency": "MON",
            },
            "monad-testnet": {
                "chain_id": 10143,
                "rpc": NETWORKS["monad-testnet"]["rpc"],
                "explorer": NETWORKS["monad-testnet"]["explorer"],
                "currency": "MON",
            },
        },
        "laws": [
            {
                "id": "monad.gas-bills-limit",
                "pillar": "execution",
                "severity": "critical",
                "rule": "Users pay gas_limit * price, not gas used. Fat buffers overcharge.",
                "params": {"margin_bps_recommended": 10750, "overspend_warn_multiplier": 10},
                "enforcement": "gas_intel; custos; praxis.gas_policy",
            },
            {
                "id": "monad.native-transfer-gas",
                "pillar": "execution",
                "severity": "high",
                "rule": "Native MON transfer gas is 21000 — hardcode, do not over-estimate.",
                "params": {"gas": 21000},
                "enforcement": "gas_intel",
            },
            {
                "id": "monad.no-global-mempool",
                "pillar": "intelligence",
                "severity": "high",
                "rule": "No global mempool view. Track local nonces; poll receipts; do not use newPendingTransactions.",
                "enforcement": "wallet_guide; custos",
            },
            {
                "id": "monad.finality",
                "pillar": "execution",
                "severity": "high",
                "rule": "Receipt = local execution; wait for finalized tag before irreversible off-chain settlement.",
                "params": {"block_time_ms": 400, "finality_blocks_approx": 2},
                "enforcement": "praxis; memoria",
            },
            {
                "id": "monad.reserve-balance-10-mon",
                "pillar": "safety",
                "severity": "high",
                "rule": "Spending that would drop undelegated account below 10 MON can fail under reserve rules.",
                "params": {"reserve_mon": 10},
                "enforcement": "custos; gas_intel",
            },
            {
                "id": "monad.tx-types",
                "pillar": "execution",
                "severity": "medium",
                "rule": "Support types 0,1,2,4. Reject type 3 (EIP-4844 blobs).",
                "params": {"supported": [0, 1, 2, 4], "rejected": [3]},
                "enforcement": "custos",
            },
            {
                "id": "monad.no-invent-addresses",
                "pillar": "safety",
                "severity": "critical",
                "rule": "Never invent contract addresses. Use embedded catalog, protocols repo, or user-provided verified addresses.",
                "enforcement": "ecosystem_laws.catalog; custos",
            },
            {
                "id": "monad.priority-fee-not-live",
                "pillar": "intelligence",
                "severity": "medium",
                "rule": "eth_maxPriorityFeePerGas may be hardcoded 2 gwei — do not treat as live network tip advice.",
                "enforcement": "gas_intel",
            },
        ],
    }


def _protocol_laws() -> Dict[str, Any]:
    """Laws derived from protocol atlas + known tokens at embed time."""
    protocols = []
    for p in all_protocols():
        protocols.append(
            {
                "id": p.id,
                "name": p.name,
                "category": p.category.value if hasattr(p.category, "value") else p.category,
                "adapter_status": p.adapter_status,
                "capabilities": list(p.capabilities),
                "live_capital_allowed": p.adapter_status == "live",
                "notes": p.notes or "",
            }
        )
    return {
        "domain": "protocols",
        "version": "1.0.0",
        "laws": [
            {
                "id": "proto.live-only-when-live",
                "pillar": "safety",
                "severity": "critical",
                "rule": "Do not route real capital through adapters marked planned or simulated.",
                "enforcement": "custos; praxis",
            },
            {
                "id": "proto.category-gate",
                "pillar": "governance",
                "severity": "high",
                "rule": "Actions must match protocol category and owner allowed_categories.",
                "enforcement": "nomos; policy.evaluate",
            },
            {
                "id": "proto.exact-approval",
                "pillar": "safety",
                "severity": "high",
                "rule": "Token approvals must be exact amount, never unlimited, unless owner law explicitly allows.",
                "enforcement": "praxis; custos",
            },
        ],
        "catalog": protocols,
        "tokens_mainnet": TOKENS_MAINNET,
        "canonical_mainnet": CANONICAL_MAINNET,
        "agent_standards": AGENT_STANDARDS,
        "sources": {
            "atlas": "thesis_forge.atlas.PROTOCOLS",
            "monskills_addresses": "local monskill/addresses",
            "protocols_repo": "https://github.com/monad-crypto/protocols",
        },
    }


def _intelligence_laws() -> Dict[str, Any]:
    return {
        "domain": "intelligence",
        "version": "1.0.0",
        "laws": [
            {
                "id": "intel.no-hallucinated-apy",
                "pillar": "intelligence",
                "severity": "high",
                "rule": "Do not invent yields or addresses. Prefer reject over fabricated opportunity.",
                "enforcement": "agora; sensus; academy",
            },
            {
                "id": "intel.explain-rejects",
                "pillar": "intelligence",
                "severity": "medium",
                "rule": "Every reject must produce human-readable reasons for owner and agents.",
                "enforcement": "policy.evaluate; explain",
            },
            {
                "id": "intel.teach-on-action",
                "pillar": "intelligence",
                "severity": "medium",
                "rule": "ACADEMY lessons attach to live missions, not abstract slide decks only.",
                "enforcement": "company.run_academy",
            },
            {
                "id": "intel.compete-plans",
                "pillar": "governance",
                "severity": "medium",
                "rule": "AGORA must file multiple agents including adversarial/unlawful control cases for NOMOS to demonstrate veto.",
                "enforcement": "run_agora",
            },
        ],
    }


def _execution_laws() -> Dict[str, Any]:
    return {
        "domain": "execution",
        "version": "1.0.0",
        "laws": [
            {
                "id": "exec.ordered-mission",
                "pillar": "execution",
                "severity": "high",
                "rule": "PRAXIS emits ordered steps: approve exact → action → verify → receipt.",
                "enforcement": "run_praxis",
            },
            {
                "id": "exec.no-silent-broadcast",
                "pillar": "execution",
                "severity": "critical",
                "rule": "No chain broadcast without owner approval path.",
                "enforcement": "mission.awaiting_approval",
            },
            {
                "id": "exec.re-sim-before-sign",
                "pillar": "execution",
                "severity": "high",
                "rule": "Stale quotes must be re-simulated before signature.",
                "enforcement": "custos.quote_freshness",
            },
        ],
    }


def build_lawbook() -> Dict[str, Any]:
    """Compile full ecosystem lawbook (fresh object)."""
    domains = [
        _system_self_laws(),
        _monad_network_laws(),
        _protocol_laws(),
        _intelligence_laws(),
        _execution_laws(),
    ]
    all_laws: List[Dict[str, Any]] = []
    for d in domains:
        for law in d.get("laws") or []:
            all_laws.append({**law, "domain": d["domain"]})

    index = {law["id"]: law for law in all_laws}
    by_pillar: Dict[str, List[str]] = {}
    by_severity: Dict[str, List[str]] = {}
    for law in all_laws:
        by_pillar.setdefault(law["pillar"], []).append(law["id"])
        by_severity.setdefault(law["severity"], []).append(law["id"])

    return {
        "schema": "thesis.ecosystem_laws.v1",
        "embedded_at": time.time(),
        "law_count": len(all_laws),
        "domains": {d["domain"]: d for d in domains},
        "index": index,
        "by_pillar": by_pillar,
        "by_severity": by_severity,
        "pillars": {
            "governance": by_pillar.get("governance", []),
            "execution": by_pillar.get("execution", []),
            "intelligence": by_pillar.get("intelligence", []),
            "safety": by_pillar.get("safety", []),
        },
        "doctrine": (
            "Owner constitution AND ecosystem laws embed at runtime. "
            "Departments load both. Neither may be silently skipped."
        ),
    }


def embed_ecosystem_laws(*, force: bool = False) -> Dict[str, Any]:
    """Embed (or return cached) ecosystem laws into process runtime."""
    global _EMBEDDED
    with _LOCK:
        if _EMBEDDED is not None and not force:
            return deepcopy(_EMBEDDED)
        book = build_lawbook()
        _EMBEDDED = book
        try:
            _CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
            _CACHE_PATH.write_text(json.dumps(book, indent=2), encoding="utf-8")
        except Exception:
            pass
        seal(
            "ecosystem_laws.embed",
            {
                "law_count": book["law_count"],
                "domains": list(book["domains"].keys()),
                "force": force,
            },
        )
        return deepcopy(book)


def get_ecosystem_laws() -> Dict[str, Any]:
    """Load embedded laws — embeds on first call."""
    if _EMBEDDED is None:
        return embed_ecosystem_laws()
    return deepcopy(_EMBEDDED)


def get_law(law_id: str) -> Optional[Dict[str, Any]]:
    book = get_ecosystem_laws()
    return (book.get("index") or {}).get(law_id)


def laws_for_pillar(pillar: str) -> List[Dict[str, Any]]:
    book = get_ecosystem_laws()
    ids = (
        (book.get("pillars") or {}).get(pillar)
        or (book.get("by_pillar") or {}).get(pillar)
        or []
    )
    idx = book.get("index") or {}
    return [idx[i] for i in ids if i in idx]


def check_proposal_against_ecosystem(
    proposal: Dict[str, Any],
    *,
    network: str = "monad-testnet",
) -> Tuple[bool, List[str], List[str]]:
    """Return (ok, violation_ids, human_reasons) for a strategy/ticket-like proposal."""
    book = get_ecosystem_laws()
    viol: List[str] = []
    reasons: List[str] = []
    title = (proposal.get("title") or "") + " " + (proposal.get("thesis") or "")
    low = title.lower()
    actions = proposal.get("actions") or []

    # live capital through non-live adapters
    proto_cat = {p["id"]: p for p in (book["domains"]["protocols"].get("catalog") or [])}
    for act in actions:
        pid = act.get("protocol") or act.get("venue_id") or ""
        meta = proto_cat.get(pid)
        if meta and not meta.get("live_capital_allowed") and act.get("value", 0) and act.get("force_live"):
            viol.append("proto.live-only-when-live")
            reasons.append(f"Protocol {pid} is {meta.get('adapter_status')} — not live capital.")

    # invented address heuristic — if address present and not in catalog
    known = set()
    for t in book["domains"]["protocols"].get("tokens_mainnet") or []:
        if t.get("address"):
            known.add(t["address"].lower())
    for c in book["domains"]["protocols"].get("canonical_mainnet") or []:
        if c.get("address"):
            known.add(c["address"].lower())
    for act in actions:
        addr = (act.get("target") or act.get("address") or "").lower()
        if addr.startswith("0x") and len(addr) == 42 and addr not in known:
            # allow sandbox demo placeholders
            if "000000" in addr or "kuru" in addr.lower():
                continue
            viol.append("monad.no-invent-addresses")
            reasons.append(f"Address {addr[:12]}… not in embedded catalog — verify before use.")

    # gas overspend on explicit gas_limit
    for act in actions:
        gl = act.get("gas_limit")
        est = act.get("estimated_gas") or act.get("gas_estimate")
        if gl and est and network in ("monad-testnet", "monad-mainnet", "eip155:10143", "eip155:143"):
            if int(gl) > int(est) * 10:
                viol.append("monad.gas-bills-limit")
                reasons.append("gas_limit > 10× estimate on Monad — user would overpay for unused limit.")

    # blob tx
    if proposal.get("tx_type") == 3:
        viol.append("monad.tx-types")
        reasons.append("EIP-4844 blob transactions are not supported on Monad.")

    viol = list(dict.fromkeys(viol))
    reasons = list(dict.fromkeys(reasons))
    return len(viol) == 0, viol, reasons


def enforce_on_department(
    department: str,
    context: Dict[str, Any],
) -> Dict[str, Any]:
    """Department-facing law check used by NOMOS/CUSTOS/PRAXIS/AI."""
    book = get_ecosystem_laws()
    relevant = []
    mapping = {
        "NOMOS": ["governance", "safety"],
        "CUSTOS": ["safety", "execution"],
        "PRAXIS": ["execution", "safety"],
        "SENSUS": ["intelligence"],
        "AGORA": ["intelligence", "governance"],
        "ACADEMY": ["intelligence"],
        "AI": ["safety", "intelligence", "governance"],
        "THESIS": ["governance", "safety", "execution", "intelligence"],
    }
    pillars = mapping.get(department.upper(), ["governance", "safety"])
    for p in pillars:
        relevant.extend(laws_for_pillar(p))

    proposal = context.get("proposal") or context
    ok, viol, reasons = check_proposal_against_ecosystem(
        proposal if isinstance(proposal, dict) else {},
        network=context.get("network") or "monad-testnet",
    )
    return {
        "department": department,
        "ok": ok,
        "violations": viol,
        "reasons": reasons,
        "laws_consulted": len(relevant),
        "law_ids_sample": [r["id"] for r in relevant[:8]],
        "embedded_at": book.get("embedded_at"),
        "law_count": book.get("law_count"),
    }


def runtime_status() -> Dict[str, Any]:
    book = get_ecosystem_laws()
    return {
        "schema": "thesis.ecosystem_laws.status.v1",
        "embedded": True,
        "embedded_at": book.get("embedded_at"),
        "law_count": book.get("law_count"),
        "domains": list((book.get("domains") or {}).keys()),
        "pillars": {k: len(v) for k, v in (book.get("pillars") or {}).items()},
        "doctrine": book.get("doctrine"),
        "cache_path": str(_CACHE_PATH),
    }
