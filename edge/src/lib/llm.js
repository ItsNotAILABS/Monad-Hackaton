/**
 * Optional LLM calls from the edge (Grok / OpenAI / Anthropic / Workers AI gateway).
 * Never required for core seatbelt — origin API is enough. LLM enriches when keys exist.
 */

export async function edgeLlm(env, { system, user, max_tokens = 256 } = {}) {
  // Prefer Cloudflare AI Gateway or Workers AI if configured
  if (env.CF_AI_GATEWAY_URL && env.OPENAI_API_KEY) {
    try {
      const res = await fetch(env.CF_AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.LLM_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: system || "You are MonadBuilder edge agent. Text only. No robot voice." },
            { role: "user", content: user || "" },
          ],
          max_tokens,
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || data.result?.response || null;
      if (text) return { ok: true, provider: "cf-ai-gateway", text, raw: data };
    } catch (e) {
      return { ok: false, error: String(e.message || e), provider: "cf-ai-gateway" };
    }
  }

  if (env.XAI_API_KEY) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.XAI_MODEL || "grok-2-latest",
          messages: [
            { role: "system", content: system || "MonadBuilder edge. Concise. Text only." },
            { role: "user", content: user || "" },
          ],
          max_tokens,
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return { ok: true, provider: "xai", text, raw: data };
    } catch (e) {
      return { ok: false, error: String(e.message || e), provider: "xai" };
    }
  }

  if (env.OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.LLM_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: system || "MonadBuilder edge. Concise. Text only." },
            { role: "user", content: user || "" },
          ],
          max_tokens,
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return { ok: true, provider: "openai", text, raw: data };
    } catch (e) {
      return { ok: false, error: String(e.message || e), provider: "openai" };
    }
  }

  return {
    ok: false,
    skipped: true,
    note: "No LLM secrets — edge agent uses origin API tools only (preferred for seatbelt)",
  };
}
