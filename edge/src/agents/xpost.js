/** Edge X marketing agent — draft from real actions (owner posts). */
import { originFetch } from "../lib/origin.js";
import { edgeLlm } from "../lib/llm.js";

export async function runXpost(env, body = {}, colo) {
  const r = await originFetch(env, "/x/from-actions", {
    method: "POST",
    colo,
  });
  let polished = null;
  if (body.enrich_llm && r.data?.text) {
    polished = await edgeLlm(env, {
      system: "Tighten this X post for Monad builders. Keep under 260 chars. Keep hashtags. Text only.",
      user: r.data.text,
    });
  }
  return {
    agent: "xpost",
    action: "draft",
    origin: r,
    text: polished?.text || r.data?.text,
    intent_url: r.data?.intent_url,
    draft_id: r.data?.id,
    summary: (polished?.text || r.data?.text || "").slice(0, 120),
    sovereign: "AI drafts — user publishes via intent_url",
  };
}
