"""LawBook dual-stack bridge — on-chain registry ↔ runtime ecosystem laws.

Maps Solidity LawBook.seedDefaultLaws() ids to runtime ecosystem_laws.py.
"""

from __future__ import annotations

from typing import Any, Dict, List

from . import __version__
from .ecosystem_laws import embed_ecosystem_laws, get_ecosystem_laws, runtime_status
from .policy import RULES, DOCTRINE as ARENA_DOCTRINE

DOCTRINE = "Agents propose. Laws decide. Owner signs. Receipts remember."

# Mirrors contracts/src/LawBook.sol seedDefaultLaws()
ONCHAIN_SEED: List[Dict[str, str]] = [
    {"id": "sys.no-real-keys", "pillar": "safety", "severity": "critical", "domain": "system_self"},
    {"id": "sys.sandbox-first", "pillar": "safety", "severity": "critical", "domain": "system_self"},
    {"id": "sys.nomos-veto", "pillar": "governance", "severity": "critical", "domain": "system_self"},
    {"id": "sys.owner-sovereign", "pillar": "governance", "severity": "critical", "domain": "system_self"},
    {"id": "sys.receipt-every-material-act", "pillar": "governance", "severity": "high", "domain": "system_self"},
    {"id": "sys.mandatory-simulation", "pillar": "execution", "severity": "high", "domain": "system_self"},
    {"id": "sys.adapter-honesty", "pillar": "intelligence", "severity": "high", "domain": "system_self"},
    {"id": "sys.kill-switch", "pillar": "safety", "severity": "critical", "domain": "system_self"},
    {"id": "monad.gas-bills-limit", "pillar": "execution", "severity": "critical", "domain": "monad_network"},
    {"id": "monad.native-transfer-gas", "pillar": "execution", "severity": "high", "domain": "monad_network"},
    {"id": "monad.no-global-mempool", "pillar": "intelligence", "severity": "high", "domain": "monad_network"},
    {"id": "monad.finality", "pillar": "execution", "severity": "high", "domain": "monad_network"},
    {"id": "monad.no-invent-addresses", "pillar": "safety", "severity": "critical", "domain": "monad_network"},
    {"id": "monad.reserve-balance-10-mon", "pillar": "safety", "severity": "high", "domain": "monad_network"},
    {"id": "monad.tx-types", "pillar": "execution", "severity": "high", "domain": "monad_network"},
    {"id": "proto.exact-approval", "pillar": "safety", "severity": "high", "domain": "protocols"},
    {"id": "proto.live-only-when-live", "pillar": "safety", "severity": "critical", "domain": "protocols"},
    {"id": "proto.category-gate", "pillar": "governance", "severity": "high", "domain": "protocols"},
    {"id": "intel.no-hallucinated-apy", "pillar": "intelligence", "severity": "high", "domain": "intelligence"},
    {"id": "intel.explain-rejects", "pillar": "intelligence", "severity": "medium", "domain": "intelligence"},
    {"id": "intel.teach-on-action", "pillar": "intelligence", "severity": "medium", "domain": "intelligence"},
    {"id": "intel.compete-plans", "pillar": "intelligence", "severity": "medium", "domain": "intelligence"},
    {"id": "exec.no-silent-broadcast", "pillar": "execution", "severity": "critical", "domain": "execution"},
    {"id": "exec.ordered-mission", "pillar": "execution", "severity": "high", "domain": "execution"},
    {"id": "exec.re-sim-before-sign", "pillar": "execution", "severity": "high", "domain": "execution"},
]

# policy.evaluate violation id → ecosystem / lawbook narrative
VIOLATION_TO_LAW: Dict[str, str] = {
    "category-not-allowed": "proto.category-gate",
    "slippage-limit": "sys.nomos-veto",
    "protocol-exposure-limit": "sys.nomos-veto",
    "liquid-reserve-limit": "sys.nomos-veto",
    "leverage-limit": "sys.nomos-veto",
    "action-value-limit": "sys.nomos-veto",
}

STACK_CONTRACTS: List[Dict[str, str]] = [
    {"contract": "LawBook", "half": "ecosystem", "role": "On-chain law registry (this module)"},
    {"contract": "PolicyKernel", "half": "owner", "role": "Owner constitution, allowlists, daily cap"},
    {"contract": "ProposalBook", "half": "lifecycle", "role": "Proposals + reject reasons"},
    {"contract": "SovereignVault", "half": "execute", "role": "Policy-gated capital (Spark primary)"},
    {"contract": "ReceiptChain", "half": "audit", "role": "Hash-linked NERVUS spine"},
    {"contract": "AgentRegistry", "half": "agents", "role": "Agent identity / capabilities"},
]


