import crypto from "node:crypto";

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function sha256(value) { return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex"); }
function number(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }

const BUILT_INS = [
  { id: "mesie.score", name: "MESIE Readiness Score", description: "Scores latency, coherence, proof coverage, reliability, and parallelism readiness." },
  { id: "manifest.validate", name: "Agent Manifest Validator", description: "Validates the four-plane Agent Card manifest before minting." },
  { id: "receipt.verify", name: "Receipt Integrity Verifier", description: "Recomputes a canonical SHA-256 receipt hash and compares it to the supplied root hash." },
  { id: "monad.parallelism.review", name: "Monad Parallelism Review", description: "Flags likely shared-state contention and serial bottlenecks in Solidity source." },
];

function runBuiltIn(id, input) {
  if (id === "mesie.score") {
    const latencyScore = Math.max(0, Math.min(1, 1 - Math.max(0, number(input.latencyMs)) / 2000));
    const coherence = Math.max(0, Math.min(1, number(input.coherence)));
    const proof = Math.max(0, Math.min(1, number(input.proofCoverage)));
    const reliability = Math.max(0, Math.min(1, number(input.reliability)));
    const parallelism = 1 - Math.max(0, Math.min(1, number(input.conflictRate)));
    const score = 100 * (0.2 * latencyScore + 0.25 * coherence + 0.2 * proof + 0.2 * reliability + 0.15 * parallelism);
    return { score: Number(score.toFixed(2)), band: score >= 85 ? "release" : score >= 70 ? "candidate" : "research", axes: { latencyScore, coherence, proof, reliability, parallelism } };
  }
  if (id === "manifest.validate") {
    const missing = [];
    if (input.schema !== "thesis.agent-card.v1") missing.push("schema");
    if (!input.profile || typeof input.profile !== "object") missing.push("profile");
    if (!Array.isArray(input.capabilities) || !input.capabilities.length) missing.push("capabilities");
    if (!input.doctrine || typeof input.doctrine !== "object") missing.push("doctrine");
    if (!input.runtime || typeof input.runtime !== "object") missing.push("runtime");
    return { valid: missing.length === 0, missing, manifestHash: sha256(input) };
  }
  if (id === "receipt.verify") {
    const computedHash = sha256(input.receipt || {});
    return { valid: computedHash.toLowerCase() === String(input.expectedHash || "").replace(/^0x/, "").toLowerCase(), computedHash };
  }
  if (id === "monad.parallelism.review") {
    const source = String(input.source || "");
    const findings = [];
    if (/uint\w*\s+public\s+(counter|nonce|index)/i.test(source)) findings.push("Global sequential counter may create a shared write hotspot.");
    if (/total(Supply|Volume|Jobs|Mints)\s*[+\-]?=/i.test(source)) findings.push("Global aggregate mutation can serialize independent operations.");
    if (/for\s*\([^;]*;[^;]*\.length/i.test(source)) findings.push("Unbounded collection iteration can dominate gas and latency.");
    if (!findings.length) findings.push("No obvious shared-state hotspot found by the deterministic heuristic; benchmark and trace before release.");
    return { findings, sourceHash: crypto.createHash("sha256").update(source).digest("hex"), method: "deterministic-heuristic-v1" };
  }
  throw new Error(`Unknown built-in tool: ${id}`);
}

async function fetchJson(url, init = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `${response.status} ${response.statusText}`);
    return body;
  } finally { clearTimeout(timer); }
}

export async function listTools(config) {
  let remote = [];
  if (config.toolGatewayOrigin) {
    try {
      const result = await fetchJson(`${config.toolGatewayOrigin}/tools/catalog`);
      remote = Array.isArray(result.tools) ? result.tools.map((tool) => ({ ...tool, remote: true })) : [];
    } catch (error) {
      remote = [{ id: "remote.unavailable", name: "Remote gateway unavailable", description: String(error.message), disabled: true, remote: true }];
    }
  }
  return [...BUILT_INS, ...remote];
}

export async function runTool(config, id, input) {
  if (BUILT_INS.some((tool) => tool.id === id)) return { ok: true, source: "desktop", tool: id, result: runBuiltIn(id, input || {}) };
  if (!config.toolGatewayOrigin) throw new Error("Remote tool gateway is not configured.");
  const catalog = await listTools(config);
  if (!catalog.some((tool) => tool.remote && !tool.disabled && tool.id === id)) throw new Error(`Remote tool is not in the approved catalog: ${id}`);
  return fetchJson(`${config.toolGatewayOrigin}/tools/run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tool: id, input: input || {} }) }, 60000);
}
