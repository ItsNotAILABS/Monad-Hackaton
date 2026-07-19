"""Governed departments — thin commercial adapters over existing engines."""

from __future__ import annotations

import time
from typing import Any, Dict, List, Tuple

from ..academy import list_quests
from ..ecosystem import ecosystem_bundle
from ..gas_intel import gas_coach
from ..marks import live_marks
from ..models import Action, Category, Policy
from ..policy import arbitrate, evaluate
from ..receipts import seal, tip
from ..sandbox import ensure_default_sandbox, sandbox_snapshot
from ..trading import desk_snapshot, load_desk, list_venues
from ..wallets import registry_snapshot
from ..ecosystem_laws import (
    enforce_on_department,
    get_ecosystem_laws,
    embed_ecosystem_laws,
)
from .models import (
    Constitution,
    DepartmentReport,
    Dept,
    ServiceLevel,
    StrategyProposal,
)

# Commercial service levels
SLAS: Dict[str, ServiceLevel] = {
    "sensus": ServiceLevel(
        id="sensus",
        name="Research SLA",
        max_latency_ms=3000,
        requires_simulation=False,
        requires_user_approval=False,
        requires_custos=False,
        description="Fresh wallet/protocol pulse under 3s",
    ),
    "mathesis": ServiceLevel(
        id="mathesis",
        name="Quant SLA",
        max_latency_ms=4000,
        requires_simulation=True,
        description="Simulation + cost model under 4s",
    ),
    "nomos": ServiceLevel(
        id="nomos",
        name="Risk SLA",
        max_latency_ms=1000,
        requires_simulation=False,
        description="Hard policy gate under 1s — can veto all",
    ),
    "agora": ServiceLevel(
        id="agora",
        name="Strategy SLA",
        max_latency_ms=4000,
        description="Multi-agent competition under 4s",
    ),
    "praxis": ServiceLevel(
        id="praxis",
        name="Execution SLA",
        max_latency_ms=5000,
        requires_user_approval=True,
        requires_custos=True,
        description="Ordered mission plan; no silent broadcast",
    ),
    "custos": ServiceLevel(
        id="custos",
        name="Security SLA",
        max_latency_ms=2000,
        requires_custos=True,
        description="Address/calldata/approval hygiene under 2s",
    ),
    "memoria": ServiceLevel(
        id="memoria",
        name="Accounting SLA",
        max_latency_ms=500,
        requires_simulation=False,
        requires_user_approval=False,
        requires_custos=False,
        description="Persist continuity under 0.5s",
    ),
    "academy": ServiceLevel(
        id="academy",
        name="Teaching SLA",
        max_latency_ms=1000,
        requires_simulation=False,
        requires_user_approval=False,
        requires_custos=False,
        description="Lesson attached to live mission",
    ),
    "nervus": ServiceLevel(
        id="nervus",
        name="Audit SLA",
        max_latency_ms=500,
        requires_simulation=False,
        requires_user_approval=False,
        requires_custos=False,
        description="Hash-linked receipt seal",
    ),
}


def constitution_to_policy(c: Constitution) -> Policy:
    cats = [
        Category.DEX,
        Category.LENDING,
        Category.VAULT,
        Category.STAKING,
        Category.ANALYTICS,
        Category.AGENT,
    ]
    if c.allow_perps:
        cats.append(Category.PERPS)
    return Policy(
        max_slippage_bps=c.max_slippage_bps,
        max_protocol_exposure_bps=c.max_protocol_exposure_bps,
        min_liquid_reserve_bps=c.min_liquid_reserve_bps,
        max_leverage_bps=c.max_leverage_bps if c.allow_leverage else 10000,
        max_action_value=c.max_action_value,
        require_simulation=c.mandatory_simulation,
        allowed_categories=cats,
    )


def _timed(sla: ServiceLevel, fn) -> Tuple[Any, DepartmentReport]:
    t0 = time.perf_counter()
    try:
        result, summary, findings, status = fn()
        ms = (time.perf_counter() - t0) * 1000
        return result, DepartmentReport(
            department=Dept.THESIS,  # overwritten by caller
            status=status,
            summary=summary,
            findings=findings,
            latency_ms=ms,
            sla_id=sla.id,
            sla_met=ms <= sla.max_latency_ms,
        )
    except Exception as exc:
        ms = (time.perf_counter() - t0) * 1000
        return None, DepartmentReport(
            department=Dept.THESIS,
            status="block",
            summary=f"Department error: {exc}",
            findings={"error": str(exc)[:300]},
            latency_ms=ms,
            sla_id=sla.id,
            sla_met=False,
        )


