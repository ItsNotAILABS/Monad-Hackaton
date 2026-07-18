/**
 * Autonomous research agents — run fully in the browser.
 * Use local embeddings + knowledge graph + optional platform API context.
 */

import { embedSafe } from "./inference.js";
import { remember, recall, saveRun, logEvent, cosine } from "./memory.js";
import { getGraph, hydrateFromPlatform, ingestText, neighbors, searchNodes } from "./knowledgeGraph.js";
import { assertSafe, monitorPayload } from "./security.js";
import { generateResearchReport } from "./documents.js";

const AGENTS = [
  {
    id: "scout",
    name: "Scout",
    role: "Map entities, venues, laws, and memory hits for the query",
  },
  {
    id: "risk",
    name: "Risk",
    role: "Flag Monad gas, approval, and custody risks in the context",
  },
  {
    id: "synthesizer",
    name: "Synthesizer",
    role: "Merge findings into ranked insights + next actions",
  },
];

function riskScan(text) {
  const low = String(text || "").toLowerCase();
  const hits = [];
  if (/private key|seed|mnemonic|export key/.test(low)) {
    hits.push({ severity: "critical", note: "Custody: never handle real keys in research text" });
  }
  if (/unlimited|maxuint|approve all/.test(low)) {
    hits.push({ severity: "high", note: "Exact approval only — unlimited approvals banned by default" });
  }
  if (/gas.?limit|2x buffer|estimateGas/.test(low)) {
    hits.push({
      severity: "medium",
      note: "Monad bills gas_limit not gas used — use ~7.5% margin or hardcode 21k transfers",
    });
  }
  if (/perps|leverage|degen/.test(low)) {
    hits.push({ severity: "medium", note: "Leverage/perps likely NOMOS-rejected under default constitution" });
  }
  if (/blob|eip-4844|type 3/.test(low)) {
    hits.push({ severity: "medium", note: "Blob txs unsupported on Monad" });
  }
  return hits;
}

async function agentScout(query, ctx) {
  const qEmb = await embedSafe(query);
  const mem = await recall(qEmb, { limit: 6, minScore: 0.15 });
  const nodes = searchNodes(query, { limit: 12 });
  const graph = getGraph();
  const related = [];
  for (const n of nodes.slice(0, 5)) {
    related.push(...neighbors(n.id, { limit: 4 }));
  }
  return {
    agent: "scout",
    memory_hits: mem.map((m) => ({
      id: m.id,
      score: Number(m.score?.toFixed?.(3) ?? m.score),
      text: (m.text || "").slice(0, 160),
    })),
    graph_nodes: nodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
    edges_sample: related.slice(0, 10).map((e) => ({
      from: e.from,
      to: e.to,
      rel: e.rel,
    })),
    platform: {
      laws: ctx.laws,
      wallets: ctx.wallets,
      equity: ctx.desk_equity,
      venues: (ctx.venues || []).slice(0, 6).map((v) => v.name || v.id),
    },
    graph_size: { nodes: Object.keys(graph.nodes).length, edges: graph.edges.length },
  };
}

async function agentRisk(query, scout) {
  const blob = [
    query,
    ...(scout.memory_hits || []).map((m) => m.text),
    JSON.stringify(scout.platform || {}),
  ].join("\n");
  const risks = riskScan(blob);
  const sec = await monitorPayload(blob, { source: "research.risk" });
  return {
    agent: "risk",
    risks,
    security: {
      ok: sec.ok,
      score: sec.score,
      findings: sec.findings.slice(0, 8),
    },
  };
}

async function agentSynth(query, scout, risk) {
  const insights = [];
  if (scout.memory_hits?.length) {
    insights.push({
      rank: 1,
      title: "Local memory has relevant prior notes",
      body: scout.memory_hits
        .slice(0, 3)
        .map((m) => `(${m.score}) ${m.text}`)
        .join(" · "),
    });
  } else {
    insights.push({
      rank: 1,
      title: "No strong memory hits — seed the graph",
      body: "Ingest platform pulse or paste research text to grow local knowledge.",
    });
  }
  if (scout.graph_nodes?.length) {
    insights.push({
      rank: 2,
      title: `Knowledge graph: ${scout.graph_nodes.length} related nodes`,
      body: scout.graph_nodes.map((n) => n.label).join(", "),
    });
  }
  if (scout.platform?.venues?.length) {
    insights.push({
      rank: 3,
      title: "Desk venues in scope",
      body: scout.platform.venues.join(", "),
    });
  }
  for (const r of risk.risks || []) {
    insights.push({
      rank: r.severity === "critical" ? 0 : 4,
      title: `Risk · ${r.severity}`,
      body: r.note,
    });
  }
  if (risk.security && !risk.security.ok) {
    insights.push({
      rank: 0,
      title: "Security monitor raised findings",
      body: (risk.security.findings || []).map((f) => f.label).join("; ") || "see security panel",
    });
  }

  insights.sort((a, b) => a.rank - b.rank);

  const actions = [
    "Remember this research run in local memory",
    "Open DESK if trade tickets are implied",
    "Run capital vault sim only after NOMOS accept",
    "Keep keys in extension — local AI never receives them",
  ];

  return {
    agent: "synthesizer",
    query,
    insights: insights.slice(0, 8),
    actions,
    summary: insights
      .slice(0, 4)
      .map((i) => i.title)
      .join(" · "),
  };
}

/**
 * Run multi-agent research loop entirely in-browser.
 * @param {string} query
 * @param {object} platformCtx - optional pulse from /platform or /landing
 */
export async function runResearch(query, platformCtx = {}) {
  assertSafe(query);
  const t0 = performance.now();
  await logEvent("research.start", { message: query.slice(0, 120) });

  // Keep graph fresh with platform facts
  await hydrateFromPlatform({
    version: platformCtx.version,
    laws: platformCtx.laws || platformCtx.law_count,
    wallets: platformCtx.wallets,
    desk_equity: platformCtx.desk_equity,
    venues: platformCtx.venues,
    apps: platformCtx.apps,
  });
  await ingestText(query, { source: "research.query" });

  const qEmb = await embedSafe(query);
  await remember(query, {
    kind: "research-query",
    embedding: qEmb,
    tags: ["research"],
    source: "agent",
  });

  const scout = await agentScout(query, platformCtx);
  const risk = await agentRisk(query, scout);
  const synth = await agentSynth(query, scout, risk);

  const doc = await generateResearchReport({
    query,
    scout,
    risk,
    synth,
    elapsed_ms: performance.now() - t0,
  });

  const run = {
    kind: "research",
    query,
    summary: synth.summary,
    agents: AGENTS,
    scout,
    risk,
    synth,
    document_id: doc.id,
    elapsed_ms: performance.now() - t0,
    locality: "browser-only",
  };
  await saveRun(run);
  await remember(synth.summary, {
    kind: "research-summary",
    embedding: await embedSafe(synth.summary),
    tags: ["research", "summary"],
    source: "agent",
  });
  await logEvent("research.done", {
    message: synth.summary.slice(0, 160),
    document_id: doc.id,
  });

  return run;
}

export function listAgents() {
  return AGENTS.map((a) => ({ ...a, locality: "browser-only" }));
}

/** Rank platform texts by relevance to query using local embeddings */
export async function rankTexts(query, texts = []) {
  const q = await embedSafe(query);
  const scored = [];
  for (const t of texts) {
    const e = await embedSafe(t);
    scored.push({ text: t, score: cosine(q, e) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}
