from .models import Action, Evaluation, Policy

def evaluate(action: Action, policy: Policy) -> Evaluation:
    violations: list[str] = []
    if action.category not in policy.allowed_categories:
        violations.append("category-not-allowed")
    if action.slippage_bps > policy.max_slippage_bps:
        violations.append("slippage-limit")
    if action.resulting_protocol_exposure_bps > policy.max_protocol_exposure_bps:
        violations.append("protocol-exposure-limit")
    if action.resulting_liquid_reserve_bps < policy.min_liquid_reserve_bps:
        violations.append("liquid-reserve-limit")
    if action.resulting_leverage_bps > policy.max_leverage_bps:
        violations.append("leverage-limit")
    if action.value > policy.max_action_value:
        violations.append("action-value-limit")
    score = action.expected_gain_bps - action.risk_bps - action.slippage_bps
    return Evaluation(accepted=not violations, violations=violations, score=float(score))

def arbitrate(actions: list[Action], policy: Policy):
    evaluated = [(action, evaluate(action, policy)) for action in actions]
    lawful = [item for item in evaluated if item[1].accepted]
    winner = max(lawful, key=lambda item: item[1].score) if lawful else None
    return evaluated, winner