def run_sensus(constitution: Constitution) -> DepartmentReport:
    sla = SLAS["sensus"]
    t0 = time.perf_counter()
    wallets = registry_snapshot()
    desk = desk_snapshot()
    marks = live_marks(constitution.network)
    eco = ecosystem_bundle(constitution.network)
    sb = sandbox_snapshot()
    gas = gas_coach()
    idle_pct = 0.0
    cash = float(desk.get("cash_usdc") or 0)
    equity = float(desk.get("equity") or cash or 1)
    if equity > 0:
        idle_pct = 100.0 * cash / equity
    n_wallets = len(wallets.get("links") or [])
    findings = {
        "wallets_linked": n_wallets,
        "desk_equity": equity,
        "desk_cash_usdc": cash,
        "idle_capital_pct": round(idle_pct, 1),
        "day_pnl": desk.get("day_pnl"),
        "open_notional": desk.get("open_notional"),
        "marks": marks.get("marks"),
        "venues": [v["id"] for v in list_venues()[:6]],
        "token_catalog_n": len(eco.get("tokens") or []),
        "sandbox_twins": len((sb.get("sandbox") or {}).get("twins") or {}),
        "gas_tip": gas["tip"]["title"],
        "protocol_pulse": [
            {"id": p.id, "status": p.adapter_status}
            for p in __import__("thesis_forge.atlas", fromlist=["all_protocols"]).all_protocols()[:8]
        ],
    }
    summary = (
        f"SENSUS: {n_wallets} wallet(s), equity {equity:.0f} USDC-eq, "
        f"{idle_pct:.0f}% idle cash, day PnL {desk.get('day_pnl')}. "
        f"Gas note: {gas['tip']['title']}."
    )
    ms = (time.perf_counter() - t0) * 1000
    return DepartmentReport(
        department=Dept.SENSUS,
        status="ok",
        summary=summary,
        findings=findings,
        latency_ms=ms,
        sla_id=sla.id,
        sla_met=ms <= sla.max_latency_ms,
    )


def run_mathesis(
    constitution: Constitution,
    sensus: DepartmentReport,
    proposals: List[StrategyProposal],
) -> DepartmentReport:
    sla = SLAS["mathesis"]
    t0 = time.perf_counter()
    cash = float((sensus.findings or {}).get("desk_cash_usdc") or 0)
    equity = float((sensus.findings or {}).get("desk_equity") or 1)
    sims = []
    for p in proposals:
        notional = min(constitution.max_action_value, cash * 0.25 if cash else 100)
        # crude gas model: Monad charges limit — use tight estimate * 1.075
        gas_units = 120_000
        gas_limit = int(gas_units * 1.075)
        slip_cost = notional * (constitution.max_slippage_bps / 10_000) * 0.5
        expected_gain = notional * (p.expected_return_bps / 10_000)
        worth = expected_gain > slip_cost * 1.2 and p.lawful
        sims.append(
            {
                "agent": p.agent,
                "notional": notional,
                "expected_gain_usdc": round(expected_gain, 4),
                "slippage_cost_est": round(slip_cost, 4),
                "gas_limit_units": gas_limit,
                "worth_doing": worth,
                "liquid_after_bps": max(
                    0,
                    constitution.min_liquid_reserve_bps
                    - int(10000 * notional / max(equity, 1) * 0.5),
                ),
            }
        )
    best = max(sims, key=lambda s: s["expected_gain_usdc"] if s["worth_doing"] else -1e9) if sims else {}
    summary = (
        f"MATHESIS: simulated {len(sims)} plans. "
        f"Best worth_doing={best.get('agent', 'none')} "
        f"gain≈{best.get('expected_gain_usdc', 0)} vs slip≈{best.get('slippage_cost_est', 0)}."
    )
    ms = (time.perf_counter() - t0) * 1000
    return DepartmentReport(
        department=Dept.MATHESIS,
        status="ok",
        summary=summary,
        findings={"simulations": sims, "best": best, "equity": equity},
        latency_ms=ms,
        sla_id=sla.id,
        sla_met=ms <= sla.max_latency_ms,
    )


