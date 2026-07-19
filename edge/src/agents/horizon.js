/** Edge long-horizon agent — delta AI step via origin. */
import { originFetch } from "../lib/origin.js";

export async function runHorizon(env, body = {}, colo) {
  const r = await originFetch(env, "/agent/step", {
    method: "POST",
    body: {
      goal: body.goal || body.message || "safe daily ops",
      network: body.network || "monad-testnet",
      note: body.note || "",
      stt: body.stt || "",
      execute: body.execute !== false,
    },
    colo,
  });
  return {
    agent: "horizon",
    action: "step",
    origin: r,
    intent: r.data?.intent,
    step: r.data?.step,
    efficiency: r.data?.efficiency,
    answer: r.data?.answer,
    summary: r.data?.answer?.slice(0, 160) || r.data?.intent,
    format: "text",
    tts: false,
  };
}
