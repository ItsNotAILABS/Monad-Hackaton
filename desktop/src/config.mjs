import fs from "node:fs/promises";
import path from "node:path";

const KEYS = new Set(["builderApiOrigin", "thesisApiOrigin", "toolGatewayOrigin", "releaseChannel", "workspaceRoot"]);

export const defaultConfig = Object.freeze({
  builderApiOrigin: process.env.MONAD_BUILDER_API_ORIGIN || "",
  thesisApiOrigin: process.env.THESIS_API_ORIGIN || "",
  toolGatewayOrigin: process.env.THESIS_TOOL_GATEWAY_ORIGIN || "",
  releaseChannel: process.env.MEDINA_RELEASE_CHANNEL || "stable",
  workspaceRoot: process.env.MEDINA_WORKSPACE_ROOT || "",
});

function cleanOrigin(value, key) {
  const text = String(value || "").trim().replace(/\/+$/, "");
  if (!text) return "";
  const parsed = new URL(text);
  if (!new Set(["http:", "https:"]).has(parsed.protocol)) throw new Error(`${key} must use http or https.`);
  parsed.username = "";
  parsed.password = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/+$/, "");
}

export function validateConfig(input = {}) {
  const merged = { ...defaultConfig };
  for (const [key, value] of Object.entries(input || {})) if (KEYS.has(key)) merged[key] = value;
  merged.builderApiOrigin = cleanOrigin(merged.builderApiOrigin, "builderApiOrigin");
  merged.thesisApiOrigin = cleanOrigin(merged.thesisApiOrigin, "thesisApiOrigin");
  merged.toolGatewayOrigin = cleanOrigin(merged.toolGatewayOrigin, "toolGatewayOrigin");
  merged.releaseChannel = String(merged.releaseChannel || "stable").trim().slice(0, 40);
  merged.workspaceRoot = String(merged.workspaceRoot || "").trim();
  return merged;
}

export async function readConfig(filePath) {
  try { return validateConfig(JSON.parse(await fs.readFile(filePath, "utf8"))); }
  catch (error) { if (error?.code === "ENOENT") return validateConfig(); throw error; }
}

export async function writeConfig(filePath, config) {
  const validated = validateConfig(config);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  return validated;
}
