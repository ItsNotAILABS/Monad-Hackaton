/** Main-thread fallback if Worker construction fails (SSR / old browsers). */

export function evaluateAction(action, policy) {
  const pol = policy || {
    max_slippage_bps: 50,
    max_protocol_exposure_bps: 2000,
    min_liquid_reserve_bps: 2500,
    max_leverage_bps: 12500,
    max_action_value: 1000,
    allowed_categories: ["dex", "lending", "vault", "staking", "analytics", "agent"],
  };
  const violations = [];
  const cats = pol.allowed_categories || [];
  if (action.category && !cats.includes(action.category)) violations.push("category-not-allowed");
  if ((action.slippage_bps || 0) > (pol.max_slippage_bps ?? 50)) violations.push("slippage-limit");
  if ((action.resulting_protocol_exposure_bps || 0) > (pol.max_protocol_exposure_bps ?? 2000))
    violations.push("protocol-exposure-limit");
  if ((action.resulting_liquid_reserve_bps ?? 10000) < (pol.min_liquid_reserve_bps ?? 2500))
    violations.push("liquid-reserve-limit");
  if ((action.resulting_leverage_bps || 10000) > (pol.max_leverage_bps ?? 12500))
    violations.push("leverage-limit");
  if ((action.value || 0) > (pol.max_action_value ?? 1000)) violations.push("action-value-limit");
  const score =
    Number(action.expected_gain_bps || 0) -
    Number(action.risk_bps || 0) -
    Number(action.slippage_bps || 0);
  return {
    accepted: violations.length === 0,
    violations,
    score,
    human_summary: violations.length ? `REJECTED: ${violations.join(",")}` : `ACCEPTED score=${score}`,
  };
}

export function runOp(op, payload = {}) {
  if (op === "ping") return { pong: true, fallback: true };
  if (op === "evaluate") return evaluateAction(payload.action || payload, payload.policy);
  if (op === "arena") {
    const actions = payload.actions || [];
    const rows = actions.map((a) => ({ action: a, evaluation: evaluateAction(a, payload.policy) }));
    return {
      n_plans: rows.length,
      n_accepted: rows.filter((r) => r.evaluation.accepted).length,
      n_rejected: rows.filter((r) => !r.evaluation.accepted).length,
      evaluations: rows,
      fallback: true,
    };
  }
  if (op === "bench") {
    let acc = 0;
    const N = Math.min(payload.n || 100000, 500000);
    for (let i = 1; i <= N; i++) acc += Math.sin(i * 0.001);
    return { iterations: N, checksum: acc, fallback: true };
  }
  if (op === "pulse") {
    return {
      novel_tech: "main-thread-fallback",
      arena: runOp("arena", {
        actions: [
          {
            agent: "bal",
            category: "vault",
            protocol: "beefy",
            slippage_bps: 10,
            value: 50,
            resulting_protocol_exposure_bps: 1000,
            resulting_liquid_reserve_bps: 4000,
            resulting_leverage_bps: 10000,
            expected_gain_bps: 200,
            risk_bps: 40,
          },
          {
            agent: "deg",
            category: "perps",
            protocol: "perpl",
            slippage_bps: 800,
            value: 5000,
            resulting_protocol_exposure_bps: 9000,
            resulting_liquid_reserve_bps: 100,
            resulting_leverage_bps: 50000,
            expected_gain_bps: 900,
            risk_bps: 500,
          },
        ],
      }),
      free_main_thread: false,
    };
  }
  if (op === "signals") {
    const list = (payload.signals || []).map((s, i) => ({
      ...s,
      score: Number(s.score || 50),
      rank: i + 1,
    }));
    return { n: list.length, leaderboard: list, fallback: true };
  }
  if (op === "crawl") {
    return { ranked: (payload.protocols || []).slice(0, 12), fallback: true };
  }
  if (op === "agents") {
    return { ranked: payload.agents || [], fallback: true };
  }
  if (op === "fingerprint") {
    return { digest16: "fallback", fallback: true };
  }
  return { op, fallback: true, note: "unknown op" };
}
