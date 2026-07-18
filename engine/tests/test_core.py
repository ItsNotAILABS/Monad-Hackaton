"""Production test suite for THESIS engine."""

from thesis_forge.academy import grade_quest, list_quests
from thesis_forge.compiler import compile_manifest
from thesis_forge.models import Action, BuildRequest, Category, Policy
from thesis_forge.network import get_network
from thesis_forge.policy import arbitrate, arena_report, evaluate
from thesis_forge.receipts import reset_chain, seal


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
    assert "testnet-rpc" in t["rpc"]


def test_manifest_chain():
    m = compile_manifest(request())
    assert m.chain_id == 10143
    assert len(m.contracts) == 6
    assert "SovereignVault" in m.contracts
    assert len(m.engines) == 11
    assert len(m.manifest_hash) == 64
    assert m.protocols
    assert m.deploy_plan["primary_submission_contract"] == "SovereignVault"
    assert "forge" in m.deploy_plan["commands"]["forge_script"]


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
    assert e.score == 410
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
    assert "REJECTED" in e.human_summary


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
    assert winner
    assert winner[0].agent == "balanced"
    rep = arena_report([safe, best, bad], p)
    assert rep["n_rejected"] >= 1
    assert rep["reject_is_a_feature"] is True


def test_receipt_chain_changes_hash():
    reset_chain()
    r1 = seal("build", {"x": 1})
    r2 = seal("deploy", {"x": 2}, r1["receipt_hash"])
    assert r1["receipt_hash"] != r2["receipt_hash"]
    assert r2["previous_hash"] == r1["receipt_hash"]


def test_academy_quests_and_grade():
    qs = list_quests()
    assert len(qs) >= 3
    # wrong answer fails
    bad = grade_quest("slippage-trap", 0, understood=True)
    assert bad["ok"] and not bad["passed"]
    # correct + understood passes
    good = grade_quest("slippage-trap", 1, understood=True)
    assert good["ok"] and good["passed"]
    assert "failed safely" in good["certificate_line"].lower() or good["passed"]


def test_academy_requires_understanding():
    r = grade_quest("rogue-category", 1, understood=False)
    assert r["ok"] and not r["passed"]
