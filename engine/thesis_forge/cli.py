"""Unified CLI for MonadBuilder+ and THESIS public HTTP surfaces."""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

APP_DEFAULT = os.environ.get("MONADBUILDER_URL", "https://monados.medinatechlabs.net")
ENGINE_DEFAULT = os.environ.get("THESIS_URL", "")


def _base(value: str) -> str:
    return str(value or "").strip().rstrip("/")


def _engine(app: str, explicit: str) -> str:
    return _base(explicit) or f"{_base(app)}/engine"


def _pairs(values: list[str], numbers: bool = False) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for item in values:
        if "=" not in item:
            raise ValueError(f"expected KEY=VALUE, got {item}")
        key, value = item.split("=", 1)
        out[key] = float(value) if numbers else value
    return out


def _call(base: str, path: str, method: str = "GET", data: dict[str, Any] | None = None, timeout: float = 15) -> Any:
    url = f"{_base(base)}/{path.lstrip('/')}"
    body = json.dumps(data).encode() if data is not None else None
    request = urllib.request.Request(url, data=body, method=method, headers={"Accept": "application/json", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode(errors="replace")
        raise RuntimeError(f"{method} {url} failed ({exc.code}): {raw or exc.reason}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"cannot reach {url}: {exc.reason}") from exc


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(prog="monadbuilder", description="Operate MonadBuilder+ and THESIS from one CLI")
    root.add_argument("--app-url", default=APP_DEFAULT)
    root.add_argument("--engine-url", default=ENGINE_DEFAULT)
    root.add_argument("--timeout", type=float, default=15)
    root.add_argument("--compact", action="store_true")
    commands = root.add_subparsers(dest="command", required=True)
    commands.add_parser("status")
    commands.add_parser("rpc")

    chain = commands.add_parser("chain")
    chain.add_argument("operation", choices=["block", "gas"])

    wallets = commands.add_parser("wallets")
    w = wallets.add_subparsers(dest="wallet_command", required=True)
    w.add_parser("architecture")
    w.add_parser("supported")
    w.add_parser("list")

    generate = w.add_parser("generate")
    generate.add_argument("--label", default="My Wallet")
    generate.add_argument("--role", choices=["user", "agent", "learner", "educator"], default="user")
    generate.add_argument("--notes", default="")

    link = w.add_parser("link")
    link.add_argument("address")
    link.add_argument("--kind", default="metamask")
    link.add_argument("--chain", default="eip155:10143")
    link.add_argument("--label", default="")
    link.add_argument("--provider", default="")
    link.add_argument("--role", default="user")
    link.add_argument("--custody")
    link.add_argument("--account-type")
    link.add_argument("--namespace", default="personal")
    link.add_argument("--owner-ref", default="local")
    link.add_argument("--policy-profile", default="owner-controlled")
    link.add_argument("--session-ref", default="")
    link.add_argument("--tag", action="append", default=[])
    link.add_argument("--capability", action="append", default=[])
    link.add_argument("--balance", action="append", default=[])
    link.add_argument("--meta", action="append", default=[])

    primary = w.add_parser("primary")
    primary.add_argument("wallet_id")
    balances = w.add_parser("balances")
    balances.add_argument("wallet_id")
    balances.add_argument("balance", nargs="+")
    sync = w.add_parser("sync")
    sync.add_argument("--wallet-id", default="")
    sync.add_argument("--sandbox-id", default="")
    unlink = w.add_parser("unlink")
    unlink.add_argument("wallet_id")

    company = commands.add_parser("company")
    company.add_argument("objective")
    receipts = commands.add_parser("receipts")
    receipts.add_argument("--limit", type=int, default=20)
    terminal = commands.add_parser("terminal")
    terminal.add_argument("line")
    terminal.add_argument("--network", default="monad-testnet")
    raw = commands.add_parser("raw")
    raw.add_argument("target", choices=["app", "engine"])
    raw.add_argument("method", choices=["GET", "POST", "PUT", "PATCH", "DELETE"])
    raw.add_argument("path")
    raw.add_argument("--data", default="{}")
    return root


def run(args: argparse.Namespace) -> Any:
    app = _base(args.app_url)
    engine = _engine(app, args.engine_url)
    timeout = args.timeout
    if args.command == "status":
        return {"app": _call(app, "/api/health", timeout=timeout), "engine": _call(engine, "/health", timeout=timeout), "origins": {"app": app, "engine": engine}}
    if args.command == "rpc":
        return _call(engine, "/rpc/probe", timeout=timeout)
    if args.command == "chain":
        return _call(app, f"/api/chain/{args.operation}", timeout=timeout)
    if args.command == "wallets":
        if args.wallet_command == "architecture": return _call(engine, "/wallets/architecture", timeout=timeout)
        if args.wallet_command == "supported": return _call(engine, "/wallets/supported", timeout=timeout)
        if args.wallet_command == "list": return _call(engine, "/wallets/v2", timeout=timeout)
        if args.wallet_command == "generate":
            return _call(app, "/api/wallets/generate", "POST", {"label": args.label, "role": args.role, "notes": args.notes or None}, timeout)
        if args.wallet_command == "link":
            capabilities = [key for key, value in _pairs(args.capability).items() if str(value).lower() in {"true", "1", "yes"}]
            payload = {"kind": args.kind, "address": args.address, "chain": args.chain, "label": args.label, "provider": args.provider, "role": args.role, "custody": args.custody, "account_type": args.account_type, "namespace": args.namespace, "owner_ref": args.owner_ref, "policy_profile": args.policy_profile, "session_ref": args.session_ref, "tags": args.tag, "capabilities": capabilities, "balances": _pairs(args.balance, True), "metadata": _pairs(args.meta)}
            return _call(engine, "/wallets/v2/link", "POST", payload, timeout)
        if args.wallet_command == "primary": return _call(engine, f"/wallets/v2/{urllib.parse.quote(args.wallet_id)}/primary", "POST", {}, timeout)
        if args.wallet_command == "balances": return _call(engine, f"/wallets/v2/{urllib.parse.quote(args.wallet_id)}/balances", "POST", {"balances": _pairs(args.balance, True)}, timeout)
        if args.wallet_command == "sync":
            query = urllib.parse.urlencode({k: v for k, v in {"wallet_id": args.wallet_id, "sandbox_id": args.sandbox_id}.items() if v})
            return _call(engine, f"/wallets/v2/sync-twins{'?' + query if query else ''}", "POST", {}, timeout)
        if args.wallet_command == "unlink": return _call(engine, f"/wallets/v2/{urllib.parse.quote(args.wallet_id)}", "DELETE", timeout=timeout)
    if args.command == "company": return _call(engine, "/company/run", "POST", {"objective": args.objective}, timeout)
    if args.command == "receipts": return _call(engine, f"/receipts/recent?limit={args.limit}", timeout=timeout)
    if args.command == "terminal": return _call(engine, "/terminal/exec", "POST", {"command": args.line, "network": args.network}, timeout)
    if args.command == "raw":
        data = json.loads(args.data)
        if not isinstance(data, dict): raise ValueError("--data must be a JSON object")
        return _call(app if args.target == "app" else engine, args.path, args.method, None if args.method == "GET" else data, timeout)
    raise ValueError("unknown command")


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        result = run(args)
        print(json.dumps(result, indent=None if args.compact else 2, sort_keys=True))
        return 0
    except (RuntimeError, ValueError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
