/**
 * Shared API client for the hosted web app.
 * Dev (Vite :5173) uses /api proxy → backend :8043.
 * Production can set VITE_API_URL.
 */

export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof window !== "undefined" && window.location.port === "5173"
    ? "/api"
    : typeof window !== "undefined" && window.location.port === "8043"
      ? ""
      : "http://127.0.0.1:8043");

export async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data.detail || data.error || res.statusText || "request failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

/** Absolute URL for engine doc downloads etc. */
export function apiUrl(path) {
  if (!path) return API_BASE || "/";
  if (path.startsWith("http")) return path;
  const base = API_BASE || "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
