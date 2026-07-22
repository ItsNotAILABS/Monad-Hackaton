const api = window.thesisDesktop;
const root = document.querySelector("#app");
let state = await api.getState();
let tab = "overview";
let output = "Ready.";
let generated = "";
let approvals = [];

const escapeHtml = (value) => String(value ?? "").replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[character]));

function workflowView() {
  return state.workflows.workflows.map((workflow) => `<section class="card"><span class="eyebrow">${escapeHtml(workflow.id)}</span><h2>${escapeHtml(workflow.title)}</h2>${workflow.steps.map((step, index) => `<div class="step"><b>${index + 1}</b><span>${escapeHtml(step)}</span></div>`).join("")}</section>`).join("");
}

function toolsView() {
  return `<section class="card"><span class="eyebrow">GOVERNED TOOL CATALOG</span><h2>Explicit desktop and THESIS adapters</h2><div class="tool-grid">${state.tools.map((tool) => `<button class="tool" data-tool="${escapeHtml(tool.id)}" ${tool.enabled ? "" : "disabled"}><b>${escapeHtml(tool.name)}</b><small>${escapeHtml(tool.description || tool.id)}</small></button>`).join("")}</div></section><pre class="output">${escapeHtml(output)}</pre>`;
}

function spineView() {
  const spine = state.spine || {};
  const approvalRows = approvals.length ? approvals.map((item) => `<div class="approval"><div><b>${escapeHtml(item.tool)}</b><small>${escapeHtml(item.request?.actor || "unknown actor")} · ${escapeHtml(item.risk)}</small></div><div class="row"><button data-approval="${escapeHtml(item.approvalId)}" data-decision="deny">Deny</button><button class="primary" data-approval="${escapeHtml(item.approvalId)}" data-decision="approve">Approve</button></div></div>`).join("") : `<p class="muted">No pending sensitive actions.</p>`;
  return `<section class="card"><span class="eyebrow">MCP SPINE</span><h2>${spine.connected ? "Connected" : "Disconnected"}</h2><p>${escapeHtml(spine.origin || state.config.mcpSpineOrigin)}</p><div class="row"><button class="primary" id="startSpine">Start local Spine</button><button id="stopSpine">Stop managed Spine</button><button id="refreshSpine">Refresh</button></div></section><section class="card"><span class="eyebrow">OWNER CONFIRMATION QUEUE</span><h2>Sensitive actions wait here</h2>${approvalRows}</section><pre class="output">${escapeHtml(output)}</pre>`;
}

function codeView() {
  return `<section class="card"><span class="eyebrow">BOUNDED CODE GENERATION</span><h2>Generate source without executing it</h2><div class="row"><select id="language"><option value="javascript">JavaScript</option><option value="python">Python</option><option value="solidity">Solidity</option></select><select id="kind"><option value="receipt-verifier">Receipt verifier</option><option value="agent-service">Agent service proof</option></select><input id="name" value="AgentClient" aria-label="Artifact name"><button class="primary" id="generate">Generate</button><button id="save" ${generated ? "" : "disabled"}>Save</button></div></section><pre class="output">${escapeHtml(generated || output)}</pre>`;
}

function settingsView() {
  const config = state.config;
  return `<section class="card"><span class="eyebrow">OPERATOR PROFILE</span><h2>Public runtime configuration only</h2><label>MonadBuilder+ URL<input id="builderAppUrl" value="${escapeHtml(config.builderAppUrl)}"></label><label>THESIS API origin<input id="thesisApiOrigin" value="${escapeHtml(config.thesisApiOrigin)}"></label><label>MCP Spine origin<input id="mcpSpineOrigin" value="${escapeHtml(config.mcpSpineOrigin)}"></label><label><input type="checkbox" id="mcpAutostart" ${config.mcpAutostart ? "checked" : ""}> Start local MCP Spine with desktop</label><label>Release channel<input id="releaseChannel" value="${escapeHtml(config.releaseChannel)}"></label><label><input type="checkbox" id="runtimeTool" ${(config.enabledBackendTools || []).includes("thesis.runtime.status") ? "checked" : ""}> Enable THESIS runtime status</label><label><input type="checkbox" id="receiptTool" ${(config.enabledBackendTools || []).includes("thesis.receipts.recent") ? "checked" : ""}> Enable recent receipt reader</label><button class="primary" id="saveConfig">Save profile</button></section><pre class="output">${escapeHtml(output)}</pre>`;
}

