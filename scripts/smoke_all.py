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
    print("landing laws", land.get("law_stack", {}).get("law_count"))

    print("SMOKE_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
