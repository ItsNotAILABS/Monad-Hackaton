/**
 * MonadBuilder HQ — Cloudflare Workers edge router
 *
 * Many small AI agents on the global edge (~300+ cities):
 *   /agent/seatbelt  — brief / morning / reject
 *   /agent/signals   — alpha board / auto loop
 *   /agent/nomos     — dual-stack arena
 *   /agent/x         — X marketing drafts
 *   /agent/horizon   — long-horizon delta step
 *   /v1/run          — unified { agent, action, ... }
 *   /health          — edge meta + origin ping
 *
 * Each Worker invocation runs near the user, then calls central ORIGIN_API
 * (FastAPI dashboard) for law, desk, vault, receipts.
 */

import { corsHeaders, edgeMeta, json, originFetch } from "./lib/origin.js";
import { runSeatbelt } from "./agents/seatbelt.js";
import { runSignals } from "./agents/signals.js";
import { runNomos } from "./agents/nomos.js";
import { runXpost } from "./agents/xpost.js";
import { runHorizon } from "./agents/horizon.js";

const AGENTS = {
  seatbelt: runSeatbelt,
  signals: runSignals,
  nomos: runNomos,
  x: runXpost,
  xpost: runXpost,
  horizon: runHorizon,
  agent: runHorizon,
};

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const meta = edgeMeta(request, env);
    const colo = meta.edge.colo;

    try {
      if (path === "/" || path === "/health") {
        let originOk = null;
        try {
          const ping = await originFetch(env, "/health", { colo });
          originOk = ping.ok;
        } catch {
          originOk = false;
        }
        return json(
          {
            schema: "monadbuilder.edge.health.v1",
            ok: true,
            ...meta,
            agents: Object.keys(AGENTS),
            origin_reachable: originOk,
            routes: [
              "GET /health",
              "GET /agents",
              "POST /v1/run",
              "POST /agent/seatbelt",
              "POST /agent/signals",
              "POST /agent/nomos",
              "POST /agent/x",
              "POST /agent/horizon",
            ],
          },
          200,
          cors
        );
      }

      if (path === "/agents") {
        return json(
          {
            schema: "monadbuilder.edge.agents.v1",
            ...meta,
            agents: [
              { id: "seatbelt", path: "/agent/seatbelt", actions: ["brief", "morning", "reject"] },
              { id: "signals", path: "/agent/signals", actions: ["board", "auto"] },
              { id: "nomos", path: "/agent/nomos", actions: ["run", "arena"] },
              { id: "x", path: "/agent/x", actions: ["draft"] },
              { id: "horizon", path: "/agent/horizon", actions: ["step"] },
            ],
            architecture: {
              edge: "Cloudflare Workers — serverless, multi-colo",
              origin: "MonadBuilder FastAPI — laws, desk, vault, receipts",
              browser: "Web Workers + STT (HQ UI)",
              chain: "PolicyKernel · LawBook · SovereignVault",
            },
          },
          200,
          cors
        );
      }

      // Unified run
      if (path === "/v1/run" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const agentId = (body.agent || "seatbelt").toLowerCase();
        const fn = AGENTS[agentId];
        if (!fn) {
          return json({ ok: false, error: `unknown agent ${agentId}`, agents: Object.keys(AGENTS) }, 400, cors);
        }
        const result = await fn(env, body, colo);
        return json(
          {
            schema: "monadbuilder.edge.run.v1",
            ok: true,
            ...meta,
            result,
          },
          200,
          cors
        );
      }

      // Named agents
      const m = path.match(/^\/agent\/([a-z]+)$/i);
      if (m && request.method === "POST") {
        const agentId = m[1].toLowerCase();
        const fn = AGENTS[agentId];
        if (!fn) {
          return json({ ok: false, error: `unknown agent ${agentId}` }, 404, cors);
        }
        const body = await request.json().catch(() => ({}));
        const result = await fn(env, body, colo);
        return json({ schema: "monadbuilder.edge.run.v1", ok: true, ...meta, result }, 200, cors);
      }

      // GET proxy helpers for demos
      if (path === "/proxy/brief" && request.method === "GET") {
        const result = await runSeatbelt(env, { action: "brief" }, colo);
        return json({ ok: true, ...meta, result }, 200, cors);
      }

      return json({ ok: false, error: "not found", path, ...meta }, 404, cors);
    } catch (e) {
      return json(
        {
          ok: false,
          error: String(e.message || e),
          ...meta,
        },
        500,
        cors
      );
    }
  },
};
