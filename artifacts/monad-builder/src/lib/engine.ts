/**
 * THESIS Engine API bridge.
 *
 * Calls the Python FastAPI THESIS engine at /engine/*.
 * Degrades gracefully — returns { ok: false, offline: true } when the engine
 * is not running so every page renders a sensible offline state.
 */

// Set VITE_THESIS_ENGINE in Replit Secrets / .env to override
export const THESIS_ENGINE_BASE =
  (import.meta.env.VITE_THESIS_ENGINE as string | undefined) ?? "/engine";

export interface EngineResult<T = unknown> {
  ok: boolean;
  offline?: boolean;
  error?: string;
  data?: T;
}

/**
 * Call the THESIS engine.
 * @param path  e.g. "/health" or "/engines/chain/run"
 * @param opts  standard RequestInit; method defaults to GET
 */
export async function engineApi<T = unknown>(
  path: string,
  opts: RequestInit & { params?: Record<string, string> } = {}
): Promise<T & { ok?: boolean; offline?: boolean; error?: string }> {
  const { params, ...fetchOpts } = opts;

  let url = `${THESIS_ENGINE_BASE}${path}`;
  if (params && Object.keys(params).length) {
    url += "?" + new URLSearchParams(params).toString();
  }

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(fetchOpts.headers ?? {}),
      },
      ...fetchOpts,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text}` } as any;
    }

    return await res.json();
  } catch (e: any) {
    // Network error — engine not running yet
    const msg = e?.message ?? String(e);
    const isOffline =
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("Load failed");
    return {
      ok: false,
      offline: isOffline,
      error: isOffline ? "THESIS engine offline" : msg,
    } as any;
  }
}

/** Convenience: POST JSON body */
export function enginePost<T = unknown>(path: string, body: unknown): Promise<T & { ok?: boolean; offline?: boolean }> {
  return engineApi<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Check if engine is alive */
export async function engineHealth(): Promise<{ alive: boolean; version?: string }> {
  const r = await engineApi<{ status?: string; version?: string }>("/health");
  return {
    alive: !r.offline && (r as any).status !== undefined,
    version: r.version,
  };
}
