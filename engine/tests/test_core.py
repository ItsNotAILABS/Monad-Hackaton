"""Production test suite for THESIS engine v0.3."""

from fastapi.testclient import TestClient

from thesis_forge.academy import grade_quest, list_quests
from thesis_forge.agents import propose_plans
from thesis_forge.api import app
from thesis_forge.codegen import generate_package, package_stats
from thesis_forge.compiler import compile_manifest
from thesis_forge.models import Action, BuildRequest, Category, Policy
from thesis_forge.network import get_network
from thesis_forge.pipeline import run_pipeline
from thesis_forge.policy import arbitrate, arena_report, evaluate
from thesis_forge.receipts import reset_chain, seal
from thesis_forge.workspace import list_projects, load_project


def request():
    return BuildRequest(
        name="Sovereign DeFi",
        objective="Coordinate Monad protocols under user-owned financial laws.",
        categories=list(Category),
    )


def test_network_constants():
    t = get_network("monad-testnet")
    m = get_network("monad-mainnet")
    assert t["chain_id"] == 10143
    assert m["chain_id"] == 143


def test_manifest_chain():
    m = compile_manifest(request())
    assert m.chain_id == 10143
    assert len(m.contracts) == 6
    assert "SovereignVault" in m.contracts
    assert m.deploy_plan["primary_submission_contract"] == "SovereignVault"


def test_codegen_package():
    m = compile_manifest(request())
    files = generate_package(m)
    stats = package_stats(files)
    assert stats["n_files"] >= 8
    assert "README.md" in files
    assert "docs/AGENT.md" in files
    assert "policy/lawbook.json" in files
    assert "src/config.ts" in files


def test_pipeline_full():
    reset_chain()
    out = run_pipeline(request(), persist=True)
    assert out["ok"]
    assert out["progress"]["complete"] >= 8
    assert out["file_stats"]["n_files"] >= 8
    assert out["arena"]["n_rejected"] >= 1
    assert out["workspace"]["ok"]
    loaded = load_project(out["project_id"])
    assert loaded and loaded.get("files")
    assert any(p["project_id"] == out["project_id"] for p in list_projects())


def test_agents_propose_and_arena():
    req = request()
    plans = propose_plans(req)
    assert len(plans) >= 3
    rep = arena_report(plans, req.policy)
    assert rep["n_rejected"] >= 1
    assert rep["n_accepted"] >= 1


def test_policy_accepts_lawful_action():
    a = Action(
        agent="yield",
        category=Category.VAULT,
        protocol="beefy",
        action="deposit",
        value=100,
        slippage_bps=10,
        resulting_protocol_exposure_bps=1000,
        resulting_liquid_reserve_bps=4000,
        resulting_leverage_bps=10000,
        expected_gain_bps=500,
        risk_bps=80,
    )
    e = evaluate(a, Policy())
    assert e.accepted
    assert "ACCEPTED" in e.human_summary


def test_policy_rejects_multiple_violations():
    a = Action(
        agent="reckless",
        category=Category.PERPS,
        protocol="perpl",
        action="open",
        value=5000,
        slippage_bps=900,
        resulting_protocol_exposure_bps=9000,
        resulting_liquid_reserve_bps=100,
        resulting_leverage_bps=50000,
    )
    e = evaluate(a, Policy())
    assert not e.accepted
    assert len(e.violations) >= 4
    assert e.reasons


def test_arena_selects_best_lawful_plan():
    p = Policy()
    safe = Action(
        agent="safe",
        category=Category.LENDING,
        protocol="aave",
        action="supply",
        value=100,
        slippage_bps=5,
        resulting_protocol_exposure_bps=1000,
        resulting_liquid_reserve_bps=5000,
        resulting_leverage_bps=10000,
        expected_gain_bps=300,
        risk_bps=30,
    )
    best = Action(
        agent="balanced",
        category=Category.VAULT,
        protocol="beefy",
        action="deposit",
        value=100,
        slippage_bps=5,
        resulting_protocol_exposure_bps=1200,
        resulting_liquid_reserve_bps=4000,
        resulting_leverage_bps=10000,
        expected_gain_bps=500,
        risk_bps=80,
    )
    bad = Action(
        agent="bad",
        category=Category.PERPS,
        protocol="perpl",
        action="open",
        value=100,
        slippage_bps=5,
        resulting_protocol_exposure_bps=1200,
        resulting_liquid_reserve_bps=4000,
        resulting_leverage_bps=30000,
        expected_gain_bps=900,
        risk_bps=100,
    )
    _, winner = arbitrate([safe, best, bad], p)
    assert winner and winner[0].agent == "balanced"


def test_receipt_chain():
    reset_chain()
    r1 = seal("build", {"x": 1})
    r2 = seal("deploy", {"x": 2}, r1["receipt_hash"])
    assert r2["previous_hash"] == r1["receipt_hash"]


def test_academy():
    assert len(list_quests()) >= 4
    assert not grade_quest("slippage-trap", 0, understood=True)["passed"]
    assert grade_quest("slippage-trap", 1, understood=True)["passed"]


