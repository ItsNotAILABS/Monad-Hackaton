/** Edge signals agent — alpha board + optional auto paper (origin). */
import { originFetch } from "../lib/origin.js";

export async function runSignals(env, body = {}, colo) {
  const action = (body.action || "board").toLowerCase();
  const network = body.network || "monad-testnet";

  if (action === "auto" || action === "loop") {
    const r = await originFetch(env, "/auto/loop", {
      method: "POST",
      body: { network, include_arena: true, include_signals: true, include_strategy: true },
      colo,
    });
    return {
      agent: "signals",
      action: "auto",
      origin: r,
      summary: r.data?.headline || "auto loop",
      chain_broadcast: false,
    };
  }

  const r = await originFetch(env, `/signals?network=${encodeURIComponent(network)}`, { colo });
  return {
    agent: "signals",
    action: "board",
    origin: r,
    leaderboard: r.data?.leaderboard || [],
    n: r.data?.n,
    summary: `signals n=${r.data?.n}`,
  };
}
