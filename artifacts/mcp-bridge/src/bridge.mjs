import crypto from "node:crypto";
import { normalizeTool, validateRequest } from "./schema.mjs";
import { evaluatePolicy, makeReceipt } from "./security.mjs";
import { scientificLabTools } from "./adapters/scientific-lab.mjs";

export class McpSpine {
  constructor({ tools = scientificLabTools } = {}) {
    this.startedAt = new Date().toISOString();
    this.tools = new Map();
    this.receipts = [];
    this.pending = new Map();
    for (const definition of tools) this.register(definition);
  }

  register(definition) {
    const tool = normalizeTool(definition);
    if (typeof definition.handler !== "function") throw new Error(`Tool ${tool.name} requires a handler.`);
    if (this.tools.has(tool.name)) throw new Error(`Duplicate tool: ${tool.name}`);
    this.tools.set(tool.name, { ...tool, handler: definition.handler });
    return tool;
  }

  health() {
    return {
      ok: true,
      schema: "medina.mcp-spine.v1",
      service: "MCP Spine",
      mode: "local-first-governed",
      startedAt: this.startedAt,
      tools: this.tools.size,
      pendingApprovals: this.pending.size,
      receipts: this.receipts.length,
    };
  }

  listTools() {
    return Array.from(this.tools.values()).map(({ handler: _handler, ...tool }) => tool);
  }

  listReceipts(limit = 50) {
    const bounded = Math.max(1, Math.min(250, Number(limit) || 50));
    return this.receipts.slice(-bounded).reverse();
  }

  listPending() {
    return Array.from(this.pending.values());
  }

  async call(rawRequest) {
    const request = validateRequest(rawRequest);
    const tool = this.tools.get(request.tool);
    if (!tool) throw Object.assign(new Error(`Unknown tool: ${request.tool}`), { statusCode: 404 });
    const policy = evaluatePolicy(tool, request);
    if (policy.decision === "pending") {
      const approvalId = crypto.randomUUID();
      const pending = { approvalId, createdAt: new Date().toISOString(), request, tool: tool.name, risk: tool.risk };
      this.pending.set(approvalId, pending);
      const receipt = this.record(request, tool, policy, { ok: false, state: "pending", approvalId });
      return { ok: false, state: "pending", approvalId, receipt };
    }
    if (policy.decision === "deny") {
      const receipt = this.record(request, tool, policy, { ok: false, state: "denied", reason: policy.reason });
      return { ok: false, state: "denied", reason: policy.reason, receipt };
    }
    try {
      const result = await tool.handler(request.arguments, { request, spine: this });
      const receipt = this.record(request, tool, policy, { ok: true, state: "completed", resultHashable: result });
      return { ok: true, state: "completed", result, receipt };
    } catch (error) {
      const receipt = this.record(request, tool, policy, { ok: false, state: "failed", error: String(error?.message || error) });
      throw Object.assign(new Error(error?.message || "Tool failed."), { statusCode: 500, receipt });
    }
  }

  async resolveApproval(approvalId, decision, actor = "owner") {
    const pending = this.pending.get(String(approvalId));
    if (!pending) throw Object.assign(new Error("Approval request not found."), { statusCode: 404 });
    this.pending.delete(pending.approvalId);
    const approved = decision === "approve";
    if (!approved) {
      const tool = this.tools.get(pending.tool);
      const policy = { decision: "deny", reason: "owner-denied", requiresApproval: true, decidedBy: actor };
      const receipt = this.record(pending.request, tool, policy, { ok: false, state: "denied" });
      return { ok: true, state: "denied", receipt };
    }
    return this.call({ ...pending.request, actor, approvalToken: pending.approvalId });
  }

  record(request, tool, policy, outcome) {
    const previousHash = this.receipts.at(-1)?.receiptHash || "";
    const receipt = makeReceipt({ previousHash, request, tool, policy, outcome });
    this.receipts.push(receipt);
    if (this.receipts.length > 5000) this.receipts.splice(0, this.receipts.length - 5000);
    return receipt;
  }
}
