/**
 * Production-safe API client.
 *
 * Resolution order:
 * 1. VITE_API_URL (explicit deployment override)
 * 2. same-origin /health (single-process FastAPI + React deployment)
 * 3. same-origin /api/health (reverse-proxy / Pages deployment)
 * 4. localhost backend during local development
 */

function cleanBase(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "/") return "";
  return raw.replace(/\/+$/, "");
}

function unique(values) {
  return [...new Set(values.map(cleanBase))];
}

const explicitBase = cleanBase(
  typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : ""
);

const isBrowser = typeof window !== "undefined";
const isViteDev = isBrowser && window.location.port === "5173";
const isApiDev = isBrowser && window.location.port === "8043";

export const API_BASE = explicitBase || (isViteDev ? "/api" : isApiDev ? "" : "");

let resolvedBase = explicitBase || null;
let resolutionPromise = null;

function readStoredBase() {
  if (!isBrowser) return null;
  try {
    return sessionStorage.getItem("monadbuilder.apiBase");
  } catch {
    return null;
  }
}

function storeBase(base) {
  if (!isBrowser) return;
  try {
    sessionStorage.setItem("monadbuilder.apiBase", base || "@");
  } catch {
    // Storage can be unavailable in privacy modes. Runtime resolution still works.
  }
}

function decodeStoredBase(value) {
  return value === "@" ? "" : value;
}

function candidates() {
  const stored = decodeStoredBase(readStoredBase());
  const list = [explicitBase];

  if (stored !== null && stored !== undefined) list.push(stored);

  if (isViteDev) {
    list.push("/api", "http://127.0.0.1:8043");
  } else if (isApiDev) {
    list.push("");
  } else {
    // Production: prefer a single-origin app, then a conventional /api proxy.
    list.push("", "/api");
  }

  return unique(list);
}

async function probe(base) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${base}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) return false;
    const data = await response.json();
    return Boolean(
      data &&
        (data.status === "operational" ||
          data.product === "MonadBuilder HQ" ||
          data.product_short === "MONADBUILDER" ||
          data.engine === "THESIS")
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveApiBase({ force = false } = {}) {
  if (!force && resolvedBase !== null) return resolvedBase;
  if (!force && resolutionPromise) return resolutionPromise;

  resolutionPromise = (async () => {
    for (const base of candidates()) {
      if (await probe(base)) {
        resolvedBase = base;
        storeBase(base);
        return base;
      }
    }

    resolvedBase = null;
    throw new Error(
      "MonadBuilder backend is unreachable. Deploy the React build and FastAPI together, " +
        "or set VITE_API_URL to the public API origin. Expected /health or /api/health."
    );
  })();

  try {
    return await resolutionPromise;
  } finally {
    resolutionPromise = null;
  }
}

export function getApiBase() {
  if (resolvedBase !== null) return resolvedBase;
  const stored = decodeStoredBase(readStoredBase());
  return stored !== null && stored !== undefined ? stored : API_BASE;
}

export async function api(path, opts = {}) {
  const base = await resolveApiBase();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${normalizedPath}`;

  let response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      ...opts,
    });
  } catch (error) {
    throw new Error(`API network error at ${url}: ${error?.message || error}`);
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data.detail || data.error || response.statusText || "request failed";
    const rendered = typeof message === "string" ? message : JSON.stringify(message);
    throw new Error(`${rendered} (${response.status} · ${url})`);
  }

  return data;
}

/** Absolute URL for engine document downloads and generated artifacts. */
export function apiUrl(path) {
  if (!path) return getApiBase() || "/";
  if (/^https?:\/\//i.test(path)) return path;
  const base = getApiBase();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
