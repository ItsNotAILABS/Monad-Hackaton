"""STUDIO — intent compiler + deploy plan generator."""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from hashlib import sha256

from .atlas import by_categories
from .models import BuildManifest, BuildRequest
from .network import CONTRACT_ORDER, PILLARS, get_network

# Branding map (not separate process runtimes) — honesty in charter
ENGINE_LABELS = [
    "THESIS",
    "SENSUS",
    "MATHESIS",
    "NOMOS",
    "AGORA",
    "PRAXIS",
    "CUSTOS",
    "MEMORIA",
    "NERVUS",
    "CODEX",
    "TEST",
]


def build_deploy_plan(network: str) -> dict:
    net = get_network(network)
    chain = net["chain_id"]
    rpc = net["rpc"]
    verify_url = net["sourcify_url"]
    return {
        "schema": "thesis.deploy_plan.v1",
        "network": net["id"],
        "chain_id": chain,
        "rpc": rpc,
        "explorer": net["explorer"],
        "faucet": net.get("faucet"),
        "order": list(CONTRACT_ORDER),
        "primary_submission_contract": "SovereignVault",
        "commands": {
            "install_foundry": [
                "curl -L https://foundry.category.xyz | bash",
                "foundryup --network monad",
            ],
            "compile": "cd contracts && forge build",
            "test": "cd contracts && forge test",
            "deploy_script": f"./scripts/deploy.sh {'mainnet' if chain == 143 else 'testnet'}",
            "forge_script": (
                f"cd contracts && forge script script/Deploy.s.sol:Deploy "
                f"--rpc-url {rpc} --broadcast -vvv"
            ),
            "verify_template": (
                f"forge verify-contract <ADDRESS> src/<Name>.sol:<Name> "
                f"--chain {chain} --verifier sourcify --verifier-url {verify_url}"
            ),
        },
        "docs": {
            "deploy": net["docs_deploy"],
            "verify": net["docs_verify"],
        },
        "env": {
            "PRIVATE_KEY": "(never commit — Foundry keystore preferred)",
            "MONAD_TESTNET_RPC_URL": "https://testnet-rpc.monad.xyz",
            "DEPLOYER_OWNER": "(vault owner address)",
        },
        "warnings": [
            "Alpha contracts are not audited.",
            "Do not put production capital without independent review.",
            "Adapter_status simulated ≠ live protocol integration.",
        ],
    }


def compile_manifest(request: BuildRequest) -> BuildManifest:
    slug = re.sub(r"[^a-z0-9]+", "-", request.name.lower()).strip("-") or "thesis"
    project_id = f"{slug}-{uuid.uuid4().hex[:8]}"
    net = get_network(request.network)
    deploy_plan = build_deploy_plan(request.network)
    protocols = by_categories(request.categories)
    payload = {
        "project_id": project_id,
        "name": request.name,
        "objective": request.objective,
        "network": request.network,
        "chain_id": net["chain_id"],
        "protocols": [p.model_dump(mode="json") for p in protocols],
        "policy": request.policy.model_dump(mode="json"),
        "contracts": list(CONTRACT_ORDER),
        "pillars": PILLARS,
        "engines": ENGINE_LABELS,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "deploy_plan": deploy_plan,
    }
    digest = sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()
    return BuildManifest(**payload, manifest_hash=digest)


def studio_scaffold_files(manifest: BuildManifest) -> dict:
    """Lightweight generated artifacts for IDE panel (no LLM required)."""
    policy = manifest.policy
    solidity_hint = f"""// Policy snapshot for {manifest.name}
// maxSlippageBps = {policy.max_slippage_bps}
// maxProtocolExposureBps = {policy.max_protocol_exposure_bps}
// minLiquidReserveBps = {policy.min_liquid_reserve_bps}
// maxLeverageBps = {policy.max_leverage_bps}
// Deploy: {manifest.deploy_plan.get('commands', {}).get('deploy_script')}
// Primary Spark address: SovereignVault
"""
    readme = f"""# {manifest.name}

Objective: {manifest.objective}

Network: {manifest.network} (chain {manifest.chain_id})
Manifest: `{manifest.manifest_hash[:16]}…`

## Next
1. Review lawbook in NOMOS
2. Run Academy reject labs
3. `forge test` then deploy script
4. Verify on MonadVision Sourcify
"""
    return {
        "POLICY_HINT.sol.txt": solidity_hint,
        "PROJECT.md": readme,
        "manifest_hash": manifest.manifest_hash,
    }
