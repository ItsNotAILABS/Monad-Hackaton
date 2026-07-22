import { McpSpine } from "./bridge.mjs";
import { createHttpServer } from "./http.mjs";

const host = process.env.MCP_SPINE_HOST || "127.0.0.1";
const port = Number(process.env.MCP_SPINE_PORT || 8080);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error("MCP_SPINE_PORT must be a valid TCP port.");

const spine = new McpSpine();
const server = createHttpServer(spine);

server.listen(port, host, () => {
  process.stdout.write(`${JSON.stringify({ ok: true, service: "MCP Spine", host, port, endpoint: `http://${host}:${port}` })}\n`);
});

function shutdown(signal) {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
  process.stderr.write(`MCP Spine received ${signal}; shutting down.\n`);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
