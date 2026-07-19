"""THESIS MCP server — any external AI can call focused shippable tools.

Run (from engine/ with PYTHONPATH or installed package):
  python -m thesis_forge.mcp_server

Speaks JSON-RPC over stdin/stdout (MCP tools/list + tools/call subset).
HTTP mirror for non-MCP clients: GET /tools · POST /tools/{id}/run
"""

from __future__ import annotations

import json
import sys
from typing import Any, Dict

from .tools import mcp_tool_list, run_tool, tools_catalog
from .x_marketing import draft_from_recent_actions, draft_post, list_queue

# mcp name → thesis tool id
_MCP_TO_ID = {t["name"]: t["thesis_id"] for t in mcp_tool_list()}
# extra marketing aliases for external AIs
_MCP_TO_ID["thesis_x_from_actions"] = "x_draft"
_MCP_TO_ID["thesis_x_queue"] = "__x_queue__"
_MCP_TO_ID["thesis_agent_step"] = "agent_step"


def _respond(msg_id: Any, result: Any) -> None:
    sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": msg_id, "result": result}) + "\n")
    sys.stdout.flush()


def _error(msg_id: Any, code: int, message: str) -> None:
    sys.stdout.write(
        json.dumps(
            {"jsonrpc": "2.0", "id": msg_id, "error": {"code": code, "message": message}}
        )
        + "\n"
    )
    sys.stdout.flush()


def handle(msg: Dict[str, Any]) -> None:
    method = msg.get("method")
    msg_id = msg.get("id")
    params = msg.get("params") or {}

    if method == "initialize":
        _respond(
            msg_id,
            {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {
                    "name": "thesis-platform",
                    "version": tools_catalog().get("version", "2.6"),
                },
            },
        )
        return

    if method == "notifications/initialized":
        return

    if method == "tools/list":
        tools = list(mcp_tool_list())
        tools.append(
            {
                "name": "thesis_x_from_actions",
                "description": (
                    "Draft an X/Twitter marketing post from the user's real MonadBuilder actions "
                    "(rejects, streak, morning). Returns text + intent_url for owner to publish. "
                    "Ecosystem + user marketing — not silent spam."
                ),
                "inputSchema": {
                    "type": "object",
                    "properties": {"network": {"type": "string", "default": "monad-testnet"}},
                },
                "thesis_id": "x_draft",
            }
        )
        tools.append(
            {
                "name": "thesis_x_queue",
                "description": "List queued X marketing drafts (intent URLs).",
                "inputSchema": {
                    "type": "object",
                    "properties": {"limit": {"type": "integer", "default": 20}},
                },
                "thesis_id": "x_queue",
            }
        )
        _respond(msg_id, {"tools": tools})
        return

    if method == "tools/call":
        name = params.get("name") or ""
        args = params.get("arguments") or {}
        if not isinstance(args, dict):
            args = {}
        tool_id = _MCP_TO_ID.get(name) or name.replace("thesis_", "")
        if tool_id == "__x_queue__":
            out = {"ok": True, **list_queue(int(args.get("limit") or 20))}
        elif name in ("thesis_x_from_actions",) or (
            tool_id == "x_draft" and args.get("from_actions", True) and not args.get("action")
        ):
            d = draft_from_recent_actions(network=args.get("network") or "monad-testnet")
            out = {
                "ok": True,
                "result": d,
                "proof": d.get("text"),
                "intent_url": d.get("intent_url"),
                "note": "Owner posts via intent_url — AI drafts for ecosystem + user marketing",
            }
        else:
            out = run_tool(tool_id, args)
        text = json.dumps(out, indent=2)[:12000]
        _respond(
            msg_id,
            {
                "content": [{"type": "text", "text": text}],
                "isError": not out.get("ok", True),
            },
        )
        return

    if method == "ping":
        _respond(msg_id, {})
        return

    if msg_id is not None:
        _error(msg_id, -32601, f"method not found: {method}")


def main() -> None:
    # Optional banner on stderr so stdout stays pure JSON-RPC
    sys.stderr.write("THESIS MCP — focused tools ready (tools/list, tools/call)\n")
    sys.stderr.flush()
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(msg, dict):
            handle(msg)


if __name__ == "__main__":
    main()
