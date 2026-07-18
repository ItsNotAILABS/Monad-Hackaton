/**
 * THESIS Node worker_threads child — heavy rank/score off the main bridge process.
 * Parent: thesis-bridge.mjs hybrid-worker
 */
import { parentPort, workerData } from "node:worker_threads";
import { createHash } from "node:crypto";

const op = workerData?.op || "pulse";
const payload = workerData?.payload || {};

function agentRank(agents) {
  const list = (agents || [
    { name: "yield", return: 0.08, risk: 0.03, lawful: true },
    { name: "degen", return: 0.4, risk: 0.5, lawful: false },
    { name: "mm", return: 0.04, risk: 0.02, lawful: true },
  ]).map((a) => {
    const ret = Number(a.return ?? 0.05);
    const risk = Math.max(Number(a.risk ?? 0.1), 1e-6);
    const lawful = a.lawful !== false;
    const utility = lawful ? ret / risk : -1e6;
    return { ...a, utility };
  });
  list.sort((a, b) => b.utility - a.utility);
  return { ranked: list, winner: list[0]?.name, locality: "node-worker_threads" };
}

function evaluate(action, policy = {}) {
  const violations = [];
  if ((action.slippage_bps || 0) > (policy.max_slippage_bps ?? 50)) violations.push("slippage-limit");
  if ((action.resulting_leverage_bps || 10000) > (policy.max_leverage_bps ?? 12500))
    violations.push("leverage-limit");
  if ((action.value || 0) > (policy.max_action_value ?? 1000)) violations.push("action-value-limit");
  const cats = policy.allowed_categories;
  if (cats && action.category && !cats.includes(action.category))
    violations.push("category-not-allowed");
  return {
    accepted: violations.length === 0,
    violations,
    score:
      Number(action.expected_gain_bps || 0) -
      Number(action.risk_bps || 0) -
      Number(action.slippage_bps || 0),
    locality: "node-worker_threads",
  };
}

function arena(actions, policy) {
  const rows = (actions || []).map((a) => ({ action: a, evaluation: evaluate(a, policy) }));
  const ok = rows.filter((r) => r.evaluation.accepted);
  ok.sort((a, b) => b.evaluation.score - a.evaluation.score);
  return {
    n_plans: rows.length,
    n_accepted: ok.length,
    n_rejected: rows.length - ok.length,
    winner: ok[0]?.action?.agent || null,
    reject_is_a_feature: true,
    locality: "node-worker_threads",
  };
}

function fingerprint(payload) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload || {});
  const digest = createHash("sha256").update(text).digest("hex");
  return { digest, digest16: digest.slice(0, 16), locality: "node-worker_threads" };
}

function bench(n = 500000) {
  let acc = 0;
  const N = Math.min(Number(n) || 500000, 5_000_000);
  for (let i = 1; i <= N; i++) acc += Math.sin(i * 0.0001);
  return { iterations: N, checksum: acc, locality: "node-worker_threads" };
}

function pulse() {
  return {
    novel_tech: "blockchain + node-worker_threads hybrid",
    agents: agentRank(),
    arena: arena(
      [
        {
          agent: "node-bal",
          category: "vault",
          slippage_bps: 10,
          value: 50,
          resulting_leverage_bps: 10000,
          expected_gain_bps: 200,
          risk_bps: 40,
        },
        {
          agent: "node-degen",
          category: "perps",
          slippage_bps: 800,
          value: 5000,
          resulting_leverage_bps: 50000,
          expected_gain_bps: 900,
          risk_bps: 500,
        },
      ],
      { max_slippage_bps: 50, max_leverage_bps: 12500, max_action_value: 1000, allowed_categories: ["vault", "dex"] }
    ),
    doctrine: "Workers propose/score. Laws decide. Owner signs.",
  };
}

let result;
const t0 = performance.now();
try {
  if (op === "agents" || op === "agent-rank") result = agentRank(payload.agents);
  else if (op === "evaluate") result = evaluate(payload.action || payload, payload.policy);
  else if (op === "arena") result = arena(payload.actions, payload.policy);
  else if (op === "fingerprint") result = fingerprint(payload.payload ?? payload);
  else if (op === "bench") result = bench(payload.n);
  else result = pulse();
  parentPort.postMessage({
    ok: true,
    op,
    result,
    elapsed_ms: performance.now() - t0,
    worker: "node-worker_threads",
  });
} catch (e) {
  parentPort.postMessage({ ok: false, error: String(e.message || e), op });
}