function overviewView() {
  return `<section class="hero"><span class="eyebrow">THESIS AGENT DESKTOP v${escapeHtml(state.version)}</span><h1>Sovereign execution, approvals, tools, and receipts.</h1><p>Control the local MCP Spine, inspect governed capabilities, approve sensitive actions, run bounded research tools, and open MonadBuilder+ without moving wallet keys into the desktop.</p><div class="row"><button class="primary" id="openBuilder">Open MonadBuilder+</button><button data-tab="spine">Control MCP Spine</button></div></section><section class="metrics"><article><b>${state.spine?.connected ? "ON" : "OFF"}</b><span>MCP Spine</span></article><article><b>${state.tools.filter((tool) => tool.enabled).length}</b><span>Enabled tools</span></article><article><b>0</b><span>Stored private keys</span></article></section><pre class="output">${escapeHtml(output)}</pre>`;
}

function content() {
  if (tab === "workflows") return workflowView();
  if (tab === "tools") return toolsView();
  if (tab === "spine") return spineView();
  if (tab === "code") return codeView();
  if (tab === "settings") return settingsView();
  return overviewView();
}

async function refreshSpine() {
  state.spine = await api.spineStatus();
  if (state.spine.connected) approvals = (await api.listApprovals()).approvals || [];
  else approvals = [];
}

function render() {
  root.innerHTML = `<div class="shell"><aside><div><span class="mark">T</span><h2>THESIS Desktop</h2></div><nav><button data-tab="overview">Overview</button><button data-tab="spine">MCP Spine</button><button data-tab="workflows">Workflows</button><button data-tab="tools">Tools</button><button data-tab="code">Code Forge</button><button data-tab="settings">Settings</button></nav><footer>THESIS · NOVA · MESIE · NEXUS</footer></aside><main class="main">${content()}</main></div>`;
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", async () => { tab = button.dataset.tab; if (tab === "spine") await refreshSpine(); render(); }));
  document.querySelector("#openBuilder")?.addEventListener("click", async () => { try { output = JSON.stringify(await api.openBuilder(), null, 2); } catch (error) { output = error.message; } render(); });
  document.querySelector("#startSpine")?.addEventListener("click", async () => { try { output = JSON.stringify(await api.startSpine(), null, 2); await refreshSpine(); } catch (error) { output = error.message; } render(); });
  document.querySelector("#stopSpine")?.addEventListener("click", async () => { try { output = JSON.stringify(await api.stopSpine(), null, 2); await refreshSpine(); } catch (error) { output = error.message; } render(); });
  document.querySelector("#refreshSpine")?.addEventListener("click", async () => { try { await refreshSpine(); output = "MCP Spine status refreshed."; } catch (error) { output = error.message; } render(); });
  document.querySelectorAll("[data-approval]").forEach((button) => button.addEventListener("click", async () => { try { output = JSON.stringify(await api.resolveApproval(button.dataset.approval, button.dataset.decision), null, 2); await refreshSpine(); } catch (error) { output = error.message; } render(); }));
  document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", async () => {
    const samples = { "mesie.score": { latencyMs: 180, coherence: 0.92, proofCoverage: 0.9, reliability: 0.99, conflictRate: 0.03 }, "manifest.validate": { schema: "thesis.agent-card.v1", version: 1, profile: {}, capabilities: ["audit"], doctrine: {}, runtime: {} }, "receipt.verify": { receipt: {}, expectedHash: "" }, "monad.parallelism.review": { source: "contract AgentService {}" } };
    try { output = JSON.stringify(await api.runTool(button.dataset.tool, samples[button.dataset.tool] || {}), null, 2); } catch (error) { output = error.message; }
    render();
  }));
  document.querySelector("#generate")?.addEventListener("click", async () => { const result = await api.generateCode({ language: document.querySelector("#language").value, kind: document.querySelector("#kind").value, name: document.querySelector("#name").value }); generated = result.code; render(); });
  document.querySelector("#save")?.addEventListener("click", async () => { output = JSON.stringify(await api.saveText({ suggestedName: "agent-artifact.txt", content: generated }), null, 2); render(); });
  document.querySelector("#saveConfig")?.addEventListener("click", async () => {
    const enabledBackendTools = [];
    if (document.querySelector("#runtimeTool").checked) enabledBackendTools.push("thesis.runtime.status");
    if (document.querySelector("#receiptTool").checked) enabledBackendTools.push("thesis.receipts.recent");
    const result = await api.updateConfig({ ...state.config, builderAppUrl: document.querySelector("#builderAppUrl").value, thesisApiOrigin: document.querySelector("#thesisApiOrigin").value, mcpSpineOrigin: document.querySelector("#mcpSpineOrigin").value, mcpAutostart: document.querySelector("#mcpAutostart").checked, releaseChannel: document.querySelector("#releaseChannel").value, enabledBackendTools });
    state = { ...state, ...result }; output = "Configuration saved."; render();
  });
}

render();