def test_trading_desk():
    from thesis_forge.trading import (
        TradeTicket,
        load_desk,
        paper_fill,
        propose_ticket,
        reset_desk,
        run_desk_arena,
    )

    desk = reset_desk()
    arena = run_desk_arena(desk)
    assert arena["n_rejected"] >= 1
    assert arena["n_accepted"] >= 1

    desk = load_desk()
    good = TradeTicket(
        agent="mm-bot",
        venue_id="kuru",
        pair="MON/USDC",
        side="buy",
        qty=10,
        limit_price=1.0,
        slippage_bps=20,
        leverage_bps=10000,
        rationale="unit test buy",
    )
    t = propose_ticket(desk, good)
    assert t.status == "risk_accepted", (t.violations, t.reasons)
    filled = paper_fill(desk, t.ticket_id)
    assert filled.status == "paper_filled"
    assert desk.cash_usdc < 10_000

    bad = TradeTicket(
        agent="degen",
        venue_id="perpl",
        pair="MON-PERP",
        side="buy",
        qty=1000,
        limit_price=1.0,
        slippage_bps=900,
        leverage_bps=50000,
        rationale="should reject",
    )
    t2 = propose_ticket(load_desk(), bad)
    assert t2.status == "risk_rejected"


def test_marks_strategies_vault_route():
    from thesis_forge.marks import live_marks, apply_marks_to_desk
    from thesis_forge.strategies import run_strategy
    from thesis_forge.trading import TradeTicket, load_desk, paper_fill, propose_ticket, reset_desk
    from thesis_forge.vault_route import simulate_vault_route

    feed = live_marks("monad-testnet")
    assert "MON/USDC" in feed["marks"]
    assert feed["marks"]["MON/USDC"] > 0

    desk = reset_desk()
    apply_marks_to_desk(desk, "monad-testnet")
    assert desk.marks.get("MON/USDC")

    mm = run_strategy("market-make", submit=True)
    assert mm["ok"] and mm["n"] >= 2

    desk = load_desk()
    t = propose_ticket(
        desk,
        TradeTicket(
            agent="route-test",
            venue_id="kuru",
            pair="MON/USDC",
            side="buy",
            qty=5,
            limit_price=1.0,
            slippage_bps=15,
            leverage_bps=10000,
            rationale="vault route test",
        ),
    )
    assert t.status == "risk_accepted"
    paper_fill(desk, t.ticket_id)
    route = simulate_vault_route(t.ticket_id)
    assert route["ok"] and route["would_execute"]
    assert route["calldata"]["function"].startswith("execute")


def test_daily_home_loop():
    from thesis_forge.daily import complete_mission, home

    h = home("monad-testnet")
    assert h["missions"]
    assert h["pitch"]["roommate"]
    r = complete_mission("checkin", payload={})
    assert r["ok"]
    r2 = complete_mission("gas-tip", payload={"acknowledged": True})
    assert r2["ok"]
    r3 = complete_mission("ecosystem-glance", payload={"viewed": True})
    assert r3["ok"]
    assert r3["home"]["xp"] > 0


def test_sandbox_ai_wallets():
    from thesis_forge.ai_node import ai_chat, ensure_ai_node, node_status
    from thesis_forge.sandbox import ensure_default_sandbox, mutate_twin, set_twin
    from thesis_forge.wallets import link_wallet, sync_twins_from_wallets

    sb = ensure_default_sandbox()
    set_twin(sb.sandbox_id, "MON", 10.0, twin_of="test:native", source_chain="eip155:10143")
    mutate_twin(sb.sandbox_id, "MON", -1.0, reason="unit")
    w = link_wallet(
        "phantom",
        "So11111111111111111111111111111111111111112",
        chain="solana",
        balances={"SOL": 3.5, "USDC": 100},
    )
    assert w.kind == "phantom"
    syn = sync_twins_from_wallets(sb.sandbox_id, link_id=w.link_id)
    assert syn["ok"]
    node = ensure_ai_node()
    assert node.sandbox_id
    st = node_status()
    assert st["capabilities"]["real_key_access"] is False
    chat = ai_chat("show balances and gas tip")
    assert "answer" in chat
    # reject secrets
    try:
        link_wallet("manual", "0xabc", meta={"private_key": "0xdead"})
        assert False, "should reject secrets"
    except ValueError:
        pass


def test_api_surface():
    c = TestClient(app)
    assert c.get("/health").json()["version"] == "0.6.0"
    assert c.get("/judge").json()["vaporware"] is False
    body = {
        "name": "API Vault",
        "objective": "Coordinate Monad portfolio under user-owned financial laws safely.",
        "categories": ["vault", "dex"],
        "network": "monad-testnet",
        "persist": True,
    }
    r = c.post("/pipeline", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["ok"]
    assert data["file_stats"]["n_files"] >= 8
    assert data["arena"]["n_rejected"] >= 1
    ar = c.post("/arena/auto", json=body)
    assert ar.status_code == 200
    assert ar.json()["n_rejected"] >= 1
    g = c.post(
        "/academy/grade",
        json={"quest_id": "slippage-trap", "selected_action_index": 1, "understood": True},
    )
    assert g.json()["passed"] is True
    d = c.get("/desk").json()
    assert d["paper_mode"] is True
    hm = c.get("/home").json()
    assert hm["missions"]
    c.post("/home/mission", json={"mission_id": "checkin"})
    assert c.get("/intelligence/coach").json()["tips"]
    assert c.get("/ecosystem").json()["infra"]
    assert c.post("/gas/margin", json={"chain_id": 10143, "estimated_gas": 80000}).json()[
        "recommended_gas_limit"
    ]
    ar = c.post("/desk/arena").json()
    assert ar["n_rejected"] >= 1
    tk = c.post(
        "/desk/ticket",
        json={
            "agent": "api-bot",
            "venue_id": "kuru",
            "pair": "MON/USDC",
            "side": "buy",
            "qty": 5,
            "limit_price": 1.0,
            "slippage_bps": 15,
            "leverage_bps": 10000,
            "rationale": "api test",
        },
    ).json()
    assert tk["ticket"]["status"] in ("risk_accepted", "risk_rejected")