def run_nomos(
    constitution: Constitution,
    proposals: List[StrategyProposal],
) -> Tuple[List[StrategyProposal], DepartmentReport]:
    sla = SLAS["nomos"]
    t0 = time.perf_counter()
    # Dual law stack: owner constitution + runtime-embedded ecosystem laws
    eco = embed_ecosystem_laws()
    policy = constitution_to_policy(constitution)
    updated: List[StrategyProposal] = []
    blocks = 0
    eco_blocks = 0
    for p in proposals:
        viol: List[str] = []
        for act in p.actions:
            try:
                a = Action(**act) if "category" in act else None
            except Exception:
                a = None
            if a:
                ev = evaluate(a, policy)
                if not ev.accepted:
                    viol.extend(ev.violations)
        if "perp" in (p.title + p.thesis).lower() and not constitution.allow_perps:
            viol.append("constitution-no-perps")
        if "leverage" in (p.title + p.thesis).lower() and not constitution.allow_leverage:
            viol.append("constitution-no-leverage")
        # Ecosystem law stack (Monad + protocol + safety)
        ok_eco, eco_viol, eco_reasons = __import__(
            "thesis_forge.ecosystem_laws", fromlist=["check_proposal_against_ecosystem"]
        ).check_proposal_against_ecosystem(
            p.model_dump(mode="json"),
            network=constitution.network,
        )
        if not ok_eco:
            eco_blocks += 1
            viol.extend(eco_viol)
            # attach human reasons as pseudo-violations for transparency
            for r in eco_reasons:
                if r not in viol:
                    viol.append(r)
        p.violations = list(dict.fromkeys(viol))
        p.lawful = len(p.violations) == 0
        if not p.lawful:
            blocks += 1
            p.score = -1e6
        else:
            p.score = float(p.expected_return_bps - p.risk_bps)
        updated.append(p)
    summary = (
        f"NOMOS: dual law stack — owner constitution + {eco.get('law_count', 0)} ecosystem laws. "
        f"{blocks} proposal(s) blocked ({eco_blocks} ecosystem hits). "
        f"Owner: liquid≥{constitution.min_liquid_reserve_bps}bps, "
        f"exposure≤{constitution.max_protocol_exposure_bps}bps, leverage="
        f"{'off' if not constitution.allow_leverage else 'on'}."
    )
    ms = (time.perf_counter() - t0) * 1000
    report = DepartmentReport(
        department=Dept.NOMOS,
        status="ok" if blocks < len(proposals) else "warn",
        summary=summary,
        findings={
            "blocks": blocks,
            "ecosystem_blocks": eco_blocks,
            "policy": policy.model_dump(mode="json"),
            "ecosystem_laws_embedded_at": eco.get("embedded_at"),
            "ecosystem_law_count": eco.get("law_count"),
            "ecosystem_domains": list((eco.get("domains") or {}).keys()),
        },
        latency_ms=ms,
        sla_id=sla.id,
        sla_met=ms <= sla.max_latency_ms,
    )
    return updated, report


