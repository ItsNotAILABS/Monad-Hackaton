from thesis_forge.compiler import compile_manifest
from thesis_forge.models import Action, BuildRequest, Category, Policy
from thesis_forge.policy import arbitrate, evaluate
from thesis_forge.receipts import seal

def request():
    return BuildRequest(name="Sovereign DeFi", objective="Coordinate Monad protocols under user-owned financial laws.", categories=list(Category))

def test_manifest_chain():
    m = compile_manifest(request())
    assert m.chain_id == 10143
    assert len(m.contracts) == 6
    assert len(m.engines) == 11
    assert len(m.manifest_hash) == 64
    assert m.protocols

def test_policy_accepts_lawful_action():
    a = Action(agent="yield", category=Category.VAULT, protocol="beefy", action="deposit", value=100, slippage_bps=10, resulting_protocol_exposure_bps=1000, resulting_liquid_reserve_bps=4000, resulting_leverage_bps=10000, expected_gain_bps=500, risk_bps=80)
    e = evaluate(a, Policy())
    assert e.accepted
    assert e.score == 410

def test_policy_rejects_multiple_violations():
    a = Action(agent="reckless", category=Category.PERPS, protocol="perpl", action="open", value=5000, slippage_bps=900, resulting_protocol_exposure_bps=9000, resulting_liquid_reserve_bps=100, resulting_leverage_bps=50000)
    e = evaluate(a, Policy())
    assert not e.accepted
    assert len(e.violations) == 5

def test_arena_selects_best_lawful_plan():
    p = Policy()
    safe = Action(agent="safe", category=Category.LENDING, protocol="aave", action="supply", value=100, slippage_bps=5, resulting_protocol_exposure_bps=1000, resulting_liquid_reserve_bps=5000, resulting_leverage_bps=10000, expected_gain_bps=300, risk_bps=30)
    best = Action(agent="balanced", category=Category.VAULT, protocol="beefy", action="deposit", value=100, slippage_bps=5, resulting_protocol_exposure_bps=1200, resulting_liquid_reserve_bps=4000, resulting_leverage_bps=10000, expected_gain_bps=500, risk_bps=80)
    bad = Action(agent="bad", category=Category.PERPS, protocol="perpl", action="open", value=100, slippage_bps=5, resulting_protocol_exposure_bps=1200, resulting_liquid_reserve_bps=4000, resulting_leverage_bps=30000, expected_gain_bps=900, risk_bps=100)
    _, winner = arbitrate([safe, best, bad], p)
    assert winner
    assert winner[0].agent == "balanced"

def test_receipt_chain_changes_hash():
    r1 = seal("build", {"x": 1})
    r2 = seal("deploy", {"x": 2}, r1["receipt_hash"])
    assert r1["receipt_hash"] != r2["receipt_hash"]
    assert r2["previous_hash"] == r1["receipt_hash"]
