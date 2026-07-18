/**
 * Central API client — every edge agent talks home to MonadBuilder HQ.
 * Origin holds dual-stack law, desk, vault, receipts (source of truth).
 */

export async function originFetch(env, path, opts = {}) {
  const base = (env.ORIGIN_API || "http://127.0.0.1:8043").replace(/\/$/, "");
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "content-type": "application/json",
    "x-monadbuilder-edge": "1",
    "x-edge-colo": opts.colo || "unknown",
    ...(opts.headers || {}),
  };
  const init = {
    method: opts.method || "GET",
    headers,
  };
  if (opts.body != null) {
    init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data, url };
}

export function corsHeaders(req) {
  const origin = req.headers.get("Origin") || "*";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization, x-monadbuilder-edge",
    "access-control-max-age": "86400",
  };
}

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data, null, 0), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extra,
    },
  });
}

export function edgeMeta(request, env) {
  const cf = request.cf || {};
  return {
    product: env.PRODUCT || "MonadBuilder HQ",
    doctrine: env.DOCTRINE || "Agents propose. Laws decide. Owner signs. Receipts remember.",
    edge: {
      runtime: "cloudflare-workers",
      colo: cf.colo || null,
      country: cf.country || null,
      city: cf.city || null,
      asOrganization: cf.asOrganization || null,
      httpProtocol: cf.httpProtocol || null,
      note: "Runs on Cloudflare edge (~300+ cities) — closest colo to the request",
    },
    origin_api: env.ORIGIN_API || null,
    tts: false,
    speech_to_text: "browser-native (HQ UI)",
  };
}
