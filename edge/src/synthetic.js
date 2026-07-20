/** Cloudflare Cron driver for continuous synthetic-user usage. */
export async function runSyntheticCanary(env, source = "cloudflare-cron") {
  const target = (env.SYNTHETIC_TARGET || env.PUBLIC_APP_URL || "https://monados.medinatechlabs.net").replace(/\/$/, "");
  const body = {
    app_url: target,
    engine_url: env.THESIS_URL || `${target}/engine`,
    edge_url: env.EDGE_PUBLIC_URL || "",
    ethereum_rpc_url: env.ETHEREUM_RPC_URL || "",
    cadence: env.SYNTHETIC_CADENCE || "smoke",
    personas: [],
    timeout: 15,
  };
  const response = await fetch(`${body.engine_url}/synthetic/run`, {
    method: "POST",
    headers: {"content-type":"application/json","x-synthetic-token":env.SYNTHETIC_RUN_TOKEN || "","x-synthetic-source":source},
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 1000) }; }
  if (!response.ok || data.ok === false) throw new Error(`synthetic canary failed (${response.status}): ${JSON.stringify(data).slice(0, 1500)}`);
  return data;
}
