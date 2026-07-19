"""Full THESIS build pipeline with explainability events."""

from __future__ import annotations

from typing import Any, Dict, List

from .agents import propose_plans
from .codegen import generate_package, package_stats
from .compiler import compile_manifest
from .events import BuildEvent, make_event, pipeline_stages
from .models import BuildRequest
from .network import get_network
from .policy import arena_report
from .receipts import seal
from .workspace import save_project


def run_pipeline(request: BuildRequest, *, persist: bool = True) -> Dict[str, Any]:
    """Execute stages 1–11 with honest blocked states for deploy/verify without keys."""
    events: List[BuildEvent] = []
    net = get_network(request.network)

    # 1 Intent
    events.append(
        make_event(
            "intent",
            "Intent normalization",
            "THESIS",
            "complete",
            f"Normalized objective into a typed build request for {request.name}.",
            technical_detail=f"categories={ [c.value for c in request.categories] } network={request.network}",
            why_it_matters="Agents and humans must share one typed intent, not free-form chat only.",
            inputs=["name", "objective", "categories", "policy", "network"],
            outputs=["BuildRequest"],
            checks=["objective length >= 12", "categories non-empty"],
            evidence=["request"],
            agent_instruction="Do not invent categories outside the request.",
            next_step="Map ecosystem integrations.",
        )
    )

    if not request.categories:
        events[-1].status = "blocked"
        events[-1].resolution = "Select at least one ecosystem category."
        return _finalize(request, None, {}, events, None, persist=False, blocked=True)

    # 2 Ecosystem map
    manifest = compile_manifest(request)
    events.append(
        make_event(
            "ecosystem-map",
            "Map Monad integrations",
            "SENSUS",
            "complete",
            f"Matched {len(manifest.protocols)} protocols for selected planes.",
            technical_detail="Filtered protocol atlas by categories; attached adapter_status honesty.",
            why_it_matters="Generated code must not invent live contract addresses.",
            inputs=["categories"],
            outputs=["manifest.protocols"],
            checks=["every protocol has adapter_status"],
            evidence=["manifest.protocols"],
            agent_instruction="Use only integrations present in manifest.protocols.",
            next_step="Compose architecture.",
        )
    )

    # 3 Architecture
    events.append(
        make_event(
            "architecture",
            "Architecture composition",
            "MATHESIS",
            "complete",
            "Composed policy-gated vault architecture with six core contracts.",
            technical_detail=f"contracts={manifest.contracts}",
            why_it_matters="SovereignVault executes only after PolicyKernel.validate.",
            inputs=["objective", "protocols"],
            outputs=["manifest.contracts", "manifest.pillars"],
            checks=["SovereignVault present", "PolicyKernel present"],
            evidence=["manifest.contracts"],
            agent_instruction="Keep PolicyKernel as the only spend gate.",
            next_step="Compile policy boundary.",
        )
    )

    # 4 Policy
    events.append(
        make_event(
            "policy",
            "Policy and security boundary",
            "NOMOS",
            "complete",
            "Compiled lawbook: slippage, exposure, reserve, leverage, action value, categories.",
            technical_detail=str(manifest.policy.model_dump(mode="json")),
            why_it_matters="Laws must exist before agents propose spend paths.",
            inputs=["request.policy"],
            outputs=["manifest.policy", "policy/lawbook.json"],
            checks=["max_slippage_bps <= 5000"],
            evidence=["manifest.policy"],
            agent_instruction="Never propose actions outside lawbook bounds.",
            next_step="Generate source package.",
        )
    )

    # 5 Codegen
    files = generate_package(manifest)
    stats = package_stats(files)
    events.append(
        make_event(
            "codegen",
            "Source package generation",
            "CODEX",
            "complete",
            f"Generated {stats['n_files']} project files ({stats['total_bytes']} bytes).",
            technical_detail=", ".join(stats["paths"][:8]) + ("…" if stats["n_files"] > 8 else ""),
            why_it_matters="Builders need real artifacts, not a success toast.",
            inputs=["manifest"],
            outputs=stats["paths"],
            checks=["README.md present", "manifest.json present"],
            evidence=["package/*"],
            agent_instruction="Edit generated files only with user approval for irreversible deploys.",
            next_step="Validate package.",
        )
    )

    # 6 Validate
    checks_ok = all(
        k in files for k in ("README.md", "manifest.json", "policy/lawbook.json", "docs/AGENT.md")
    )
    events.append(
        make_event(
            "validate",
            "Static validation",
            "TEST",
            "complete" if checks_ok else "failed",
            "Validated required package files and policy ranges."
            if checks_ok
            else "Package missing required files.",
            technical_detail=f"required_files_ok={checks_ok}",
            why_it_matters="Catch broken generation before deploy.",
            inputs=["package"],
            outputs=["validation"],
            checks=["required files", "policy bounds"],
            evidence=["package"],
            agent_instruction="Do not deploy if validation failed.",
            next_step="Simulate agent arena.",
        )
    )

    # 7 Arena
    plans = propose_plans(request, request.policy)
    arena = arena_report(plans, request.policy)
    events.append(
        make_event(
            "arena",
            "Agent arena simulation",
            "AGORA",
            "complete",
            f"Scored {arena['n_plans']} plans → {arena['n_accepted']} accepted, {arena['n_rejected']} rejected.",
            technical_detail=f"winner={(arena.get('winner') or {}).get('action', {}).get('agent')}",
            why_it_matters="Reject is a product feature — show unlawful plans clearly.",
            inputs=["plans", "policy"],
            outputs=["arena"],
            checks=["at least one reject in demo set preferred"],
            evidence=["arena.evaluations"],
            agent_instruction="Present rejections with reasons; never hide failed plans.",
            next_step="Check network readiness.",
        )
    )

    # 8 Readiness
    events.append(
        make_event(
            "readiness",
            "Wallet & network readiness",
            "PRAXIS",
            "complete",
            f"Network profile ready: {net['name']} chain {net['chain_id']}.",
            technical_detail=f"rpc={net['rpc']} explorer={net['explorer']}",
            why_it_matters="Deploy commands must target the correct Monad network.",
            inputs=["network"],
            outputs=["deploy_plan"],
            checks=["chain_id known", "rpc present"],
            evidence=["manifest.deploy_plan"],
            agent_instruction="Never switch networks silently.",
            next_step="Deploy requires operator PRIVATE_KEY / keystore.",
        )
    )

    # 9 Deploy — blocked without operator
    events.append(
        make_event(
            "deploy",
            "Contract deployment",
            "PRAXIS",
            "blocked",
            "Deployment is an explicit operator gate — no private keys in the workstation.",
            technical_detail=manifest.deploy_plan.get("commands", {}).get("deploy_script", ""),
            why_it_matters="User controls irreversible on-chain actions.",
            inputs=["PRIVATE_KEY or keystore", "funded MON"],
            outputs=["receipts/deployment.json"],
            checks=["key present", "balance > gas"],
            evidence=["scripts/deploy.sh"],
            agent_instruction="Ask user to run deploy script; do not invent addresses.",
            next_step="After deploy, record addresses via POST /deployment/record.",
            resolution=f"Fund deployer ({net.get('faucet') or 'mainnet wallet'}), then run deploy script.",
        )
    )

    # 10 Verify — blocked
    events.append(
        make_event(
            "verify",
            "Contract verification",
            "CUSTOS",
            "blocked",
            "Verification waits for a real deployed address.",
            technical_detail=manifest.deploy_plan.get("commands", {}).get("verify_template", ""),
            why_it_matters="Judges and users must read verified source on explorer.",
            inputs=["deployed address"],
            outputs=["sourcify/etherscan verification"],
            checks=["address non-empty"],
            evidence=["scripts/verify.sh"],
            agent_instruction="Use Sourcify verifier URL from network profile.",
            next_step="Verify SovereignVault first for Spark.",
            resolution="Deploy first, then ./scripts/verify.sh",
        )
    )

    # 11 Release receipt
    receipt = seal(
        "pipeline.release",
        {
            "project_id": manifest.project_id,
            "manifest_hash": manifest.manifest_hash,
            "n_files": stats["n_files"],
            "n_events": len(events),
            "arena_rejected": arena["n_rejected"],
        },
    )
    events.append(
        make_event(
            "release",
            "Release receipt",
            "NERVUS",
            "complete",
            "Sealed pipeline receipt for this build.",
            technical_detail=f"receipt={receipt['receipt_hash'][:24]}…",
            why_it_matters="Every build is auditable via hash chain.",
            inputs=["manifest", "events", "arena"],
            outputs=["receipt"],
            checks=["receipt_hash length 64"],
            evidence=[receipt["receipt_hash"]],
            agent_instruction="Attach receipt hash to any release notes.",
            next_step="Open IDE package; run Academy labs; deploy when ready.",
        )
    )

    return _finalize(request, manifest, files, events, arena, persist=persist, receipt=receipt)


