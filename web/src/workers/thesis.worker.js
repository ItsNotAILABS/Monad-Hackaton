/**
 * THESIS Hybrid Worker — runs OFF the main UI thread.
 * Novel tech: browser Web Worker parallelizes agent/policy/signal/blockchain
 * prep so HQ never freezes. Same algorithms mirror server NOMOS seatbelt.
 *
 * Messages: { id, op, payload } → { id, ok, result, elapsed_ms, worker: true }
 */

const DOCTRINE = "Agents propose. Laws decide. Owner signs. Receipts remember.";

const REASON = {
  "category-not-allowed": "Category outside lawbook allowlist",
  "slippage-limit": "Slippage exceeds max_slippage_bps",
  "protocol-exposure-limit": "Protocol concentration too high",
  "liquid-reserve-limit": "Liquid reserve would fall too low",
  "leverage-limit": "Leverage exceeds max_leverage_bps",
  "action-value-limit": "Action value exceeds cap",
};

function evaluateAction(action, policy) {
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

  const score = Number(action.expected_gain_bps || 0) - Number(action.risk_bps || 0) - Number(action.slippage_bps || 0);
  const accepted = violations.length === 0;
  const reasons = violations.map((v) => REASON[v] || v);
  return {
    accepted,
    violations,
    score,
    reasons,
    human_summary: accepted
      ? `ACCEPTED ${action.agent || "agent"} on ${action.protocol || "?"} (score=${score})`
      : `REJECTED ${action.agent || "agent"}: ${reasons.join("; ")}`,
    layer: "browser_worker_mirror",
  };
}

function arenaBatch(actions, policy) {
  const rows = (actions || []).map((a) => ({
    action: a,
    evaluation: evaluateAction(a, policy),
  }));
  const lawful = rows.filter((r) => r.evaluation.accepted);
  lawful.sort((a, b) => b.evaluation.score - a.evaluation.score);
  return {
    schema: "thesis.worker.arena.v1",
    doctrine: DOCTRINE,
    n_plans: rows.length,
    n_accepted: lawful.length,
    n_rejected: rows.length - lawful.length,
    evaluations: rows,
    winner: lawful[0] || null,
    reject_is_a_feature: true,
    locality: "browser-web-worker",
  };
}

function scoreSignals(signals) {
  const list = (signals || []).map((s, i) => {
    const mom = Number(s.momentum ?? s.score ?? 0.5);
    const risk = Number(s.risk ?? 0.2);
    const lawful = s.lawful !== false;
    let score = 50 + mom * 40 - risk * 30;
    if (!lawful) score = Math.min(score, 25);
    score = Math.max(0, Math.min(100, score));
    return {
      ...s,
      id: s.id || `w-sig-${i}`,
      score: Math.round(score * 100) / 100,
      rank: 0,
      worker_scored: true,
    };
  });
  list.sort((a, b) => b.score - a.score);
  list.forEach((s, i) => {
    s.rank = i + 1;
  });
  return {
    schema: "thesis.worker.signals.v1",
    n: list.length,
    leaderboard: list,
    locality: "browser-web-worker",
  };
}

/** Lightweight "crawl" of protocol catalog — rank by status/category (no network in worker). */
function crawlProtocols(protocols) {
  const ranked = (protocols || []).map((p, i) => {
    let score = 50;
    const st = String(p.adapter_status || p.status || "").toLowerCase();
    if (st.includes("live")) score += 30;
    else if (st.includes("sim")) score += 15;
    else score -= 5;
    const cat = String(p.category || "");
    if (["dex", "lending", "vault"].includes(cat)) score += 10;
    return {
      id: p.id || p.name || `p${i}`,
      name: p.name || p.id,
      category: cat,
      adapter_status: st,
      crawl_score: score,
      rank: 0,
    };
  });
  ranked.sort((a, b) => b.crawl_score - a.crawl_score);
  ranked.forEach((r, i) => {
    r.rank = i + 1;
  });
  return {
    schema: "thesis.worker.crawl.v1",
    n: ranked.length,
    ranked: ranked.slice(0, 24),
    locality: "browser-web-worker",
    note: "Offline catalog crawl — main thread stays free for UI/RPC",
  };
}

/** Blockchain hybrid: fingerprint calldata / action for receipt-style audit (no keys). */
async function chainFingerprint(payload) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload || {});
  const enc = new TextEncoder().encode(text);
  let digestHex = "";
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", enc);
    digestHex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    // fallback simple hash
    let h = 2166136261;
    for (let i = 0; i < enc.length; i++) {
      h ^= enc[i];
      h = Math.imul(h, 16777619);
    }
    digestHex = (h >>> 0).toString(16).padStart(8, "0");
  }
  return {
    schema: "thesis.worker.chain_fp.v1",
    digest: digestHex,
    digest16: digestHex.slice(0, 16),
    bytes: enc.length,
    locality: "browser-web-worker+subtle-crypto",
    note: "Worker-side fingerprint for receipt / twin audit — never signs txs",
  };
}

function agentRank(agents) {
  const list = (agents || []).map((a) => {
    const ret = Number(a.return ?? a.expected_return ?? 0.05);
    const risk = Number(a.risk ?? 0.1);
    const lawful = a.lawful !== false;
    const gas = Number(a.gas_score ?? 0.8);
    let utility = ret - risk * 1.2 + gas * 0.05;
    if (!lawful) utility = -1e6;
    return { ...a, utility, worker_ranked: true };
  });
  list.sort((a, b) => b.utility - a.utility);
  return {
    schema: "thesis.worker.agents.v1",
    ranked: list,
    winner: list.find((a) => a.lawful !== false) || null,
    locality: "browser-web-worker",
  };
}

