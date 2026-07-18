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
      const [browser, signals, auto] = await Promise.all([
        runHybrid("pulse", {}),
        api("/signals").catch(() => null),
        api("/auto/loop", { method: "POST", body: JSON.stringify({ network }) }).catch(() => null),
      ]);
      setOut({
        source: "hybrid-full",
        novel_tech: "blockchain + web-worker hybrid",
        browser: browser.result || browser,
        browser_worker: browser.worker,
        browser_ms: browser.elapsed_ms,
        signals_n: signals?.n,
        auto_headline: auto?.headline,
        chain_broadcast: false,
      });
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
            <b>Web Workers</b> are background JS processes that run outside the UI thread — so arena
            scoring, signal boards, catalog crawls, and crypto fingerprints never freeze HQ. Chain
            law / vault / auto-exec stay on the API host; workers mirror policy for instant UX.
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
              <b>Browser Worker</b> — evaluate / arena / signals / crawl / fingerprint
            </li>
            <li>
              <b>Main thread</b> — React HQ, wallet connect, sticky RUN SYSTEM
            </li>
            <li>
              <b>API host</b> — dual law stack, auto paper loop, vault sim
            </li>
            <li>
              <b>Node worker_threads</b> — polyglot bridge heavy rank (optional)
            </li>
            <li>
              <b>Monad</b> — PolicyKernel · LawBook · SovereignVault (owner signs)
            </li>
          </ol>
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