def lawbook_payload(network: str = "monad-testnet") -> Dict[str, Any]:
    """GET /lawbook — dual stack status + seed alignment."""
    eco = embed_ecosystem_laws()
    book = get_ecosystem_laws()
    rt = runtime_status()
    index = book.get("index") or {}
    seed_ids = [s["id"] for s in ONCHAIN_SEED]
    runtime_ids = list(index.keys()) if index else []
    # protocol catalog entries are not string law ids in seed
    pure_laws = [i for i in runtime_ids if "." in i and not i.startswith("0x")]
    aligned = [i for i in seed_ids if i in index]
    missing_onchain = [i for i in pure_laws if i not in seed_ids and not i.startswith("proto.")]
    # Keep missing list small — only known governance laws not in seed
    missing_seed = [i for i in seed_ids if i not in index]

    by_domain: Dict[str, List[str]] = {}
    by_pillar: Dict[str, List[str]] = {}
    for s in ONCHAIN_SEED:
        by_domain.setdefault(s["domain"], []).append(s["id"])
        by_pillar.setdefault(s["pillar"], []).append(s["id"])

    return {
        "schema": "thesis.lawbook.v1",
        "version": __version__,
        "doctrine": DOCTRINE,
        "arena_doctrine": ARENA_DOCTRINE,
        "network": network,
        "product": "THESIS Platform",
        "description": (
            "LawBook is the on-chain ecosystem law registry — one half of the dual law stack "
            "with PolicyKernel (owner constitution). NOMOS arena mirrors both off-chain."
        ),
        "dual_stack": {
            "owner_constitution": {
                "onchain": "PolicyKernel.sol",
                "runtime": "company constitution → Policy",
                "enforcement": "policy.evaluate · PolicyKernel.validate",
            },
            "ecosystem_laws": {
                "onchain": "LawBook.sol",
                "runtime": "ecosystem_laws.py embed",
                "enforcement": "check_proposal_against_ecosystem · department SLAs",
            },
        },
        "onchain_seed": {
            "count": len(ONCHAIN_SEED),
            "laws": ONCHAIN_SEED,
            "by_domain": by_domain,
            "by_pillar": by_pillar,
            "file": "contracts/src/LawBook.sol",
            "seed_fn": "seedDefaultLaws()",
        },
        "runtime": {
            "law_count": eco.get("law_count") or rt.get("law_count"),
            "embedded_at": eco.get("embedded_at") or rt.get("embedded_at"),
            "domains": list((eco.get("domains") or rt.get("domains") or {}).keys())
            if isinstance(eco.get("domains") or rt.get("domains"), dict)
            else (eco.get("domains") or rt.get("domains")),
            "status": rt,
        },
        "alignment": {
            "seed_in_runtime": len(aligned),
            "seed_total": len(seed_ids),
            "aligned_ids": aligned,
            "missing_from_runtime": missing_seed,
            "ok": len(missing_seed) == 0,
        },
        "violation_map": VIOLATION_TO_LAW,
        "arena_rules": [r["id"] for r in RULES],
        "contracts": STACK_CONTRACTS,
        "governance_flow": [
            "1. Agents propose (AgentRegistry / AGORA / propose_plans)",
            "2. Arena evaluate under owner Policy (policy.py)",
            "3. Ecosystem LawBook checks (ecosystem_laws + on-chain registry)",
            "4. REJECT with reasons → ProposalBook / receipts (feature)",
            "5. Lawful winner → owner approve → SovereignVault (signature)",
        ],
        "apis": {
            "this": "GET /lawbook",
            "laws": "GET /laws · GET /laws/full · GET /laws/{id}",
            "nomos": "GET /nomos · POST /nomos/run",
            "tools": "POST /tools/laws/run · POST /tools/nomos_arena/run",
        },
        "docs": ["docs/LAWBOOK.md", "docs/ECOSYSTEM_LAWS.md", "docs/NOMOS.md", "docs/VS_WINNERS.md"],
        "beats_crowd": "Agent wallets with basic allowlists — THESIS has a real law registry + dual stack",
    }
