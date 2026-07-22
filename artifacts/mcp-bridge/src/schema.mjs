export const MCP_SPINE_SCHEMA = "medina.mcp-spine.v1";
export const RECEIPT_SCHEMA = "medina.mcp-spine.receipt.v1";

export function normalizeTool(tool) {
  if (!tool || typeof tool !== "object") throw new Error("Tool definition must be an object.");
  const name = String(tool.name || "").trim();
  if (!/^[a-z0-9][a-z0-9._-]{2,127}$/i.test(name)) throw new Error(`Invalid tool name: ${name || "<empty>"}`);
  return Object.freeze({
    name,
    title: String(tool.title || name).trim().slice(0, 160),
    description: String(tool.description || "").trim().slice(0, 1000),
    risk: ["read", "propose", "sensitive"].includes(tool.risk) ? tool.risk : "read",
    inputSchema: tool.inputSchema && typeof tool.inputSchema === "object" ? tool.inputSchema : { type: "object", additionalProperties: true },
  });
}

export function validateRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Request body must be an object.");
  const tool = String(input.tool || "").trim();
  if (!tool) throw new Error("tool is required.");
  const requestId = String(input.requestId || crypto.randomUUID());
  const actor = String(input.actor || "local-operator").trim().slice(0, 160);
  const args = input.arguments && typeof input.arguments === "object" && !Array.isArray(input.arguments) ? input.arguments : {};
  return { requestId, tool, actor, arguments: args, approvalToken: input.approvalToken ? String(input.approvalToken) : "" };
}
