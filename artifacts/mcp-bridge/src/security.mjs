import crypto from "node:crypto";

const UNSAFE_TEXT = /(?:rm\s+-rf|format\s+[a-z]:|diskpart|shutdown\s|reboot\s|del\s+\/s|powershell.*-enc|curl[^\n]*\|\s*(?:sh|bash)|wget[^\n]*\|\s*(?:sh|bash))/i;

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

export function commitment(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

export function evaluatePolicy(tool, request) {
  const serialized = JSON.stringify(request.arguments || {});
  if (UNSAFE_TEXT.test(serialized)) {
    return { decision: "deny", reason: "unsafe-command-pattern", requiresApproval: false };
  }
  if (tool.risk === "read") return { decision: "allow", reason: "read-capability", requiresApproval: false };
  if (tool.risk === "propose") return { decision: "allow", reason: "proposal-only-capability", requiresApproval: false };
  if (!request.approvalToken) {
    return { decision: "pending", reason: "owner-approval-required", requiresApproval: true };
  }
  return { decision: "allow", reason: "owner-approval-present", requiresApproval: true };
}

export function makeReceipt({ previousHash = "", request, tool, policy, outcome }) {
  const body = {
    schema: "medina.mcp-spine.receipt.v1",
    receiptId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    previousHash,
    requestId: request.requestId,
    actor: request.actor,
    tool: tool.name,
    risk: tool.risk,
    policy,
    inputHash: commitment(request.arguments),
    outcome,
  };
  return Object.freeze({ ...body, receiptHash: commitment(body) });
}