function heavyMath(n = 200000) {
  // Prove parallelism: intentional CPU work off main thread
  let acc = 0;
  const N = Math.min(Number(n) || 200000, 2_000_000);
  for (let i = 1; i <= N; i++) {
    acc += Math.sin(i * 0.001) * Math.cos(i * 0.0007);
  }
  return {
    schema: "thesis.worker.bench.v1",
    iterations: N,
    checksum: Math.round(acc * 1e6) / 1e6,
    locality: "browser-web-worker",
    note: "UI thread free during this loop",
  };
}

/** Delta residual attention (browser-side) — only changed channels get high weight. */
function deltaAttention(prev = {}, cur = {}, residualBias = 1.35) {
  const senses = ["text", "market", "law", "gas", "desk", "habit", "note", "stt", "chain"];
  const weights = {};
  const deltas = {};
  const staticCh = [];
  const hash = (v) => {
    const s = JSON.stringify(v ?? null);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  };
  for (const k of senses) {
    const ch = hash(cur[k]);
    const ph = hash(prev[k]);
    if (cur[k] != null && ch !== ph) {
      weights[k] = residualBias;
      deltas[k] = { kind: "delta" };
    } else if (cur[k] != null) {
      weights[k] = 1 / residualBias;
      staticCh.push(k);
    } else weights[k] = 0;
  }
  const tot = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const norm = {};
  for (const [k, v] of Object.entries(weights)) if (v > 0) norm[k] = Math.round((v / tot) * 10000) / 10000;
  return {
    schema: "thesis.worker.delta_attention.v1",
    weights: norm,
    deltas,
    static_channels: staticCh,
    efficiency_gain: Math.round((1 - (staticCh.length / senses.length) * 0.5) * 1000) / 1000,
    locality: "browser-web-worker",
  };
}

function fastDecodeWorker(goal = "", attention = {}) {
  const g = String(goal).toLowerCase();
  let intent = "agent.general";
  if (/morning|brief/.test(g)) intent = "habit.morning";
  else if (/reject|arena/.test(g)) intent = "safety.reject";
  else if (/signal|auto|trade/.test(g)) intent = "market.auto";
  else if (/post|tweet|x\.com/.test(g)) intent = "social.x_marketing";
  const w = attention.weights || {};
  const hops = [];
  if (w.habit >= 0.1) hops.push("brief");
  if (w.market >= 0.12) hops.push("signals");
  if (w.law >= 0.1) hops.push("reject");
  return {
    schema: "thesis.worker.fast_decode.v1",
    intent,
    tool_hops: hops,
    text: `worker decode intent=${intent} hops=${hops.join(",")}`,
    locality: "browser-web-worker",
  };
}

function hybridPulse(payload = {}) {
  const actions = payload.actions || [
    {
      agent: "worker-balanced",
      category: "vault",
      protocol: "beefy",
      slippage_bps: 15,
      value: 50,
      resulting_protocol_exposure_bps: 1000,
      resulting_liquid_reserve_bps: 4000,
      resulting_leverage_bps: 10000,
      expected_gain_bps: 200,
      risk_bps: 40,
    },
    {
      agent: "worker-degen",
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
  ];
  const arena = arenaBatch(actions, payload.policy);
  const agents = agentRank(
    payload.agents || [
      { name: "yield", return: 0.08, risk: 0.03, lawful: true },
      { name: "degen", return: 0.4, risk: 0.5, lawful: false },
    ]
  );
  const att = deltaAttention(payload.prev_senses || {}, payload.senses || { market: 1, law: 1 });
  const dec = fastDecodeWorker(payload.goal || "pulse", att);
  return {
    schema: "thesis.worker.hybrid_pulse.v1",
    doctrine: DOCTRINE,
    novel_tech: "blockchain + web-worker hybrid + delta attention",
    arena: {
      n_accepted: arena.n_accepted,
      n_rejected: arena.n_rejected,
      winner: arena.winner?.action?.agent,
    },
    agents: { winner: agents.winner?.name, n: agents.ranked.length },
    delta_attention: att,
    fast_decode: dec,
    locality: "browser-web-worker",
    free_main_thread: true,
  };
}

const OPS = {
  evaluate: (p) => evaluateAction(p.action || p, p.policy),
  arena: (p) => arenaBatch(p.actions || [], p.policy),
  signals: (p) => scoreSignals(p.signals || p.board || []),
  crawl: (p) => crawlProtocols(p.protocols || []),
  agents: (p) => agentRank(p.agents || []),
  fingerprint: (p) => chainFingerprint(p.payload ?? p),
  bench: (p) => heavyMath(p.n),
  pulse: (p) => hybridPulse(p || {}),
  delta: (p) => deltaAttention(p.prev || {}, p.current || p.senses || {}, p.residual_bias || 1.35),
  decode: (p) => fastDecodeWorker(p.goal || "", p.attention || {}),
  ping: () => ({ ok: true, pong: true, locality: "browser-web-worker" }),
};

self.onmessage = async (ev) => {
  const msg = ev.data || {};
  const id = msg.id;
  const op = msg.op || "ping";
  const t0 = performance.now();
  try {
    const fn = OPS[op];
    if (!fn) {
      self.postMessage({
        id,
        ok: false,
        error: `unknown op ${op}`,
        ops: Object.keys(OPS),
        elapsed_ms: performance.now() - t0,
      });
      return;
    }
    const result = await fn(msg.payload || {});
    self.postMessage({
      id,
      ok: true,
      op,
      result,
      elapsed_ms: Math.round((performance.now() - t0) * 100) / 100,
      worker: true,
      novel_tech: "web-worker-hybrid",
    });
  } catch (e) {
    self.postMessage({
      id,
      ok: false,
      op,
      error: String(e.message || e),
      elapsed_ms: performance.now() - t0,
      worker: true,
    });
  }
};