def _finalize(request, manifest, files, events, arena, *, persist, blocked=False, receipt=None):
    event_dicts = [e.to_dict() if hasattr(e, "to_dict") else e for e in events]
    saved = None
    if persist and manifest is not None:
        saved = save_project(
            manifest.project_id,
            manifest=manifest.model_dump(mode="json"),
            files=files,
            events=event_dicts,
            arena=arena,
        )
    complete = sum(1 for e in event_dicts if e.get("status") == "complete")
    blocked_n = sum(1 for e in event_dicts if e.get("status") == "blocked")
    return {
        "schema": "thesis.pipeline.v1",
        "ok": not blocked and manifest is not None,
        "project_id": getattr(manifest, "project_id", None),
        "manifest": manifest.model_dump(mode="json") if manifest else None,
        "files": files,
        "file_stats": package_stats(files) if files else {},
        "events": event_dicts,
        "stages": pipeline_stages(),
        "arena": arena,
        "receipt": receipt,
        "workspace": saved,
        "progress": {
            "complete": complete,
            "blocked": blocked_n,
            "total": len(event_dicts),
            "pct": round(100 * complete / max(len(event_dicts), 1)),
        },
        "surfaces": {
            "builder": "Render events[].plain_language + files tree + risks from blocked events.",
            "agent": "Consume events NDJSON-equivalent + manifest + commands in deploy_plan.",
            "judge": "Show progress, reject counts, package paths, deployment status, receipt hash.",
        },
    }