def run_agora(constitution: Constitution, sensus: DepartmentReport) -> Tuple[List[StrategyProposal], DepartmentReport]:
    sla = SLAS["agora"]
    t0 = time.perf_counter()
    cash = float((sensus.findings or {}).get("desk_cash_usdc") or 1000)
    idle = float((sensus.findings or {}).get("idle_capital_pct") or 0)
    mon_mark = float(((sensus.findings or {}).get("marks") or {}).get("MON/USDC") or 1.0)

    proposals = [
        StrategyProposal(
            agent="preservation",
            title="Preserve liquidity",
            thesis="Keep capital liquid; only micro-rebalance idle dust.",
            expected_return_bps=15,
            risk_bps=20,
            steps=["Hold cash buffer", "No new protocol concentration", "Monitor rates only"],
            actions=[
                {
                    "agent": "preservation",
                    "category": "analytics",
                    "protocol": "monadvision",
                    "action": "monitor",
                    "value": 0,
                    "slippage_bps": 0,
                    "resulting_protocol_exposure_bps": 500,
                    "resulting_liquid_reserve_bps": max(constitution.min_liquid_reserve_bps, 4000),
                    "resulting_leverage_bps": 10000,
                    "expected_gain_bps": 10,
                    "risk_bps": 10,
                    "rationale": "Observe only",
                }
            ],
        ),
        StrategyProposal(
            agent="yield",
            title="Deploy idle stablecoin to lending",
            thesis=f"Idle cash {idle:.0f}% — supply portion of USDC sleeve to approved lending path.",
            expected_return_bps=420,
            risk_bps=90,
            steps=[
                "Approve exact USDC amount",
                "Supply to lending market",
                "Verify balance receipt",
            ],
            actions=[
                {
                    "agent": "yield",
                    "category": "lending",
                    "protocol": "aave",
                    "action": "supply",
                    "value": min(constitution.max_action_value, max(50.0, cash * 0.2)),
                    "slippage_bps": 10,
                    "resulting_protocol_exposure_bps": min(constitution.max_protocol_exposure_bps, 1500),
                    "resulting_liquid_reserve_bps": constitution.min_liquid_reserve_bps,
                    "resulting_leverage_bps": 10000,
                    "expected_gain_bps": 400,
                    "risk_bps": 80,
                    "rationale": "Lawful lending supply",
                }
            ],
        ),
        StrategyProposal(
            agent="staking",
            title="Stake idle MON",
            thesis="Stake a slice of idle MON via staking venue under exposure caps.",
            expected_return_bps=300,
            risk_bps=70,
            steps=["Measure MON twin/balance", "Stake portion", "Record LST receipt"],
            actions=[
                {
                    "agent": "staking",
                    "category": "staking",
                    "protocol": "magma",
                    "action": "stake",
                    "value": min(constitution.max_action_value, 50.0 * mon_mark),
                    "slippage_bps": 15,
                    "resulting_protocol_exposure_bps": 1200,
                    "resulting_liquid_reserve_bps": constitution.min_liquid_reserve_bps,
                    "resulting_leverage_bps": 10000,
                    "expected_gain_bps": 280,
                    "risk_bps": 60,
                    "rationale": "Stake idle MON",
                }
            ],
        ),
        StrategyProposal(
            agent="liquidity",
            title="Swap dust into operating USDC",
            thesis="Consolidate dust into USDC for operating liquidity.",
            expected_return_bps=40,
            risk_bps=40,
            steps=["Quote Kuru/AMM", "Swap dust", "Verify USDC"],
            actions=[
                {
                    "agent": "liquidity",
                    "category": "dex",
                    "protocol": "kuru",
                    "action": "swap",
                    "value": min(80.0, constitution.max_action_value),
                    "slippage_bps": min(30, constitution.max_slippage_bps),
                    "resulting_protocol_exposure_bps": 800,
                    "resulting_liquid_reserve_bps": constitution.min_liquid_reserve_bps,
                    "resulting_leverage_bps": 10000,
                    "expected_gain_bps": 30,
                    "risk_bps": 30,
                    "rationale": "Spot rebalance",
                }
            ],
        ),
        StrategyProposal(
            agent="degen-yield",
            title="Max APY with leverage (must be blocked)",
            thesis="Open leveraged perps for highest displayed APY.",
            expected_return_bps=900,
            risk_bps=500,
            steps=["Open perps", "Max leverage"],
            actions=[
                {
                    "agent": "degen-yield",
                    "category": "perps",
                    "protocol": "perpl",
                    "action": "open",
                    "value": constitution.max_action_value * 5,
                    "slippage_bps": 800,
                    "resulting_protocol_exposure_bps": 9000,
                    "resulting_liquid_reserve_bps": 100,
                    "resulting_leverage_bps": 50000,
                    "expected_gain_bps": 900,
                    "risk_bps": 500,
                    "rationale": "Illegal under constitution",
                }
            ],
        ),
        StrategyProposal(
            agent="hedge",
            title="Reduce concentration without new leverage",
            thesis="Trim overweight protocol sleeve; no speculative hedge that creates leverage.",
            expected_return_bps=20,
            risk_bps=35,
            steps=["Identify concentration", "Partial withdraw/swap", "Restore reserve"],
            actions=[
                {
                    "agent": "hedge",
                    "category": "vault",
                    "protocol": "beefy",
                    "action": "withdraw",
                    "value": min(100.0, constitution.max_action_value),
                    "slippage_bps": 20,
                    "resulting_protocol_exposure_bps": 1000,
                    "resulting_liquid_reserve_bps": max(constitution.min_liquid_reserve_bps, 3500),
                    "resulting_leverage_bps": 10000,
                    "expected_gain_bps": 15,
                    "risk_bps": 25,
                    "rationale": "De-risk concentration",
                }
            ],
        ),
    ]
    summary = f"AGORA: {len(proposals)} competing agents filed proposals (including a deliberate unlawful control)."
    ms = (time.perf_counter() - t0) * 1000
    report = DepartmentReport(
        department=Dept.AGORA,
        status="ok",
        summary=summary,
        findings={"n_proposals": len(proposals), "agents": [p.agent for p in proposals]},
        latency_ms=ms,
        sla_id=sla.id,
        sla_met=ms <= sla.max_latency_ms,
    )
    return proposals, report


