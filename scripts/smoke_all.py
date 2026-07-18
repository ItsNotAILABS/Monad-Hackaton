#!/usr/bin/env python3
"""End-to-end smoke without browser."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "engine"))

from fastapi.testclient import TestClient
from thesis_forge.api import app


def main() -> int:
    c = TestClient(app)
    h = c.get("/health").json()
    assert h["status"] == "operational", h
    print("health", h["version"])

    body = {
        "name": "Smoke Vault",
        "objective": "Coordinate Monad portfolio under user laws with agent proposals only.",
        "categories": ["vault", "dex", "lending"],
        "network": "monad-testnet",
        "persist": True,
    }
    p = c.post("/pipeline", json=body).json()
    assert p["ok"], p
    print("pipeline files", p["file_stats"]["n_files"], "rejected", p["arena"]["n_rejected"])

    a = c.post("/arena/auto", json=body).json()
    assert a["n_rejected"] >= 1
    print("arena winner", (a.get("winner") or {}).get("action", {}).get("agent"))

    g = c.post(
        "/academy/grade",
        json={"quest_id": "slippage-trap", "selected_action_index": 1, "understood": True},
    ).json()
    assert g["passed"]
    print("academy passed")

    j = c.get("/judge").json()
    assert j["vaporware"] is False
    print("judge ok", j["features"])

    home = c.get("/home").json()
    assert home.get("missions")
    c.post("/home/mission", json={"mission_id": "checkin"})
    c.post("/home/mission", json={"mission_id": "gas-tip", "acknowledged": True})
    print("home xp", c.get("/home").json().get("xp"))

    desk = c.get("/desk").json()
    assert "cash_usdc" in desk
    da = c.post("/desk/arena").json()
    assert da["n_rejected"] >= 1
    print("desk arena", da["n_accepted"], "accept", da["n_rejected"], "reject")

    marks = c.post("/desk/marks/refresh").json()
    assert marks.get("ok") and marks.get("feed", {}).get("marks")
    print("marks", marks["feed"]["marks"].get("MON/USDC"))

    st = c.post("/desk/strategies/market-make").json()
    assert st.get("ok")
    print("strategy", st["strategy"]["id"], st["n_accepted"], "accept")

    ai = c.get("/ai").json()
    assert ai.get("capabilities", {}).get("real_key_access") is False
    chat = c.post("/ai/chat", json={"message": "gas tip and show balances"}).json()
    assert chat.get("answer")
    print("ai node", ai.get("node", {}).get("node_id", "")[:12])

    co = c.post(
        "/company/run",
        json={
            "objective": "Grow my Monad position, keep 30% liquid, avoid leverage, and teach me."
        },
    ).json()
    assert co.get("ok") and co.get("sla_all_met") is True
    print("company mission", co["mission"]["status"], "winner", (co["mission"].get("winner") or {}).get("agent"))
    hq = c.get("/company").json()
    assert hq.get("brief") and hq.get("inbox")
    print("company HQ ok")

    land = c.get("/landing").json()
    assert land.get("ticker") and land.get("teaching_now")
    apps = land.get("apps") or {}
    assert "wallets" in apps and "vault" in apps and "desk" in apps
    assert "ai" in apps and "projects" in apps and "modules" in apps
    assert len(apps["modules"]) >= 6
    print(
        "landing laws",
        land.get("law_stack", {}).get("law_count"),
        "wallets",
        apps["wallets"].get("linked"),
        "vault",
        apps["vault"].get("deployed"),
        "projects",
        apps["projects"].get("count"),
        "modules",
        len(apps["modules"]),
    )

    wl = c.get("/wallets").json()
    assert "links" in wl and wl.get("security", {}).get("stores_private_keys") is False
    desk = c.get("/desk").json()
    assert "tickets_recent" in desk
    print("wallets/desk integrated ok")

    # Platform kernel
    plat = c.get("/platform").json()
    assert plat.get("product") == "THESIS Platform"
    assert plat["kernel"]["primitives_total"] >= 10
    assert plat["apps"]["first_party_count"] >= 10
    assert any(p.get("id") == "local_ai" for p in plat.get("primitives") or [])
    assert any(p.get("id") == "cloud" for p in plat.get("primitives") or [])
    inv = c.post(
        "/platform/apps/app.desk/invoke",
        json={"action": "arena"},
    ).json()
    assert inv.get("ok") and int((inv.get("result") or {}).get("n_rejected") or 0) >= 1
    print(
        "platform apps",
        plat["apps"]["total"],
        "fp",
        plat["apps"]["first_party_count"],
        "forged",
        plat["apps"]["forged_count"],
        "invoke reject",
        inv["result"]["n_rejected"],
    )

    eng = c.get("/engines").json()
    assert eng.get("count", 0) >= 6
    gas = c.post(
        "/engines/gas/run",
        json={"network": "monad-testnet", "params": {"estimated_gas": 80000}},
    ).json()
    assert gas.get("ok")
    idx = c.post("/engines/index/run", json={"params": {"op": "all"}}).json()
    assert idx.get("ok") and idx.get("result", {}).get("projects")
    print("cloud engines", eng["count"], "gas limit", (gas.get("result") or {}).get("recommended_gas_limit"))

    sys = c.get("/system").json()
    assert sys.get("surfaces") and sys.get("laws", 0) >= 15
    unified = c.post(
        "/system/run",
        json={
            "network": "monad-testnet",
            "query": "gas vault desk",
            "run_cloud": False,
            "run_company": True,
            "run_desk": True,
        },
    ).json()
    assert unified.get("ok") and unified.get("desk_arena")
    print(
        "system run",
        unified.get("headline", "")[:48],
        "reject",
        (unified.get("desk_arena") or {}).get("n_rejected"),
        "company",
        (unified.get("company") or {}).get("status"),
    )

    pg = c.get("/polyglot").json()
    assert pg.get("python", {}).get("available") is True
    mesh = c.post("/polyglot/mesh", json={"equity": 10000, "estimated_gas": 80000}).json()
    assert mesh.get("ok")
    print(
        "polyglot",
        "julia",
        pg.get("julia", {}).get("available"),
        "node",
        pg.get("node", {}).get("available"),
        "mesh",
        (mesh.get("synthesis") or {}).get("winner_agent"),
    )

    j = c.get("/judge").json()
    assert j.get("vaporware") is False
    print("proof pack ok vaporware", j.get("vaporware"))

    print("SMOKE_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
