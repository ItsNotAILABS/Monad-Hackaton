/**
 * THESIS Hybrid Worker pool — main-thread API.
 * Spawns Web Workers for heavy agent/policy/signal/blockchain prep.
 * UI stays responsive; results merge with server /auto /signals /nomos.
 */

let _worker = null;
let _seq = 0;
const _pending = new Map();

function getWorker() {
  if (typeof Worker === "undefined") return null;
  if (_worker) return _worker;
  try {
    _worker = new Worker(new URL("./thesis.worker.js", import.meta.url), {
      type: "module",
      name: "thesis-hybrid",
    });
    _worker.onmessage = (ev) => {
      const msg = ev.data || {};
      const p = _pending.get(msg.id);
      if (!p) return;
      _pending.delete(msg.id);
      if (msg.ok) p.resolve(msg);
      else p.reject(new Error(msg.error || "worker failed"));
    };
    _worker.onerror = (err) => {
      for (const [, p] of _pending) {
        p.reject(err?.message ? new Error(err.message) : new Error("worker error"));
      }
      _pending.clear();
      _worker = null;
    };
    return _worker;
  } catch (e) {
    console.warn("THESIS hybrid worker unavailable", e);
    return null;
  }
}

/**
 * Run an op on the hybrid worker.
 * @param {string} op evaluate|arena|signals|crawl|agents|fingerprint|bench|pulse|ping
 * @param {object} payload
 * @param {number} timeoutMs
 */
export function runHybrid(op, payload = {}, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    if (!w) {
      // Main-thread fallback (still works, no parallelism)
      import("./thesis.worker.fallback.js")
        .then((m) => m.runOp(op, payload))
        .then((result) =>
          resolve({
            ok: true,
            op,
            result,
            worker: false,
            fallback: true,
            elapsed_ms: 0,
            novel_tech: "main-thread-fallback",
          })
        )
        .catch(reject);
      return;
    }
    const id = `h-${++_seq}-${Date.now()}`;
    const timer = setTimeout(() => {
      _pending.delete(id);
      reject(new Error(`hybrid worker timeout: ${op}`));
    }, timeoutMs);
    _pending.set(id, {
      resolve: (msg) => {
        clearTimeout(timer);
        resolve(msg);
      },
      reject: (e) => {
        clearTimeout(timer);
        reject(e);
      },
    });
    w.postMessage({ id, op, payload });
  });
}

export function hybridSupported() {
  return typeof Worker !== "undefined";
}

export function hybridCatalog() {
  return {
    schema: "thesis.hybrid.browser.v1",
    novel_tech: "blockchain + web-worker hybrid",
    supported: hybridSupported(),
    ops: [
      { id: "pulse", desc: "Arena + agent rank pulse off main thread" },
      { id: "arena", desc: "Batch NOMOS-style evaluate/arbitrate" },
      { id: "evaluate", desc: "Single action policy gate" },
      { id: "signals", desc: "Score alpha signal board" },
      { id: "crawl", desc: "Rank protocol catalog (offline crawl)" },
      { id: "agents", desc: "Rank competing agents by utility" },
      { id: "fingerprint", desc: "SHA-256 fingerprint for receipt/calldata prep" },
      { id: "bench", desc: "CPU bench to prove UI stays free" },
      { id: "ping", desc: "Worker alive check" },
    ],
    stack: {
      browser: "Web Worker (module)",
      node: "worker_threads via polyglot thesis-bridge",
      chain: "PolicyKernel / LawBook / vault sim on API host",
    },
    doctrine: "Workers propose/score. Laws decide. Owner signs. Receipts remember.",
  };
}

/** Convenience: run pulse then optional server merge via callback */
export async function hybridPulse(payload = {}) {
  return runHybrid("pulse", payload);
}

export async function hybridArena(actions, policy) {
  return runHybrid("arena", { actions, policy });
}

export async function hybridBench(n = 300000) {
  return runHybrid("bench", { n });
}

export function terminateHybrid() {
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
  _pending.clear();
}
