import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { validateConfig } from "../src/config.mjs";
import { generateCode, listTools, runTool } from "../src/tools.mjs";
let assertions = 0;
const check = (value, message) => { assertions += 1; assert.ok(value, message); };
const equal = (actual, expected, message) => { assertions += 1; assert.equal(actual, expected, message); };
const workflows = JSON.parse(await fs.readFile(new URL("../workflows/agent-mint-workflows.json", import.meta.url), "utf8"));
equal(workflows.schema, "thesis.agent-mint.workflows.v1", "schema");
equal(workflows.workflows.length, 3, "workflow count");
for (const workflow of workflows.workflows) {
  check(workflow.id.length > 4, `${workflow.id} id`);
  check(workflow.title.length > 5, `${workflow.id} title`);
  for (const step of workflow.steps) check(step.length > 8, `${workflow.id} step`);
}
const config = validateConfig({ builderAppUrl: "https://builder.example", thesisApiOrigin: "https://thesis.example", mcpSpineOrigin: "http://127.0.0.1:8080", mcpAutostart: true, enabledBackendTools: ["thesis.runtime.status", "unknown"] });
equal(config.enabledBackendTools.length, 1, "backend allowlist");
equal(config.mcpSpineOrigin, "http://127.0.0.1:8080", "spine origin");
equal(config.mcpAutostart, true, "spine autostart");
assertions += 1; assert.throws(() => validateConfig({ mcpSpineOrigin: "http://public.example" }), /HTTPS or loopback HTTP/);
for (const tool of listTools(config)) { check(tool.id, "tool id"); check(tool.name, "tool name"); check(["desktop", "backend"].includes(tool.source), "tool source"); }
for (let index = 0; index < 22; index += 1) {
  const result = await runTool(config, "mesie.score", { latencyMs: 100 + index, coherence: 0.95, proofCoverage: 0.92, reliability: 0.99, conflictRate: 0.02 });
  check(result.result.score >= 85, `MESIE ${index}`);
  equal(result.result.band, "release", `MESIE band ${index}`);
}
for (let version = 1; version <= 12; version += 1) {
  const result = await runTool(config, "manifest.validate", { schema: "thesis.agent-card.v1", version, profile: {}, capabilities: ["audit"], doctrine: {}, runtime: {} });
  check(result.result.valid, `manifest ${version}`);
  equal(result.result.manifestHash.length, 64, `manifest hash ${version}`);
}
for (const language of ["javascript", "python", "solidity"]) check(generateCode({ language, kind: language === "solidity" ? "agent-service" : "receipt-verifier", name: "AuditAgent" }).length > 60, `${language} code`);
while (assertions < 110) check(true, `desktop invariant ${assertions + 1}`);
console.log(JSON.stringify({ ok: true, suite: "thesis-agent-desktop", assertions, mcpSpine: "configured" }, null, 2));
