/**
 * Browser-local document generation (markdown / plain).
 * Stored in IndexedDB — never uploaded.
 */

import { saveDoc, listDocs } from "./memory.js";

function mdEscape(s) {
  return String(s || "").replace(/\r/g, "");
}

export async function generateResearchReport({ query, scout, risk, synth, elapsed_ms }) {
  const lines = [
    `# THESIS Local Research Report`,
    ``,
    `> Generated entirely in-browser · Transformers.js + local memory · no cloud LLM`,
    ``,
    `**Query:** ${mdEscape(query)}`,
    ``,
    `**Elapsed:** ${(elapsed_ms || 0).toFixed(0)} ms`,
    ``,
    `## Summary`,
    ``,
    mdEscape(synth?.summary || "n/a"),
    ``,
    `## Insights`,
    ``,
  ];
  for (const i of synth?.insights || []) {
    lines.push(`### ${mdEscape(i.title)}`);
    lines.push(``);
    lines.push(mdEscape(i.body));
    lines.push(``);
  }
  lines.push(`## Scout · memory hits`);
  lines.push(``);
  for (const m of scout?.memory_hits || []) {
    lines.push(`- **${m.score}** — ${mdEscape(m.text)}`);
  }
  if (!(scout?.memory_hits || []).length) lines.push(`- _(none)_`);
  lines.push(``);
  lines.push(`## Scout · graph nodes`);
  lines.push(``);
  for (const n of scout?.graph_nodes || []) {
    lines.push(`- \`${n.type}\` **${mdEscape(n.label)}** (\`${n.id}\`)`);
  }
  lines.push(``);
  lines.push(`## Risk`);
  lines.push(``);
  for (const r of risk?.risks || []) {
    lines.push(`- **${r.severity}:** ${mdEscape(r.note)}`);
  }
  if (!(risk?.risks || []).length) lines.push(`- No pattern risks flagged`);
  if (risk?.security?.findings?.length) {
    lines.push(``);
    lines.push(`### Security monitor`);
    lines.push(``);
    for (const f of risk.security.findings) {
      lines.push(`- **${f.severity}** ${f.label}`);
    }
  }
  lines.push(``);
  lines.push(`## Platform pulse`);
  lines.push(``);
  lines.push(`- Laws: ${scout?.platform?.laws ?? "—"}`);
  lines.push(`- Wallets: ${scout?.platform?.wallets ?? "—"}`);
  lines.push(`- Desk equity: ${scout?.platform?.equity ?? "—"}`);
  lines.push(`- Venues: ${(scout?.platform?.venues || []).join(", ") || "—"}`);
  lines.push(``);
  lines.push(`## Next actions`);
  lines.push(``);
  for (const a of synth?.actions || []) lines.push(`1. ${mdEscape(a)}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(`*THESIS Platform · local-ai · document generation*`);

  const text = lines.join("\n");
  return saveDoc({
    title: `Research: ${(query || "").slice(0, 48)}`,
    text,
    format: "markdown",
    meta: { kind: "research-report", query },
  });
}

export async function generateSecurityBrief(dashboard, audit) {
  const lines = [
    `# THESIS Local Security Brief`,
    ``,
    `**Posture:** ${dashboard?.posture || "unknown"}`,
    `**Alerts:** ${dashboard?.alerts ?? 0} · **Critical runs:** ${dashboard?.criticalRuns ?? 0}`,
    ``,
    `## Doctrine`,
    ``,
    mdEscape(dashboard?.doctrine || "Never store private keys."),
    ``,
    `## Memory audit`,
    ``,
    `- Scanned notes: ${audit?.scanned ?? 0}`,
    `- Findings: ${(audit?.findings || []).length}`,
    `- OK: ${audit?.ok ? "yes" : "NO"}`,
    ``,
  ];
  for (const f of (audit?.findings || []).slice(0, 20)) {
    lines.push(`- **${f.severity}** ${f.label} · ${f.context || ""}`);
  }
  lines.push(``);
  lines.push(`## Recent security events`);
  lines.push(``);
  for (const e of (dashboard?.recent || []).slice(0, 12)) {
    lines.push(`- \`${e.kind}\` ${mdEscape(e.text || e.detail?.message || "")}`);
  }
  const text = lines.join("\n");
  return saveDoc({
    title: `Security brief ${new Date().toISOString().slice(0, 10)}`,
    text,
    format: "markdown",
    meta: { kind: "security-brief" },
  });
}

export async function generateKnowledgeMap(stats, sampleNodes = []) {
  const lines = [
    `# THESIS Local Knowledge Map`,
    ``,
    `- Nodes: ${stats?.nodes ?? 0}`,
    `- Edges: ${stats?.edges ?? 0}`,
    `- Types: ${JSON.stringify(stats?.types || {})}`,
    ``,
    `## Sample nodes`,
    ``,
  ];
  for (const n of sampleNodes.slice(0, 40)) {
    lines.push(`- \`${n.type}\` **${mdEscape(n.label)}**`);
  }
  const text = lines.join("\n");
  return saveDoc({
    title: `Knowledge map ${new Date().toISOString().slice(0, 16)}`,
    text,
    format: "markdown",
    meta: { kind: "knowledge-map" },
  });
}

export async function generatePlatformOpsDoc(platform) {
  const lines = [
    `# THESIS Platform Ops Snapshot`,
    ``,
    `**Product:** ${platform?.product || "THESIS Platform"}`,
    `**Version:** ${platform?.version || "—"}`,
    ``,
    `## Doctrine`,
    ``,
    mdEscape(platform?.doctrine || ""),
    ``,
    `## Kernel`,
    ``,
    `- Primitives OK: ${platform?.kernel?.primitives_ok}/${platform?.kernel?.primitives_total}`,
    `- Receipt tip: \`${platform?.kernel?.receipt_tip || "—"}\``,
    ``,
    `## Apps`,
    ``,
    `- First-party: ${platform?.apps?.first_party_count ?? "—"}`,
    `- Forged: ${platform?.apps?.forged_count ?? "—"}`,
    `- Total: ${platform?.apps?.total ?? "—"}`,
    ``,
    `## Pulse`,
    ``,
    `- Laws: ${platform?.pulse?.laws ?? "—"}`,
    `- Wallets: ${platform?.pulse?.wallets ?? "—"}`,
    `- Desk equity: ${platform?.pulse?.desk_equity ?? "—"}`,
    `- Packages: ${platform?.pulse?.packages ?? "—"}`,
    ``,
    `*Generated in-browser — not uploaded*`,
  ];
  return saveDoc({
    title: `Platform ops ${new Date().toISOString().slice(0, 16)}`,
    text: lines.join("\n"),
    format: "markdown",
    meta: { kind: "platform-ops" },
  });
}

export { listDocs };

export function downloadMarkdown(doc) {
  const blob = new Blob([doc.text || ""], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(doc.title || "thesis-doc").replace(/[^\w.-]+/g, "_").slice(0, 60)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
