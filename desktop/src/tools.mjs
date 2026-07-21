import crypto from "node:crypto";

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function sha256(value) { return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex"); }
function number(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }

export const TOOLS = [
  { id: "mesie.score", name: "MESIE Readiness Score", source: "desktop", description: "Scores latency, coherence, proof coverage, reliability, and parallelism." },
  { id: "manifest.validate", name: "Agent Manifest Validator", source: "desktop", description: "Validates a four-plane Agent Card manifest and positive version." },
  { id: "receipt.verify", name: "Receipt Integrity Verifier", source: "desktop", description: "Recomputes a canonical SHA-256 receipt commitment." },
  { id: "monad.parallelism.review", name: "Monad Parallelism Review", source: "desktop", description: "Flags obvious shared-state and iteration bottlenecks." },
  { id: "thesis.runtime.status", name: "THESIS Runtime Status", source: "backend", method: "GET", path: "/agent" },
  { id: "thesis.receipts.recent", name: "Recent THESIS Receipts", source: "backend", method: "GET", path: "/receipts/recent?n=8" },
];

export function listTools(config) {
  const enabled = new Set(config.enabledBackendTools || []);
  return TOOLS.map((tool) => ({ ...tool, enabled: tool.source === "desktop" || Boolean(config.thesisApiOrigin && enabled.has(tool.id)) }));
}

function runLocal(id, input) {
  if (id === "mesie.score") {
    const latency = Math.max(0, Math.min(1, 1 - Math.max(0, number(input.latencyMs)) / 2000));
    const coherence = Math.max(0, Math.min(1, number(input.coherence)));
    const proof = Math.max(0, Math.min(1, number(input.proofCoverage)));
    const reliability = Math.max(0, Math.min(1, number(input.reliability)));
    const parallelism = 1 - Math.max(0, Math.min(1, number(input.conflictRate)));
    const score = 100 * (0.2 * latency + 0.25 * coherence + 0.2 * proof + 0.2 * reliability + 0.15 * parallelism);
    return { score: Number(score.toFixed(2)), band: score >= 85 ? "release" : score >= 70 ? "candidate" : "research", axes: { latency, coherence, proof, reliability, parallelism } };
  }
  if (id === "manifest.validate") {
    const missing = [];
    if (input.schema !== "thesis.agent-card.v1") missing.push("schema");
    if (!input.profile || typeof input.profile !== "object") missing.push("profile");
    if (!Array.isArray(input.capabilities) || !input.capabilities.length) missing.push("capabilities");
    if (!input.doctrine || typeof input.doctrine !== "object") missing.push("doctrine");
    if (!input.runtime || typeof input.runtime !== "object") missing.push("runtime");
    if (!Number.isSafeInteger(Number(input.version)) || Number(input.version) <= 0) missing.push("positive version");
    return { valid: missing.length === 0, missing, manifestHash: sha256(input) };
  }
  if (id === "receipt.verify") {
    const computedHash = sha256(input.receipt || {});
    return { valid: computedHash === String(input.expectedHash || "").replace(/^0x/, "").toLowerCase(), computedHash };
  }
  if (id === "monad.parallelism.review") {
    const source = String(input.source || "");
    const findings = [];
    if (/uint\w*\s+public\s+(counter|nonce|index)/i.test(source)) findings.push("Global sequential counter may create a shared write hotspot.");
    if (/total(Supply|Volume|Jobs|Mints)\s*[+\-]?=/i.test(source)) findings.push("Global aggregate mutation can serialize otherwise independent operations.");
    if (/for\s*\([^;]*;[^;]*\.length/i.test(source)) findings.push("Unbounded collection iteration can dominate gas and latency.");
    if (!findings.length) findings.push("No obvious hotspot found; benchmark and trace before release.");
    return { findings, sourceHash: crypto.createHash("sha256").update(source).digest("hex"), method: "deterministic-heuristic-v2" };
  }
  throw new Error(`Unknown local tool: ${id}`);
}

async function fetchJson(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { accept: "application/json" }, signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `${response.status} ${response.statusText}`);
    return body;
  } finally { clearTimeout(timer); }
}

export async function runTool(config, id, input = {}) {
  const tool = TOOLS.find((candidate) => candidate.id === id);
  if (!tool) throw new Error("Unknown tool.");
  if (tool.source === "desktop") return { ok: true, source: "desktop", tool: id, result: runLocal(id, input) };
  if (!config.thesisApiOrigin || !(config.enabledBackendTools || []).includes(id)) throw new Error("Backend tool is not explicitly enabled.");
  return { ok: true, source: "thesis", tool: id, result: await fetchJson(`${config.thesisApiOrigin}${tool.path}`) };
}

export function generateCode({ language = "javascript", kind = "receipt-verifier", name = "AgentClient" } = {}) {
  const safeName = String(name).replace(/[^a-zA-Z0-9_]/g, "") || "AgentClient";
  if (language === "solidity" && kind === "agent-service") return `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.26;\ncontract ${safeName} {\n    event ServiceExecuted(bytes32 indexed requestHash, bytes32 indexed resultHash);\n    function record(bytes32 requestHash, bytes32 resultHash) external {\n        require(requestHash != bytes32(0) && resultHash != bytes32(0), "invalid proof");\n        emit ServiceExecuted(requestHash, resultHash);\n    }\n}\n`;
  if (language === "python") return `import hashlib\nimport json\n\ndef canonical_receipt(receipt: dict) -> tuple[str, str]:\n    normalized = json.dumps(receipt, sort_keys=True, separators=(",", ":"))\n    return normalized, hashlib.sha256(normalized.encode()).hexdigest()\n`;
  return `export function canonicalReceipt(receipt) {\n  const normalized = JSON.stringify(receipt, Object.keys(receipt).sort());\n  return { normalized };\n}\n`;
}
