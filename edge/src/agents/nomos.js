/** Edge NOMOS agent — dual-stack arena / evaluate via origin. */
import { originFetch } from "../lib/origin.js";

export async function runNomos(env, body = {}, colo) {
  const action = (body.action || "run").toLowerCase();

  if (action === "arena" || action === "desk") {
    const r = await originFetch(env, "/desk/arena", { method: "POST", body: {}, colo });
    return {
      agent: "nomos",
      action: "desk_arena",
      origin: r,
      n_rejected: r.data?.n_rejected,
      n_accepted: r.data?.n_accepted,
      summary: `reject=${r.data?.n_rejected} accept=${r.data?.n_accepted}`,
      reject_is_a_feature: true,
    };
  }

  const r = await originFetch(env, "/nomos/run", {
    method: "POST",
    body: body.request || {
      name: "Edge NOMOS",
      objective: body.objective || "Coordinate under dual law stack",
      categories: body.categories || ["vault", "dex", "lending"],
      network: body.network || "monad-testnet",
    },
    colo,
  });
  return {
    agent: "nomos",
    action: "nomos_run",
    origin: r,
    n_rejected: r.data?.n_rejected,
    n_accepted: r.data?.n_accepted,
    winner: r.data?.winner?.action?.agent,
    summary: `nomos reject=${r.data?.n_rejected} winner=${r.data?.winner?.action?.agent}`,
    reject_is_a_feature: true,
  };
}
