/** Edge seatbelt agent — morning / brief / reject (proxies origin). */
import { originFetch } from "../lib/origin.js";
import { edgeLlm } from "../lib/llm.js";

export async function runSeatbelt(env, body = {}, colo) {
  const action = (body.action || body.cmd || "brief").toLowerCase();
  const network = body.network || "monad-testnet";

  if (action === "morning") {
    const r = await originFetch(env, "/builder/morning", {
      method: "POST",
      body: { network, auto_reject: true, auto_signals: true },
      colo,
    });
    return {
      agent: "seatbelt",
      action: "morning",
      origin: r,
      summary: r.data?.headline || r.data?.celebration || "morning ran",
    };
  }

  if (action === "reject") {
    const r = await originFetch(env, "/tools/reject_demo/run", {
      method: "POST",
      body: {},
      colo,
    });
    return {
      agent: "seatbelt",
      action: "reject",
      origin: r,
      summary: r.data?.result?.proof || r.data?.proof || "reject demo",
    };
  }

  // default: text brief
  const r = await originFetch(env, `/builder/brief?network=${encodeURIComponent(network)}`, { colo });
  let enrich = null;
  if (body.enrich_llm) {
    enrich = await edgeLlm(env, {
      system: "Rewrite this DeFi seatbelt brief in 2 short sentences. Text only. No hype.",
      user: r.data?.brief_text || JSON.stringify(r.data?.stats || {}),
    });
  }

  return {
    agent: "seatbelt",
    action: "brief",
    origin: r,
    brief_text: r.data?.brief_text || r.data?.ai_voice,
    format: "text",
    tts: false,
    llm_enrich: enrich,
    summary: r.data?.brief_text || "brief",
  };
}
