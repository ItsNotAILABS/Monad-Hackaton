import React, { useCallback, useEffect, useState } from "react";
import {
  hybridBench,
  hybridCatalog,
  hybridPulse,
  hybridSupported,
  runHybrid,
} from "./workers/hybrid.js";

/**
 * Novel tech: blockchain + Web Worker hybrid control panel.
 * Heavy scoring/arena/crawl runs off main thread; chain stays on API host.
 */
export function HybridHub({ api, network, busy: parentBusy, onNavigate, onRunSystem }) {
  const [cat, setCat] = useState(null);
  const [server, setServer] = useState(null);
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [uiMs, setUiMs] = useState(null);

  const refresh = useCallback(async () => {
    setCat(hybridCatalog());
    try {
      const s = await api("/hybrid");
      setServer(s);
      setErr("");
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const disabled = busy || parentBusy;

  async function runBrowser(op, payload = {}) {
    setBusy(true);
    setErr("");
    const t0 = performance.now();
    // Spin UI timer to show main thread free (user can still click)
    let ticks = 0;
    const iv = setInterval(() => {
      ticks += 1;
      setUiMs(ticks * 50);
    }, 50);
    try {
      const msg = await runHybrid(op, payload);
      setOut({ source: "browser-worker", ...msg });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      clearInterval(iv);
      setUiMs(Math.round(performance.now() - t0));
      setBusy(false);
    }
  }

  async function runServer(op = "pulse") {
    setBusy(true);
    setErr("");
    try {
      const data = await api("/hybrid/run", {
        method: "POST",
        body: JSON.stringify({ op, network }),
      });
      setOut({ source: "node-worker+api", ...data });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function hybridFull() {
    setBusy(true);
    setErr("");
    try {
      const [browser, signals, auto, edge] = await Promise.all([
        runHybrid("pulse", {}),
        api("/signals").catch(() => null),
        api("/auto/loop", { method: "POST", body: JSON.stringify({ network }) }).catch(() => null),
        api("/edge/run", {
          method: "POST",
          body: JSON.stringify({ agent: "seatbelt", action: "brief", network }),
        }).catch(() => null),
      ]);
      setOut({
        source: "hybrid-full",
        novel_tech: "cloudflare-edge + browser-worker + node + chain",
        browser: browser.result || browser,
        browser_worker: browser.worker,
        browser_ms: browser.elapsed_ms,
        signals_n: signals?.n,
        auto_headline: auto?.headline,
        edge_sim: edge?.result || edge,
        chain_broadcast: false,
      });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function runEdge(agent = "seatbelt", action = "brief") {
    setBusy(true);
    setErr("");
    try {
      const data = await api("/edge/run", {
        method: "POST",
        body: JSON.stringify({ agent, action, network }),
      });
      setOut({ source: "edge-local-sim", ...data });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel hybrid-panel">
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">NOVEL TECH · BLOCKCHAIN + WEB WORKER HYBRID</span>
          <h3>Parallel agents off the main thread</h3>
          <p className="muted sm">
            <b>Web Workers</b> run off the UI thread. <b>Cloudflare Workers</b> run small AI agents on
            the global edge (~300+ cities) and call the central API for dual-stack law. Node
            worker_threads + Monad contracts complete the multi-device stack.
          </p>
          <p className="muted sm">
            Browser worker:{" "}
            <span className={`pill ${hybridSupported() ? "ok" : "warn"}`}>
              {hybridSupported() ? "supported" : "fallback"}
            </span>
            {server?.node_workers != null && (
              <>
                {" "}
                · Node workers: <b>{String(server.node_workers)}</b>
              </>
            )}
            {uiMs != null && (
              <>
                {" "}
                · last UI span <b>{uiMs}ms</b> (thread stayed interactive)
              </>
            )}
          </p>
        </div>
        <div className="win-actions">
          <button type="button" className="forge win-btn" disabled={disabled} onClick={hybridFull}>
            FULL HYBRID →
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={() => runBrowser("bench", { n: 400000 })}>
            WORKER BENCH
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={() => runServer("pulse")}>
            NODE WORKER
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={() => runEdge("seatbelt", "brief")}>
            EDGE SEATBELT
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={() => runEdge("nomos", "arena")}>
            EDGE NOMOS
          </button>
        </div>
      </div>

      {err ? <div className="banner err">{err}</div> : null}

      <div className="grid3">
        {(cat?.ops || []).map((op) => (
          <article key={op.id} className="plan">
            <header>
              <b>{op.id}</b>
            </header>
            <p className="muted sm">{op.desc}</p>
            <button type="button" className="forge" disabled={disabled} onClick={() => runBrowser(op.id, {})}>
              RUN IN WORKER →
            </button>
          </article>
        ))}
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <article className="result">
          <label>LAST HYBRID RESULT</label>
          {!out ? (
            <p className="muted">Run pulse, bench, or FULL HYBRID.</p>
          ) : (
            <pre className="code sm" style={{ maxHeight: 320, overflow: "auto" }}>
              {JSON.stringify(out, null, 2).slice(0, 3500)}
            </pre>
          )}
        </article>
        <article>
          <label>ARCHITECTURE</label>
          <ol className="pillars start-steps">
            <li>
              <b>Cloudflare Workers</b> — small edge agents in ~300+ cities → origin API
            </li>
            <li>
              <b>Browser Worker</b> — evaluate / arena / delta / signals (UI free)
            </li>
            <li>
              <b>Main thread</b> — React HQ, STT mic, sticky AI Morning
            </li>
            <li>
              <b>API host (origin)</b> — dual law stack, auto paper, vault sim
            </li>
            <li>
              <b>Node worker_threads</b> — polyglot hybrid rank
            </li>
            <li>
              <b>Monad</b> — PolicyKernel · LawBook · SovereignVault (owner signs)
            </li>
          </ol>
          <p className="muted sm">
            Deploy: <code>cd edge && npx wrangler deploy</code> · set{" "}
            <code>ORIGIN_API</code> to your public FastAPI URL
          </p>
          <p className="muted sm">
            {(server?.description || cat?.doctrine) && (
              <>{server?.description || cat?.doctrine}</>
            )}
          </p>
          <div className="chips tight">
            <button type="button" className="ghost" onClick={() => onNavigate?.("term")}>
              TERM
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate?.("poly")}>
              POLYGLOT
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate?.("tools")}>
              TOOLS
            </button>
            <button type="button" className="ghost" disabled={disabled} onClick={onRunSystem}>
              ▶ RUN SYSTEM
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
