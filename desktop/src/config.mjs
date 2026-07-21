import fs from "node:fs/promises";
import path from "node:path";

const KEYS = new Set(["builderAppUrl", "builderApiOrigin", "thesisApiOrigin", "releaseChannel", "workspaceRoot", "enabledBackendTools"]);
const BACKEND_TOOLS = new Set(["thesis.runtime.status", "thesis.receipts.recent"]);

export const defaultConfig = Object.freeze({
  builderAppUrl: process.env.MONAD_BUILDER_APP_URL || "",
  builderApiOrigin: process.env.MONAD_BUILDER_API_ORIGIN || "",
  thesisApiOrigin: process.env.THESIS_API_ORIGIN || "",
  releaseChannel: process.env.MEDINA_RELEASE_CHANNEL || "stable",
  workspaceRoot: process.env.MEDINA_WORKSPACE_ROOT || "",
  enabledBackendTools: [],
});

function cleanOrigin(value, key) {
  const text = String(value || "").trim().replace(/\/+$/, "");
  if (!text) return "";
  const parsed = new URL(text);
  const loopback = new Set(["localhost", "127.0.0.1", "::1"]).has(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopback)) throw new Error(`${key} must use HTTPS or loopback HTTP.`);
  parsed.username = "";
  parsed.password = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/+$/, "");
}

export function validateConfig(input = {}) {
  const merged = { ...defaultConfig };
  for (const [key, value] of Object.entries(input || {})) if (KEYS.has(key)) merged[key] = value;
  merged.builderAppUrl = cleanOrigin(merged.builderAppUrl, "builderAppUrl");
  merged.builderApiOrigin = cleanOrigin(merged.builderApiOrigin, "builderApiOrigin");
  merged.thesisApiOrigin = cleanOrigin(merged.thesisApiOrigin, "thesisApiOrigin");
  merged.releaseChannel = String(merged.releaseChannel || "stable").trim().slice(0, 40);
  merged.workspaceRoot = String(merged.workspaceRoot || "").trim();
  merged.enabledBackendTools = Array.from(new Set((Array.isArray(merged.enabledBackendTools) ? merged.enabledBackendTools : [])
    .map(String).map((value) => value.trim()).filter((value) => BACKEND_TOOLS.has(value))));
  return merged;
}

export async function readConfig(filePath) {
  try { return validateConfig(JSON.parse(await fs.readFile(filePath, "utf8"))); }
  catch (error) { if (error?.code === "ENOENT") return validateConfig(); throw error; }
}

export async function writeConfig(filePath, config) {
  const validated = validateConfig(config);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(validated, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  return validated;
}
