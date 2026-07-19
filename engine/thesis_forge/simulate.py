"""Dry-run execution path — narrative steps without keys or chain writes."""

from __future__ import annotations

from typing import Any, Dict, List

from .models import Action, Policy
from .policy import evaluate


def simulate_execution(action: Action, policy: Policy, *, vault_balance: float = 1000.0) -> Dict[str, Any]:
    """Walk an action through NOMOS → vault gate → receipt (all simulated)."""
    steps: List[Dict[str, Any]] = []
    ev = evaluate(action, policy)

    steps.append(
        {
            "id": "sense",
            "name": "Sense intent",
            "ok": True,
            "detail": f"Agent '{action.agent}' proposes {action.action} on {action.protocol} value={action.value}",
        }
    )
    steps.append(
        {
            "id": "policy",
            "name": "PolicyKernel.validate",
            "ok": ev.accepted,
            "detail": ev.human_summary,
            "violations": ev.violations,
            "reasons": ev.reasons,
        }
    )

    if not ev.accepted:
        steps.append(
            {
                "id": "halt",
                "name": "Halt (no call)",
                "ok": True,
                "detail": "Vault execute never runs. Capital unchanged. Receipt optional for reject telemetry.",
            }
        )
        return {
            "schema": "thesis.simulate.v1",
            "would_execute": False,
            "evaluation": ev.model_dump(mode="json"),
            "steps": steps,
            "balances": {
                "vault_before": vault_balance,
                "vault_after": vault_balance,
                "delta": 0.0,
            },
            "narrative": (
                f"SIM REJECT: {action.agent} blocked. "
                + "; ".join(ev.reasons or ev.violations)
            ),
        }

    if action.value > vault_balance:
        steps.append(
            {
                "id": "balance",
                "name": "Balance check",
                "ok": False,
                "detail": f"value {action.value} > vault_balance {vault_balance}",
            }
        )
        return {
            "schema": "thesis.simulate.v1",
            "would_execute": False,
            "evaluation": ev.model_dump(mode="json"),
            "steps": steps,
            "balances": {
                "vault_before": vault_balance,
                "vault_after": vault_balance,
                "delta": 0.0,
            },
            "narrative": "SIM BLOCKED: insufficient vault balance (dry-run).",
        }

    steps.append(
        {
            "id": "balance",
            "name": "Balance check",
            "ok": True,
            "detail": f"vault_balance {vault_balance} covers value {action.value}",
        }
    )
    steps.append(
        {
            "id": "call",
            "name": "SovereignVault.execute (simulated)",
            "ok": True,
            "detail": f"Would call target via policy-gated execute; slippage_bps={action.slippage_bps}",
        }
    )
    steps.append(
        {
            "id": "receipt",
            "name": "ReceiptChain.seal (simulated)",
            "ok": True,
            "detail": "Would seal hash-linked receipt for audit trail.",
        }
    )
    after = vault_balance - float(action.value)
    return {
        "schema": "thesis.simulate.v1",
        "would_execute": True,
        "evaluation": ev.model_dump(mode="json"),
        "steps": steps,
        "balances": {
            "vault_before": vault_balance,
            "vault_after": after,
            "delta": -float(action.value),
        },
        "narrative": (
            f"SIM ALLOW: {action.agent} would execute on {action.protocol}. "
            f"Vault {vault_balance} → {after}. Still requires real user signature on-chain."
        ),
        "warning": "Simulation is not a transaction. No private keys used.",
    }


def simulate_arena_winner(report: dict, policy: Policy, vault_balance: float = 1000.0) -> Dict[str, Any]:
    from .models import Action as A

    winner = report.get("winner")
    if not winner:
        return {
            "schema": "thesis.simulate.v1",
            "would_execute": False,
            "narrative": "No lawful winner to simulate.",
            "steps": [],
        }
    action = A(**winner["action"])
    return simulate_execution(action, policy, vault_balance=vault_balance)
