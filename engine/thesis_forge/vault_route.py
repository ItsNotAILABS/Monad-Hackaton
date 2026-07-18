"""Route a desk ticket through SovereignVault.execute — simulation + calldata.

Does not send transactions. Builds operator-ready payload for Foundry/cast
when vault + venue targets are known.
"""

from __future__ import annotations

import json
from typing import Any, Dict, Optional
from pathlib import Path

from .models import Policy
from .policy import evaluate
from .receipts import seal
from .trading import TradeTicket, _ticket_to_action, load_desk

_ROOT = Path(__file__).resolve().parents[2]
_DEPLOY = _ROOT / "receipts" / "deployment.json"

# Placeholder target for simulated venue router (not a real deployed address)
_VENUE_TARGETS = {
    "kuru": "0xKuruRouter000000000000000000000000000001",
    "uniswap": "0xAmmRouter0000000000000000000000000000002",
    "perpl": "0xPerpsRouter00000000000000000000000000003",
    "leverup": "0xLeverRouter00000000000000000000000000004",
}


def _load_vault_address() -> str:
    if _DEPLOY.exists():
        try:
            data = json.loads(_DEPLOY.read_text(encoding="utf-8"))
            return (
                data.get("primary_submission_address")
                or (data.get("contracts") or {}).get("SovereignVault")
                or ""
            )
        except Exception:
            pass
    return ""


def _encode_swap_calldata(ticket: TradeTicket) -> str:
    """Human-readable pseudo-ABI (hex-looking) for demos — not ABI-encoded."""
    # Minimal selector-like prefix for readability in UI
    selector = "0xa9059cbb"  # stand-in; real route uses venue-specific routers
    raw = f"{ticket.side}:{ticket.pair}:{ticket.qty}:{ticket.limit_price}:{ticket.venue_id}"
    payload = raw.encode().hex()
    return selector + payload[:64].ljust(64, "0")


def simulate_vault_route(
    ticket_id: str,
    *,
    policy: Optional[Policy] = None,
    vault_address: Optional[str] = None,
) -> Dict[str, Any]:
    """Tie a desk ticket to a SovereignVault.execute simulation."""
    desk = load_desk()
    ticket = next((t for t in desk.tickets if t.ticket_id == ticket_id), None)
    if not ticket:
        return {"ok": False, "error": f"ticket {ticket_id} not found"}

    pol = policy or desk.policy
    action = _ticket_to_action(ticket)
    nomos = evaluate(action, pol)
    vault = vault_address or _load_vault_address()
    target = _VENUE_TARGETS.get(ticket.venue_id, "0x0000000000000000000000000000000000000000")
    value_wei = int(ticket.notional * 1e18) if ticket.notional else int(ticket.qty * ticket.limit_price * 1e18)
    # For ERC20 swaps value is often 0 native; keep notional metadata separate
    native_value = 0
    calldata = _encode_swap_calldata(ticket)
    slippage = ticket.slippage_bps

    steps = [
        {
            "id": "load-ticket",
            "ok": True,
            "detail": f"{ticket.status} {ticket.side} {ticket.pair} via {ticket.venue_id}",
        },
        {
            "id": "nomos",
            "ok": nomos.accepted,
            "detail": nomos.human_summary,
            "violations": nomos.violations,
        },
    ]

    if ticket.status == "risk_rejected" or not nomos.accepted:
        steps.append(
            {
                "id": "vault",
                "ok": False,
                "detail": "SovereignVault.execute would REVERT on policy — no calldata broadcast.",
            }
        )
        return {
            "ok": True,
            "schema": "thesis.vault_route.v1",
            "would_execute": False,
            "ticket": ticket.model_dump(mode="json"),
            "steps": steps,
            "narrative": "Route blocked: desk/NOMOS reject. Vault never called.",
            "calldata": None,
            "vault": vault or None,
        }

    if ticket.status not in ("risk_accepted", "paper_filled", "routed_sim"):
        steps.append(
            {
                "id": "status",
                "ok": False,
                "detail": f"Ticket status {ticket.status} is not routable",
            }
        )
        return {
            "ok": False,
            "error": f"status {ticket.status} not routable",
            "steps": steps,
        }

    steps.append(
        {
            "id": "encode",
            "ok": True,
            "detail": "Encoded venue route calldata (demo encoding; replace with real router ABI).",
        }
    )
    steps.append(
        {
            "id": "vault-execute",
            "ok": True,
            "detail": (
                f"SovereignVault.execute(target={target[:10]}…, value={native_value}, "
                f"slippageBps={slippage}, data=0x…)"
            ),
        }
    )
    steps.append(
        {
            "id": "receipt",
            "ok": True,
            "detail": "On success ReceiptChain.seal emits audit hash (onchain).",
        }
    )

    cast_cmd = (
        f'cast send {vault or "<VAULT>"} '
        f'"execute(address,uint256,uint256,bytes)" '
        f"{target} {native_value} {slippage} {calldata} "
        f"--rpc-url $MONAD_TESTNET_RPC_URL --account monad-deployer"
    )
    forge_hint = {
        "function": "execute(address target,uint256 value,uint256 slippageBps,bytes data)",
        "args": {
            "target": target,
            "value": native_value,
            "slippageBps": slippage,
            "data": calldata,
        },
        "notional_usdc": ticket.notional or ticket.qty * ticket.limit_price,
        "warning": "Demo calldata is not production ABI. Wire real venue router before mainnet.",
    }

    # mark ticket routed_sim if was paper_filled or risk_accepted
    if ticket.status in ("risk_accepted", "paper_filled"):
        ticket.status = "routed_sim"
        from .trading import save_desk

        ticket.updated_at = __import__("time").time()
        save_desk(desk)

    rc = seal(
        "trading.vault_route",
        {
            "ticket_id": ticket.ticket_id,
            "vault": vault,
            "target": target,
            "would_execute": True,
        },
    )

    return {
        "ok": True,
        "schema": "thesis.vault_route.v1",
        "would_execute": True,
        "ticket": ticket.model_dump(mode="json"),
        "steps": steps,
        "narrative": (
            f"SIM ROUTE: ticket {ticket.ticket_id} → vault.execute → {ticket.venue_id}. "
            "Operator must sign; no key in browser."
        ),
        "vault": vault or None,
        "vault_configured": bool(vault),
        "calldata": forge_hint,
        "cast_command": cast_cmd,
        "receipt": rc,
        "next": (
            "Record SovereignVault via POST /deployment/record then re-run for real address."
            if not vault
            else "Review cast command in operator shell with funded keystore."
        ),
    }