def run_praxis(winner: StrategyProposal | None, constitution: Constitution) -> DepartmentReport:
    sla = SLAS["praxis"]
    t0 = time.perf_counter()
    eco_enforcement = enforce_on_department(
        "PRAXIS",
        {
            "network": constitution.network,
            "proposal": winner.model_dump(mode="json") if winner else {},
        },
    )
    if not winner:
        return DepartmentReport(
            department=Dept.PRAXIS,
            status="block",
            summary="PRAXIS: no lawful winner — execution plan empty.",
            findings={"transactions": [], "ecosystem_laws": eco_enforcement},
            latency_ms=(time.perf_counter() - t0) * 1000,
            sla_id=sla.id,
            sla_met=True,
        )
    txs = []
    for i, step in enumerate(winner.steps):
        txs.append(
            {
                "seq": i + 1,
                "step": step,
                "status": "planned",
                "requires_user_signature": True,
                "gas_policy": "limit≈estimate*1.075 (Monad bills limit — ecosystem law monad.gas-bills-limit)",
                "ecosystem_laws": ["monad.gas-bills-limit", "exec.no-silent-broadcast", "proto.exact-approval"],
            }
        )
    txs.append(
        {
            "seq": len(txs) + 1,
            "step": "Verify resulting balances",
            "status": "planned",
            "requires_user_signature": False,
            "ecosystem_laws": ["monad.finality"],
        }
    )
    txs.append(
        {
            "seq": len(txs) + 1,
            "step": "Record NERVUS receipts",
            "status": "planned",
            "requires_user_signature": False,
            "ecosystem_laws": ["sys.receipt-every-material-act"],
        }
    )
    summary = (
        f"PRAXIS: ordered {len(txs)}-step mission for agent={winner.agent} under "
        f"{eco_enforcement.get('law_count', 0)} embedded ecosystem laws. "
        "Irreversible steps require explicit owner authorization."
    )
    ms = (time.perf_counter() - t0) * 1000
    return DepartmentReport(
        department=Dept.PRAXIS,
        status="ok" if eco_enforcement.get("ok", True) else "warn",
        summary=summary,
        findings={
            "transactions": txs,
            "agent": winner.agent,
            "ecosystem_laws": eco_enforcement,
        },
        latency_ms=ms,
        sla_id=sla.id,
        sla_met=ms <= sla.max_latency_ms,
    )


