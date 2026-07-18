/**
 * Browser-local security monitoring.
 * Scans text, memory, and platform payloads for secret leakage + risky patterns.
 * Never stores secrets — only findings.
 */

import { logEvent, listEvents, listNotes } from "./memory.js";

const SECRET_PATTERNS = [
  { id: "privkey-hex", re: /\b(?:0x)?[a-fA-F0-9]{64}\b/g, severity: "critical", label: "Possible private key (64 hex)" },
  { id: "mnemonic", re: /\b([a-z]+\s+){11,23}[a-z]+\b/gi, severity: "critical", label: "Possible seed phrase" },
  { id: "api-key", re: /\b(?:sk|pk|api[_-]?key|secret)[-_:= ]+[A-Za-z0-9/+=]{16,}\b/gi, severity: "high", label: "API key-like secret" },
  { id: "bearer", re: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/g, severity: "high", label: "Bearer token" },
  { id: "aws", re: /\bAKIA[0-9A-Z]{16}\b/g, severity: "high", label: "AWS access key id" },
];

const RISK_PATTERNS = [
  { id: "unlimited-approve", re: /\bunlimited\s+approv|approve\(\s*type\(uint256\)\.max|maxUint256\b/gi, severity: "high", label: "Unlimited approval language" },
  { id: "silent-broadcast", re: /\bauto[- ]?broadcast|without\s+signature|silent\s+send\b/gi, severity: "critical", label: "Silent broadcast risk" },
  { id: "export-key", re: /\bexport\s+(private\s+)?key|dump\s+seed|show\s+mnemonic\b/gi, severity: "critical", label: "Key export request" },
  { id: "fat-gas", re: /\bgas\s*limit\s*[:=]?\s*\d{7,}|\b2x\s+buffer\b/gi, severity: "medium", label: "Fat gas limit (Monad bills limit)" },
  { id: "blob-tx", re: /\btype\s*3\b|\bEIP-?4844\b|\bblob\s+tx\b/gi, severity: "medium", label: "Blob tx (unsupported on Monad)" },
  { id: "mainnet-force", re: /\bforce[_-]?live\b|\blive\s+capital\s+on\s+planned\b/gi, severity: "high", label: "Force live on non-live adapter" },
];

function hits(text, patterns) {
  const findings = [];
  const s = String(text || "");
  if (!s) return findings;
  for (const p of patterns) {
    p.re.lastIndex = 0;
    const m = s.match(p.re);
    if (m && m.length) {
      findings.push({
        id: p.id,
        label: p.label,
        severity: p.severity,
        count: m.length,
        sample: String(m[0]).slice(0, 24) + (String(m[0]).length > 24 ? "…" : ""),
      });
    }
  }
  return findings;
}

export function scanText(text, { context = "input" } = {}) {
  const secret = hits(text, SECRET_PATTERNS);
  const risk = hits(text, RISK_PATTERNS);
  const findings = [...secret, ...risk].map((f) => ({ ...f, context }));
  const score = findings.reduce((acc, f) => {
    if (f.severity === "critical") return acc + 40;
    if (f.severity === "high") return acc + 20;
    if (f.severity === "medium") return acc + 8;
    return acc + 3;
  }, 0);
  return {
    ok: findings.filter((f) => f.severity === "critical" || f.severity === "high").length === 0,
    score: Math.min(100, score),
    findings,
    context,
    ts: Date.now(),
    locality: "browser-only",
  };
}

/** Block paste of secrets into platform surfaces */
export function assertSafe(text) {
  const r = scanText(text, { context: "gate" });
  const critical = r.findings.filter((f) => f.severity === "critical");
  if (critical.length) {
    const err = new Error(
      `Security gate blocked: ${critical.map((c) => c.label).join("; ")}. Never paste keys or seeds.`
    );
    err.findings = critical;
    throw err;
  }
  return r;
}

export async function monitorPayload(payload, { source = "platform" } = {}) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload || {});
  const report = scanText(text, { context: source });
  if (report.findings.length) {
    await logEvent("security.alert", {
      message: `${report.findings.length} findings in ${source}`,
      score: report.score,
      findings: report.findings.slice(0, 12),
      source,
    });
  } else {
    await logEvent("security.clean", { message: `clean scan · ${source}`, source });
  }
  return report;
}

export async function auditMemory() {
  const notes = await listNotes({ limit: 100 });
  const all = [];
  for (const n of notes) {
    const r = scanText(n.text, { context: `memory:${n.id}` });
    for (const f of r.findings) all.push({ ...f, noteId: n.id });
  }
  const report = {
    ok: !all.some((f) => f.severity === "critical"),
    scanned: notes.length,
    findings: all.slice(0, 40),
    score: Math.min(100, all.length * 5),
    ts: Date.now(),
  };
  await logEvent("security.audit_memory", {
    message: `audited ${notes.length} notes · ${all.length} findings`,
    findings: all.slice(0, 8),
  });
  return report;
}

export async function securityDashboard() {
  const events = await listEvents({ limit: 60 });
  const alerts = events.filter((e) => String(e.kind).startsWith("security."));
  const critical = alerts.filter((e) =>
    (e.detail?.findings || []).some((f) => f.severity === "critical")
  );
  return {
    alerts: alerts.length,
    criticalRuns: critical.length,
    recent: alerts.slice(0, 15),
    posture: critical.length ? "elevated" : alerts.some((a) => a.kind === "security.alert") ? "watch" : "calm",
    locality: "browser-only",
    doctrine: "Never store private keys. AI twins only. Owner signs.",
  };
}
