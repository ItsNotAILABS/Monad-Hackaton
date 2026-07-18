from __future__ import annotations
from datetime import datetime, timezone
from hashlib import sha256
import json, re, uuid
from .atlas import by_categories
from .models import BuildManifest, BuildRequest

ENGINES = ["THESIS", "SENSUS", "MATHESIS", "NOMOS", "AGORA", "PRAXIS", "CUSTOS", "MEMORIA", "NERVUS", "CODEX", "TEST"]
CONTRACTS = ["SovereignVault", "PolicyKernel", "AgentRegistry", "ProposalBook", "ExecutionRouter", "ReceiptChain"]

def compile_manifest(request: BuildRequest) -> BuildManifest:
    slug = re.sub(r"[^a-z0-9]+", "-", request.name.lower()).strip("-")
    project_id = f"{slug}-{uuid.uuid4().hex[:8]}"
    payload = {
        "project_id": project_id,
        "name": request.name,
        "objective": request.objective,
        "network": request.network,
        "chain_id": 10143 if request.network == "monad-testnet" else 143,
        "protocols": [p.model_dump(mode="json") for p in by_categories(request.categories)],
        "policy": request.policy.model_dump(mode="json"),
        "contracts": CONTRACTS,
        "engines": ENGINES,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    digest = sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    return BuildManifest(**payload, manifest_hash=digest)
