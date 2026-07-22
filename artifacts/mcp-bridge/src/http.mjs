import http from "node:http";

function json(response, statusCode, body) {
  const payload = JSON.stringify(body, null, 2);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(payload);
}

async function readJson(request, maxBytes = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error("Request body is too large."), { statusCode: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw Object.assign(new Error("Request body must be valid JSON."), { statusCode: 400 }); }
}

export function createHttpServer(spine) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    try {
      if (request.method === "GET" && url.pathname === "/health") return json(response, 200, spine.health());
      if (request.method === "GET" && url.pathname === "/v1/tools") return json(response, 200, { tools: spine.listTools() });
      if (request.method === "GET" && url.pathname === "/v1/receipts") return json(response, 200, { receipts: spine.listReceipts(url.searchParams.get("limit")) });
      if (request.method === "GET" && url.pathname === "/v1/approvals") return json(response, 200, { approvals: spine.listPending() });
      if (request.method === "POST" && url.pathname === "/v1/call") return json(response, 200, await spine.call(await readJson(request)));
      if (request.method === "POST" && url.pathname.startsWith("/v1/approvals/")) {
        const approvalId = decodeURIComponent(url.pathname.slice("/v1/approvals/".length));
        const body = await readJson(request);
        if (!["approve", "deny"].includes(body.decision)) throw Object.assign(new Error("decision must be approve or deny."), { statusCode: 400 });
        return json(response, 200, await spine.resolveApproval(approvalId, body.decision, body.actor));
      }
      return json(response, 404, { ok: false, error: "not-found" });
    } catch (error) {
      return json(response, error.statusCode || 500, {
        ok: false,
        error: String(error.message || error),
        receipt: error.receipt || undefined,
      });
    }
  });
}
