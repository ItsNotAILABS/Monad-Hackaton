/**
 * Browser-local inference via Transformers.js (Hugging Face).
 * Default: MiniLM embeddings — no keys leave the device.
 */

import { logEvent } from "./memory.js";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

let extractor = null;
let loadState = "idle"; // idle | loading | ready | error
let loadError = null;
let loadProgress = 0;

export function inferenceStatus() {
  return {
    engine: "transformers.js",
    model: MODEL_ID,
    state: loadState,
    progress: loadProgress,
    error: loadError,
    ready: loadState === "ready",
    locality: "browser-only",
    capabilities: ["feature-extraction", "semantic-recall", "research-ranking"],
  };
}

export async function ensureEmbedder({ onProgress } = {}) {
  if (extractor) return extractor;
  if (loadState === "loading") {
    // wait until ready/error
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 250));
      if (extractor) return extractor;
      if (loadState === "error") throw new Error(loadError || "model load failed");
    }
    throw new Error("model load timeout");
  }

  loadState = "loading";
  loadError = null;
  loadProgress = 0;
  try {
    const { pipeline, env } = await import("@huggingface/transformers");
    // Prefer browser cache; allow remote model download once
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    extractor = await pipeline("feature-extraction", MODEL_ID, {
      progress_callback: (p) => {
        if (p?.progress != null) loadProgress = Math.round(p.progress);
        else if (p?.status === "done") loadProgress = 100;
        onProgress?.(p);
      },
    });
    loadState = "ready";
    loadProgress = 100;
    await logEvent("inference.ready", { message: `model ready · ${MODEL_ID}` });
    return extractor;
  } catch (e) {
    loadState = "error";
    loadError = String(e.message || e);
    await logEvent("inference.error", { message: loadError });
    throw e;
  }
}

/** Mean-pool + L2-normalize embedding */
export async function embed(text, { ensure = true } = {}) {
  if (ensure) await ensureEmbedder();
  if (!extractor) throw new Error("embedder not ready");
  const input = String(text || "").slice(0, 2000);
  if (!input.trim()) return [];
  const out = await extractor(input, { pooling: "mean", normalize: true });
  // transformers.js returns Tensor-like
  const data = out?.data || out;
  return Array.from(data);
}

export async function embedBatch(texts, { ensure = true } = {}) {
  const list = (texts || []).map((t) => String(t).slice(0, 2000));
  const vectors = [];
  for (const t of list) {
    // sequential to keep browser responsive
    // eslint-disable-next-line no-await-in-loop
    vectors.push(await embed(t, { ensure }));
  }
  return vectors;
}

/** Fallback bag-of-words vector if model unavailable */
export function embedFallback(text) {
  const dims = 64;
  const v = new Array(dims).fill(0);
  const tokens = String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9./-]+/)
    .filter(Boolean);
  for (const t of tokens) {
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
    v[h % dims] += 1;
  }
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

export async function embedSafe(text) {
  try {
    return await embed(text);
  } catch {
    return embedFallback(text);
  }
}
