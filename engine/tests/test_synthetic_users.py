from thesis_forge.synthetic_models import PERSONAS,payload
from thesis_forge.synthetic_runner import checks,select

def test_catalog_has_100_plus_assertions():
    p=payload(); assert p["count"]>=7; assert p["assertion_budget"]>=100; assert p["safety"]["real_key_material"] is False; assert p["safety"]["chain_broadcast"] is False

def test_every_persona_and_step_is_named():
    ids=set()
    for persona in PERSONAS:
        assert persona.id not in ids; ids.add(persona.id); assert persona.name and persona.role and persona.goal and persona.steps
        for step in persona.steps:
            assert step.id and step.target and step.method and step.checks; assert step.target in {"app","engine","edge","ethereum"}; assert step.mutability in {"read","safe-write"}

def test_select_filters_personas():
    chosen=select(["wallet-owner"]); assert len(chosen)==1 and chosen[0].id=="wallet-owner"; assert len(select([]))==len(PERSONAS)

def test_valid_ethereum_chain_passes():
    step=next(s for p in PERSONAS for s in p.steps if s.id=="ethereum-chain-id")
    assert all(c["passed"] for c in checks(step,200,{"jsonrpc":"2.0","id":1,"result":"0x1"},25))

def test_wrong_ethereum_chain_fails():
    step=next(s for p in PERSONAS for s in p.steps if s.id=="ethereum-chain-id")
    assert any(c["rule"]=="ethereum_chain_id" and not c["passed"] for c in checks(step,200,{"jsonrpc":"2.0","id":1,"result":"0x279f"},25))
