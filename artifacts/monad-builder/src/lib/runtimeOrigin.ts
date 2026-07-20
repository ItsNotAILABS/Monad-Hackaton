const configuredOrigin = String(import.meta.env.VITE_PUBLIC_API_ORIGIN ?? "").trim().replace(/\/+$/, "");

export const PUBLIC_API_ORIGIN = configuredOrigin;

export function runtimeUrl(input: string): string {
  if (!configuredOrigin || !input.startsWith("/")) return input;
  if (!/^\/(api|engine|rpc)(\/|$)/.test(input)) return input;
  return `${configuredOrigin}${input}`;
}

export function installRuntimeOrigin(): void {
  if (!configuredOrigin || typeof window === "undefined") return;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string") return nativeFetch(runtimeUrl(input), init);
    if (input instanceof URL) return nativeFetch(new URL(runtimeUrl(input.pathname + input.search), input.origin), init);
    const url = new URL(input.url);
    if (url.origin === window.location.origin) {
      const rewritten = runtimeUrl(url.pathname + url.search);
      if (/^https?:\/\//.test(rewritten)) return nativeFetch(new Request(rewritten, input), init);
    }
    return nativeFetch(input, init);
  }) as typeof window.fetch;
}
