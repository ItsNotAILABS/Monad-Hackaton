from pathlib import Path

import pytest

from runtime.commercial_runtime import CompanyStore, MissionCreate, MissionDecision, MissionRun


def test_company_runtime(tmp_path: Path):
    store = CompanyStore(tmp_path / "company.sqlite3")
    assert len(store.departments()) == 10

    mission = store.create(
        MissionCreate(
            title="Audit Monad wallet",
            objective="Audit my Monad wallet risk, slippage, leverage, and protocol exposure.",
            requested_by="validator",
        ),
        role="analyst",
    )
    assert mission["mission_type"] == "risk_audit"
    assert mission["status"] == "approved"
    assert mission["approval_required"] is False

    completed = store.run(mission["id"], MissionRun(actor="validator-manager"), role="manager")
    assert completed["status"] == "completed"
    assert completed["result"]["live_chain_broadcast"] is False
    assert completed["result"]["operator_signature_required_for_chain"] is True

    risky = store.create(
        MissionCreate(
            title="Leveraged trade",
            objective="Trade perpetuals with leverage and maximize the position immediately.",
        ),
        role="analyst",
    )
    assert risky["status"] == "proposed"
    assert risky["approval_required"] is True

    with pytest.raises(PermissionError):
        store.decide(risky["id"], MissionDecision(approve=True), role="analyst")

    rejected = store.decide(
        risky["id"], MissionDecision(approve=False, actor="owner", note="outside constitution"), role="owner"
    )
    assert rejected["status"] == "rejected"

    with pytest.raises(ValueError):
        store.run(risky["id"], MissionRun(), role="owner")

    events = list(reversed(store.audit(100)))
    assert events[0]["previous_hash"] == "0" * 64
    for previous, current in zip(events, events[1:]):
        assert current["previous_hash"] == previous["event_hash"]
        assert len(current["event_hash"]) == 64

    brief = store.brief()
    assert brief["kpis"]["departments_online"] == 10
    assert brief["safety"]["private_keys_loaded"] is False
    assert brief["safety"]["automatic_chain_broadcast"] is False
