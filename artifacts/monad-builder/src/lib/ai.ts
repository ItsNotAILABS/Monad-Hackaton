/**
 * AI client utilities for MonadBuilder+ frontend.
 * All streaming endpoints parse SSE data: {...} lines.
 * 429 responses are surfaced as user-readable error messages.
 *
 * Model tiers used server-side:
 *   gpt-5.6-luna  — chat, component gen, template match, script (fast, conversational)
 *   gpt-5.6-terra — analyze, build-dapp, refine-dapp, audit (needs reasoning quality)
 */

const AI_BASE = "/api/ai";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Thrown when the server returns 429 (rate limit exceeded). */
export class RateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    super(`Rate limit exceeded — please wait ${retryAfter}s before trying again.`);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/** Check a non-streaming response for rate limit errors, throw RateLimitError if 429. */
async function guardJson(res: Response): Promise<Response> {
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new RateLimitError(body.retryAfter ?? 60);
  }
  return res;
}

/** Stream a chat response. Calls onChunk for each delta, onDone when finished. */
export async function streamChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  context?: string
): Promise<void> {
  const res = await fetch(`${AI_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
  });

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    onChunk(`\n⚠ Too many requests — please wait ${body.retryAfter ?? 60}s before sending another message.`);
    onDone();
    return;
  }

  if (!res.body) { onDone(); return; }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const payload = JSON.parse(line.slice(6));
        if (payload.content) onChunk(payload.content);
        if (payload.done) { onDone(); return; }
        if (payload.error) { onChunk(`\n⚠ ${payload.error}`); onDone(); return; }
      } catch {}
    }
  }
  onDone();
}

/** Stream an analysis (contract / gas / dApp / law). */
export async function streamAnalysis(
  type: "contract" | "gas" | "dapp" | "law",
  data: string,
  onChunk: (text: string) => void,
  onDone: () => void
): Promise<void> {
  const res = await fetch(`${AI_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, data }),
  });

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    onChunk(`\n⚠ Rate limit reached — please wait ${body.retryAfter ?? 60}s.`);
    onDone();
    return;
  }

  if (!res.body) { onDone(); return; }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const payload = JSON.parse(line.slice(6));
        if (payload.content) onChunk(payload.content);
        if (payload.done) { onDone(); return; }
        if (payload.error) { onChunk(`\n⚠ ${payload.error}`); onDone(); return; }
      } catch {}
    }
  }
  onDone();
}

/** Generate a single component config from a natural language prompt. */
export async function generateComponent(
  prompt: string,
  existingTypes: string[] = []
): Promise<{ type: string; name: string; props: Record<string, any>; reasoning: string } | null> {
  try {
    const res = await guardJson(await fetch(`${AI_BASE}/generate-component`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, existingTypes }),
    }));
    const data = await res.json();
    return data.ok ? data.component : null;
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    return null;
  }
}

export interface BuildDappResult {
  projectName: string;
  components: Array<{ id: string; type: string; props: Record<string, any>; order: number }>;
  /** Non-fatal notices: component types that were remapped or dropped by the server validator. */
  warnings: string[];
  /** The AI-expanded version of the user's original prompt, shown in the UI for transparency. */
  enrichedPrompt?: string;
}

/** Build a full dApp from a one-sentence idea. Returns projectName + pre-configured components. */
export async function buildDapp(prompt: string): Promise<BuildDappResult | null> {
  try {
    const res = await guardJson(await fetch(`${AI_BASE}/build-dapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }));
    const data = await res.json();
    return data.ok
      ? {
          projectName: data.projectName,
          components: data.components,
          warnings: data.warnings ?? [],
          enrichedPrompt: data.enrichedPrompt,
        }
      : null;
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    return null;
  }
}

/** Stream an AI audit of the current dApp. */
export async function streamAuditDapp(
  projectName: string,
  components: Array<{ type: string; props: Record<string, any> }>,
  onChunk: (text: string) => void,
  onDone: () => void
): Promise<void> {
  const res = await fetch(`${AI_BASE}/audit-dapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectName, components }),
  });

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    onChunk(`\n⚠ Rate limit reached — please wait ${body.retryAfter ?? 60}s.`);
    onDone();
    return;
  }

  if (!res.body) { onDone(); return; }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const payload = JSON.parse(line.slice(6));
        if (payload.content) onChunk(payload.content);
        if (payload.done) { onDone(); return; }
        if (payload.error) { onChunk(`\n⚠ ${payload.error}`); onDone(); return; }
      } catch {}
    }
  }
  onDone();
}

/** Get the best-matching template for a description. */
export async function recommendTemplate(
  description: string,
  templates: Array<{ id: number; name: string; category: string; description: string }>
): Promise<{ templateId: number; reason: string } | null> {
  try {
    const res = await guardJson(await fetch(`${AI_BASE}/recommend-template`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, templates }),
    }));
    const data = await res.json();
    return data.ok ? { templateId: data.templateId, reason: data.reason } : null;
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    return null;
  }
}

export interface RefineDappResult {
  components: Array<{ id: string; type: string; props: Record<string, any>; order: number }>;
  /** Non-fatal notices: component types that were remapped or dropped by the server validator. */
  warnings: string[];
}

/** Refine an existing dApp canvas from a follow-up instruction. */
export async function refineDapp(
  projectName: string,
  currentComponents: Array<{ type: string; props: Record<string, any> }>,
  refinementPrompt: string
): Promise<RefineDappResult | null> {
  try {
    const res = await guardJson(await fetch(`${AI_BASE}/refine-dapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName, currentComponents, refinementPrompt }),
    }));
    const data = await res.json();
    return data.ok ? { components: data.components, warnings: data.warnings ?? [] } : null;
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    return null;
  }
}

/** Generate a Monad script from a description. */
export async function generateScript(
  prompt: string,
  lang: "python" | "js" = "python"
): Promise<string | null> {
  try {
    const res = await guardJson(await fetch(`${AI_BASE}/script`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, lang }),
    }));
    const data = await res.json();
    return data.ok ? data.script : null;
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    return null;
  }
}
