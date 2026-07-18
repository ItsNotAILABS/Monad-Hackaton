/**
 * Local knowledge graph — nodes + edges in memory, persisted to IndexedDB notes.
 */

import { listNotes, remember, logEvent } from "./memory.js";

const GRAPH_KEY = "thesis.kg.v1";

function loadLocal() {
  try {
    const raw = localStorage.getItem(GRAPH_KEY);
    if (!raw) return { nodes: {}, edges: [] };
    return JSON.parse(raw);
  } catch {
    return { nodes: {}, edges: [] };
  }
}

function saveLocal(g) {
  localStorage.setItem(GRAPH_KEY, JSON.stringify(g));
}

export function getGraph() {
  return loadLocal();
}

export function upsertNode(id, data = {}) {
  const g = loadLocal();
  const prev = g.nodes[id] || {};
  g.nodes[id] = {
    id,
    label: data.label || prev.label || id,
    type: data.type || prev.type || "entity",
    props: { ...(prev.props || {}), ...(data.props || {}) },
    updated: Date.now(),
  };
  saveLocal(g);
  return g.nodes[id];
}

export function addEdge(from, to, rel = "related", props = {}) {
  const g = loadLocal();
  upsertNode(from, { label: from });
  upsertNode(to, { label: to });
  const edge = {
    id: `e-${from}-${rel}-${to}-${Date.now().toString(36)}`,
    from,
    to,
    rel,
    props,
    ts: Date.now(),
  };
  g.edges.push(edge);
  // cap edges
  if (g.edges.length > 2000) g.edges = g.edges.slice(-1500);
  saveLocal(g);
  return edge;
}

export function neighbors(nodeId, { limit = 20 } = {}) {
  const g = loadLocal();
  const out = [];
  for (const e of g.edges) {
    if (e.from === nodeId) out.push({ ...e, direction: "out", other: e.to });
    else if (e.to === nodeId) out.push({ ...e, direction: "in", other: e.from });
    if (out.length >= limit) break;
  }
  return out;
}

export function searchNodes(q, { limit = 20 } = {}) {
  const g = loadLocal();
  const low = (q || "").toLowerCase();
  return Object.values(g.nodes)
    .filter(
      (n) =>
        !low ||
        n.id.toLowerCase().includes(low) ||
        (n.label || "").toLowerCase().includes(low) ||
        (n.type || "").toLowerCase().includes(low)
    )
    .slice(0, limit);
}

export function graphStats() {
  const g = loadLocal();
  const types = {};
  for (const n of Object.values(g.nodes)) {
    types[n.type] = (types[n.type] || 0) + 1;
  }
  return {
    nodes: Object.keys(g.nodes).length,
    edges: g.edges.length,
    types,
    locality: "browser-only",
  };
}

/** Seed graph from platform facts + memory notes */
export async function hydrateFromPlatform(facts = {}) {
  const root = upsertNode("thesis.platform", {
    label: "THESIS Platform",
    type: "platform",
    props: { version: facts.version },
  });

  if (facts.laws) {
    const law = upsertNode("primitive.law", { label: "Law", type: "primitive" });
    addEdge(root.id, law.id, "has_primitive");
    upsertNode("law.count", {
      label: `${facts.laws} ecosystem laws`,
      type: "metric",
      props: { count: facts.laws },
    });
    addEdge(law.id, "law.count", "measures");
  }
  if (facts.wallets != null) {
    const idn = upsertNode("primitive.identity", { label: "Identity", type: "primitive" });
    addEdge(root.id, idn.id, "has_primitive");
    upsertNode("wallets.linked", {
      label: `${facts.wallets} wallets linked`,
      type: "metric",
      props: { count: facts.wallets },
    });
    addEdge(idn.id, "wallets.linked", "measures");
  }
  if (facts.desk_equity != null) {
    const mkt = upsertNode("primitive.market", { label: "Market", type: "primitive" });
    addEdge(root.id, mkt.id, "has_primitive");
    upsertNode("desk.equity", {
      label: `Desk equity ${Number(facts.desk_equity).toFixed(2)}`,
      type: "metric",
      props: { equity: facts.desk_equity },
    });
    addEdge(mkt.id, "desk.equity", "measures");
  }
  if (Array.isArray(facts.venues)) {
    const mkt = upsertNode("primitive.market", { label: "Market", type: "primitive" });
    for (const v of facts.venues.slice(0, 12)) {
      const nid = `venue.${v.id || v.name}`;
      upsertNode(nid, { label: v.name || v.id, type: "venue", props: v });
      addEdge(mkt.id, nid, "lists_venue");
    }
  }
  if (Array.isArray(facts.apps)) {
    for (const a of facts.apps.slice(0, 20)) {
      const nid = `app.${a.id || a.name}`;
      upsertNode(nid, { label: a.name || a.id, type: "app", props: a });
      addEdge(root.id, nid, "installs");
    }
  }

  // Link recent memory notes into graph
  const notes = await listNotes({ limit: 30 });
  for (const n of notes) {
    const nid = `memory.${n.id}`;
    upsertNode(nid, {
      label: (n.text || "").slice(0, 48),
      type: "memory",
      props: { kind: n.kind, ts: n.ts },
    });
    addEdge(root.id, nid, "remembers");
  }

  await logEvent("kg.hydrate", { nodes: graphStats().nodes, edges: graphStats().edges });
  return graphStats();
}

/** Extract simple entities from free text into the graph */
export async function ingestText(text, { source = "ingest" } = {}) {
  const raw = String(text || "");
  const docId = `doc.${Date.now().toString(36)}`;
  upsertNode(docId, { label: raw.slice(0, 40) || "document", type: "document", props: { source } });

  // tickers / pairs
  const pairs = raw.match(/\b[A-Z]{2,6}\/[A-Z]{2,6}\b/g) || [];
  for (const p of [...new Set(pairs)].slice(0, 10)) {
    upsertNode(`pair.${p}`, { label: p, type: "pair" });
    addEdge(docId, `pair.${p}`, "mentions");
  }
  // law ids
  const laws = raw.match(/\b(?:sys|monad|proto|intel|exec)\.[a-z0-9.-]+\b/gi) || [];
  for (const l of [...new Set(laws)].slice(0, 15)) {
    upsertNode(`law.${l}`, { label: l, type: "law" });
    addEdge(docId, `law.${l}`, "cites");
  }
  // 0x addresses (truncated nodes)
  const addrs = raw.match(/\b0x[a-fA-F0-9]{8,40}\b/g) || [];
  for (const a of [...new Set(addrs)].slice(0, 8)) {
    const short = a.slice(0, 12);
    upsertNode(`addr.${short}`, { label: short + "…", type: "address", props: { full: a } });
    addEdge(docId, `addr.${short}`, "mentions");
  }
  // protocols-ish words
  const protos = ["kuru", "uniswap", "monad", "vault", "perps", "lending", "dex"];
  const low = raw.toLowerCase();
  for (const p of protos) {
    if (low.includes(p)) {
      upsertNode(`topic.${p}`, { label: p, type: "topic" });
      addEdge(docId, `topic.${p}`, "about");
    }
  }

  await remember(raw.slice(0, 2000), { kind: "kg-ingest", source, tags: ["graph"] });
  return { document: docId, stats: graphStats() };
}

export function exportGraph() {
  return loadLocal();
}

export function clearGraph() {
  localStorage.removeItem(GRAPH_KEY);
  return { nodes: 0, edges: 0 };
}
