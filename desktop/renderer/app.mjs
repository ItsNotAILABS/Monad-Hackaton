const api = window.medinaDesktop;
const root = document.querySelector("#app");
let state = await api.getState();
let tab = "overview";
let output = "Ready.";
let generated = "";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[character]));

function workflowView() {
  return state.workflows.workflows.map((workflow) => `<section class="card"><span class="eyebrow">${escapeHtml(workflow.id)}</span><h2>${escapeHtml(workflow.title)}</h2>${workflow.steps.map((step, index) => `<div class="step"><b>${index + 1}</b><span>${escapeHtml(step)}</span></div>`).join("")}</section>`).join("");
}

function toolsView() {
  return `<section class="card"><span class="eyebrow">GOVERNED TOOL CATALOG</span><h2>Explicit desktop and THESIS adapters</h2><div class="tool-grid">${state.tools.map((tool) => `<button class="tool" data-tool="${escapeHtml(tool.id)}" ${tool.enabled ? "" : "disabled"}><b>${escapeHtml(tool.name)}</b><small>${escapeHtml(tool.description || tool.id)}</small></button>`).join("")}</div></section><pre class="output">${escapeHtml(output)}</pre>`;
}

function codeView() {
  return `<section class="card"><span class="eyebrow">BOUNDED CODE GENERATION</span><h2>Generate source without executing it</h2><div class="row"><select id="language"><option value="javascript">JavaScript</option><option value="python">Python</option><option value="solidity">Solidity</option></select><select id="kind"><option value="receipt-verifier">Receipt verifier</option><option value="agent-service">Agent service proof</option></select><input id="name" value="AgentClient" aria-label="Artifact name"><button class="primary" id="generate">Generate</button><button id="save" ${generated ? "" : "disabled"}>Save</button></div></section><pre class="output">${escapeHtml(generated || output)}</pre>`;
}

function settingsView() {
  const config = state.config;
  return `<section class="card"><span class="eyebrow">OPERATOR PROFILE</span><h2>Public runtime configuration only</h2><label>Builder URL<input id="builderAppUrl" value="${escapeHtml(config.builderAppUrl)}"></label><label>THESIS API origin<input id="thesisApiOrigin" value="${escapeHtml(config.thesisApiOrigin)}"></label><label>Release channel<input id="releaseChannel" value="${escapeHtml(config.releaseChannel)}"></label><label><input type="checkbox" id="runtimeTool" ${(config.enabledBackendTools || []).includes("thesis.runtime.status") ? "checked" : ""}> Enable THESIS runtime status</label><label><input type="checkbox" id="receiptTool" ${(config.enabledBackendTools || []).includes("thesis.receipts.recent") ? "checked" : ""}> Enable recent receipt reader</label><button class="primary" id="saveConfig">Save profile</button></section><pre class="output">${escapeHtml(output)}</pre>`;
}

function overviewView() {
  return `<section class="hero"><span class="eyebrow">MEDINA AGENT FORGE v${escapeHtml(state.version)}</span><h1>Publish governed, versioned, receipt-bearing agents.</h1><p>Operate Agent Mint workflows, inspect MESIE readiness, generate bounded artifacts, and enter the browser wallet surface without moving signing keys into the desktop.</p><div class="row"><button class="primary" id="openBuilder">Open Builder</button><button data-tab="workflows">Inspect workflows</button></div></section><section class="metrics"><article><b>${state.workflows.workflows.length}</b><span>Canonical workflows</span></article><article><b>${state.tools.filter((tool) => tool.enabled).length}</b><span>Enabled tools</span></article><article><b>0</b><span>Stored private keys</span></article></section><pre class="output">${escapeHtml(output)}</pre>`;
}

function content() {
  if (tab === "workflows") return workflowView();
  if (tab === "tools") return toolsView();
  if (tab === "code") return codeView();
  if (tab === "settings") return settingsView();
  return overviewView();
}

function render() {
  root.innerHTML = `<div class="shell"><aside><div><span class="mark">M</span><h2>Agent Forge</h2></div><nav><button data-tab="overview">Overview</button><button data-tab="workflows">Workflows</button><button data-tab="tools">Tools</button><button data-tab="code">Code Forge</button><button data-tab="settings">Settings</button></nav><footer>THESIS · MESIE · Monad</footer></aside><main class="main">${content()}</main></div>`;
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { tab = button.dataset.tab; render(); }));
  document.querySelector("#openBuilder")?.addEventListener("click", async () => { try { output = JSON.stringify(await api.openBuilder(), null, 2); } catch (error) { output = error.message; } render(); });
  document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", async () => {
    const samples = {
      "mesie.score": { latencyMs: 180, coherence: 0.92, proofCoverage: 0.9, reliability: 0.99, conflictRate: 0.03 },
      "manifest.validate": { schema: "thesis.agent-card.v1", version: 1, profile: {}, capabilities: ["audit"], doctrine: {}, runtime: {} },
      "receipt.verify": { receipt: {}, expectedHash: "" },
      "monad.parallelism.review": { source: "contract AgentService {}" },
    };
    try { output = JSON.stringify(await api.runTool(button.dataset.tool, samples[button.dataset.tool] || {}), null, 2); } catch (error) { output = error.message; }
    render();
  }));
  document.querySelector("#generate")?.addEventListener("click", async () => {
    const result = await api.generateCode({ language: document.querySelector("#language").value, kind: document.querySelector("#kind").value, name: document.querySelector("#name").value });
    generated = result.code;
    render();
  });
  document.querySelector("#save")?.addEventListener("click", async () => { output = JSON.stringify(await api.saveText({ suggestedName: "agent-artifact.txt", content: generated }), null, 2); render(); });
  document.querySelector("#saveConfig")?.addEventListener("click", async () => {
    const enabledBackendTools = [];
    if (document.querySelector("#runtimeTool").checked) enabledBackendTools.push("thesis.runtime.status");
    if (document.querySelector("#receiptTool").checked) enabledBackendTools.push("thesis.receipts.recent");
    const result = await api.updateConfig({ ...state.config, builderAppUrl: document.querySelector("#builderAppUrl").value, thesisApiOrigin: document.querySelector("#thesisApiOrigin").value, releaseChannel: document.querySelector("#releaseChannel").value, enabledBackendTools });
    state = { ...state, ...result };
    output = "Configuration saved.";
    render();
  });
}

render();
