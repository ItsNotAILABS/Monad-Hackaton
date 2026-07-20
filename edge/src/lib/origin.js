/** Cloudflare upstream, CORS, and response helpers. */

const DEFAULT_ALLOWED_METHODS = "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS";

function cleanBase(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function allowedOrigins(env) {
  return new Set(
    [env.PUBLIC_APP_URL, ...(String(env.CORS_ORIGINS || "").split(","))]
      .map(cleanBase)
      .filter(Boolean),
  );
}

export function corsHeaders(request, env) {
  const requestOrigin = request.headers.get("Origin") || "";
  const allow = allowedOrigins(env);
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin);
  const permitted = !requestOrigin || allow.has(cleanBase(requestOrigin)) || local;
  return {
    "access-control-allow-origin": permitted && requestOrigin ? requestOrigin : (env.PUBLIC_APP_URL || "null"),
    "access-control-allow-methods": DEFAULT_ALLOWED_METHODS,
   