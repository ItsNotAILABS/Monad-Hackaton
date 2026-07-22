import { spawn } from "node:child_process";
import path from "node:path";

let child = null;
let lastLog = "";

function origin(config) {
  return String(config.mcpSpineOrigin || "http://127.0.0.1:8080").replace(/\/+$/, "");
}

export async function spineStatus(config) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${origin(config)}/health`, { headers: { accept: "application/json" }, signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `${response.status} ${response.statusText}`);
    return { connected: true, managed: Boolean(child), pid: child?.pid || null, origin: origin(config), health: body, lastLog };
  } catch (error) {
    return { connected: false, managed: Boolean(child), pid: child?.pid || null, origin: origin(config), error: String(error.message || error), lastLog };
  } finally {
    clearTimeout(timer);
  }
}

export async function startSpine(config, baseRoot, packaged = false) {
  const status = await spineStatus(config);
  if (status.connected) return { ...status, started: false, reason: "already-running" };
  if (child) return { ...status, started: false, reason: "process-starting" };
  const endpoint = new URL(origin(config));
  if (!["127.0.0.1", "localhost", "::1"].includes(endpoint.hostname)) throw new Error("Desktop-managed MCP Spine must bind to a loopback address.");
  const entrypoint = packaged
    ? path.join(baseRoot, "mcp-bridge", "src", "index.mjs")
    : path.join(baseRoot, "artifacts", "mcp-bridge", "src", "index.mjs");
  child = spawn(process.execPath, [entrypoint], {
    cwd: packaged ? path.join(baseRoot, "mcp-bridge") : baseRoot,
    env: { ...process.env, MCP_SPINE_HOST: endpoint.hostname === "localhost" ? "127.0.0.1" : endpoint.hostname, MCP_SPINE_PORT: endpoint.port || "8080" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  child.stdout.on("data", (chunk) => { lastLog = String(chunk).trim().slice(-4000); });
  child.stderr.on("data", (chunk) => { lastLog = String(chunk).trim().slice(-4000); });
  child.once("exit", () => { child = null; });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const next = await spineStatus(config);
    if (next.connected) return { ...next, started: true };
  }
  throw new Error(`MCP Spine did not become healthy. ${lastLog}`.trim());
}

export async function stopSpine(config) {
  if (!child) return { ...(await spineStatus(config)), stopped: false, reason: "not-desktop-managed" };
  const processToStop = child;
  processToStop.kill("SIGTERM");
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 3000);
    processToStop.once("exit", () => { clearTimeout(timer); resolve(); });
  });
  if (child === processToStop) child = null;
  return { ...(await spineStatus(config)), stopped: true };
}

export async function listApprovals(config) {
  const response = await fetch(`${origin(config)}/v1/approvals`, { headers: { accept: "application/json" } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `${response.status} ${response.statusText}`);
  return body;
}

export async function resolveApproval(config, approvalId, decision) {
  const response = await fetch(`${origin(config)}/v1/approvals/${encodeURIComponent(approvalId)}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ decision, actor: "thesis-desktop-owner" }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `${response.status} ${response.statusText}`);
  return body;
}