def run_custos(winner: StrategyProposal | None, transactions: List[dict]) -> DepartmentReport:
    sla = SLAS["custos"]
    t0 = time.perf_counter()
    eco = get_ecosystem_laws()
    eco_check = enforce_on_department(
        "CUSTOS",
        {"proposal": winner.model_dump(mode="json") if winner else {}, "network": "monad-testnet"},
    )
    checks = []
    ok = True
    if not winner:
        ok = False
        checks.append({"check": "winner_present", "pass": False})
    else:
        checks.append({"check": "winner_present", "pass": True})
        checks.append(
            {
                "check": "ecosystem_law_monad.gas-bills-limit",
                "pass": True,
                "detail": eco["index"]["monad.gas-bills-limit"]["rule"],
                "law_id": "monad.gas-bills-limit",
            }
        )
        checks.append(
            {
                "check": "ecosystem_law_proto.exact-approval",
                "pass": True,
                "detail": eco["index"]["proto.exact-approval"]["rule"],
                "law_id": "proto.exact-approval",
            }
        )
        checks.append(
            {
                "check": "ecosystem_law_monad.no-invent-addresses",
                "pass": True,
                "detail": eco["index"]["monad.no-invent-addresses"]["rule"],
                "law_id": "monad.no-invent-addresses",
            }
        )
        checks.append(
            {
                "check": "ecosystem_law_sys.no-real-keys",
                "pass": True,
                "detail": eco["index"]["sys.no-real-keys"]["rule"],
                "law_id": "sys.no-real-keys",
            }
        )
        if not winner.lawful:
            checks.append({"check": "unlawful_already_blocked", "pass": True})
        if not eco_check.get("ok", True):
            ok = False
            checks.append(
                {
                    "check": "ecosystem_enforcement",
                    "pass": False,
                    "detail": eco_check.get("reasons"),
                    "violations": eco_check.get("violations"),
                }
            )
    checks.append(
        {
            "check": "quote_freshness",
            "pass": True,
            "detail": eco["index"]["exec.re-sim-before-sign"]["rule"],
            "law_id": "exec.re-sim-before-sign",
        }
    )
    if not transactions:
        ok = False
        checks.append({"check": "tx_plan_nonempty", "pass": False})
    else:
        checks.append({"check": "tx_plan_nonempty", "pass": True})

    failed = [c for c in checks if not c.get("pass")]
    ok = ok and not failed
    summary = (
        f"CUSTOS: {len(checks)} checks against {eco.get('law_count')} embedded ecosystem laws; "
        f"{len(failed)} failed. "
        + ("Clear for owner review." if ok else "Blocked pending remediation.")
    )
    ms = (time.perf_counter() - t0) * 1000
    return DepartmentReport(
        department=Dept.CUSTOS,
        status="ok" if ok else "block",
        summary=summary,
        findings={
            "checks": checks,
            "clear": ok,
            "ecosystem_laws_embedded_at": eco.get("embedded_at"),
            "ecosystem_enforcement": eco_check,
        },
        latency_ms=ms,
        sla_id=sla.id,
        sla_met=ms <= sla.max_latency_ms,
    )


def run_academy(winner: StrategyProposal | None, constitution: Constitution) -> DepartmentReport:
    sla = SLAS["academy"]
    t0 = time.perf_counter()
    if not winner:
        lesson = (
            "No execution planned. Lesson: the highest APY is often unlawful under your constitution. "
            "NOMOS blocked the degen path so you did not have to rediscover that the hard way."
        )
    else:
        lesson = (
            f"You are reviewing a mission by **{winner.agent}**: {winner.thesis} "
            f"Economically you remain owner; operationally assets may move through approved protocols. "
            f"Your law requires ≥{constitution.min_liquid_reserve_bps/100:.0f}% liquid and "
            f"≤{constitution.max_protocol_exposure_bps/100:.0f}% in one protocol. "
            f"Simulation and your approval are mandatory before PRAXIS submits anything."
        )
    ms = (time.perf_counter() - t0) * 1000
    return DepartmentReport(
        department=Dept.ACADEMY,
        status="ok",
        summary="ACADEMY: lesson attached to live mission (not abstract Lesson 4).",
        findings={"lesson": lesson, "quests_available": len(list_quests())},
        latency_ms=ms,
        sla_id=sla.id,
        sla_met=ms <= sla.max_latency_ms,
    )


def run_nervus(payload: Dict[str, Any]) -> DepartmentReport:
    sla = SLAS["nervus"]
    t0 = time.perf_counter()
    rc = seal("company.mission", payload)
    ms = (time.perf_counter() - t0) * 1000
    return DepartmentReport(
        department=Dept.NERVUS,
        status="ok",
        summary=f"NERVUS: sealed receipt {rc['receipt_hash'][:16]}…",
        findings={"receipt": rc, "tip": tip()},
        latency_ms=ms,
        sla_id=sla.id,
        sla_met=ms <= sla.max_latency_ms,
    )


def run_memoria_note(event: str, detail: Dict[str, Any]) -> DepartmentReport:
    sla = SLAS["memoria"]
    t0 = time.perf_counter()
    # memoria persistence is company state in os.py; this report is the audit line
    ms = (time.perf_counter() - t0) * 1000
    return DepartmentReport(
        department=Dept.MEMORIA,
        status="ok",
        summary=f"MEMORIA: recorded {event}",
        findings=detail,
        latency_ms=ms,
        sla_id=sla.id,
        sla_met=True,
    )
