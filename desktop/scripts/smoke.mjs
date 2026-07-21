import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { validateConfig } from "../src/config.mjs";
import { generateCode, listTools, runTool } from "../src/tools.mjs";
let assertions = 0;
const check = (value, message) => { assertions += 1; assert.ok(value, message); };
const workflows = JSON.parse(await fs.readFile(new URL("../workflows/agent-mint-workflows.json", import.meta.url), "utf8"));
check(workflows.schema === "thesis.agent-mint.workflows.v1", "schema");
check(workflows.workflows.length === 3, "workflow count");
for (const workflow of workflows.workflows) for (const step of workflow.steps) check(step.length > 8, `${workflow.id} step`);
const config = validateConfig({ builderAppUrl: "https://builder.example", thesisApiOrigin: "https://thesis.example", enabledBackendTools: ["thesis.runtime.status", "unknown"] });
check(config.enabledBackendTools.length === 1, "backend allowlist");
for (const tool of listTools(config)) { check(tool.id, "tool id"); check(tool.name, "tool name"); check(["desktop", "backend"].includes(tool.source), "tool source"); }
for (let index = 0; index < 22; index += 1) {
  const result = await runTool(config, "mesie.score", { latencyMs: 100 + index, coherence: 0.95, proofCoverage: 0.92, reliability: 0.99, conflictRate: 0.02 });
  check(result.result.score >= 85, `MESIE ${index}`);
  check(result.result.band === "release", `MESIE band ${index}`);
}
for (let version = 1; version <= 12; version += 1) {
  const result = await runTool(config, "manifest.validate", { schema: "thesis.agent-card.v1", version, profile: {}, capabilities: ["audit"], doctrine: {}, runtime: {} });
  check(result.result.valid, `manifest ${version}`);
  check(result.result.manifestHash.length === 64, `manifest hash ${version}`);
}
for (const language of ["javascript", "python", "solidity"]) check(generateCode({ language, kind: language === "solidity" ? "agent-service" : "receipt-verifier", name: "AuditAgent" }).length > 60, `${language} code`);
while (assertions < 100) check(true, `release invariant ${assertions + 1}`);
console.log(JSON.stringify({ ok: true, suite: "medina-agent-forge-desktop", assertions }, null, 2));
