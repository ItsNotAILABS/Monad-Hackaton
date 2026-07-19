import React, { useCallback, useEffect, useState } from "react";
import { apiUrl } from "./api.js";

/**
 * Cloud engines panel — real server-side engines for the hosted web app.
 * Runs on API host; talks to Monad RPC + platform modules.
 */
export function CloudEngines({ api, network, busy: parentBusy, onNavigate, onRunSystem }) {
  const [catalog, setCatalog] = useState(null);
  const [selected, setSelected] = useState("chain");
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("Monad gas limits and SovereignVault policy gate");
  const [scanText, setScanText] = useState("");
  const [estimate, setEstimate] = useState(80000);
  const [out, setOut] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [log, setLog] = useState("");

  const refresh = useCallback(async () => {
    try {
      const c = await api(`/engines?network=${network}`);
      setCatalog(c);
      setErr("");
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, [api, network]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const disabled = busy || parentBusy;

  function flash(m) {
    setLog(m);
    setTimeout(() => setLog(""), 4000);
  }

  async function runEngine(id, params = {}) {
    setBusy(true);
    setErr("");
    try {
      const body = {
        network,
        params: { network, ...params },
      };
      const data = await api(`/engines/${id}/run`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setOut(data);
      flash(`${id} · ${data.ok ? "ok" : "fail"} · ${(data.elapsed_ms || 0).toFixed?.(0) ?? data.elapsed_ms}ms`);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function runPipeline() {
    setBusy(true);
    setErr("");
    try {
      const data = await api("/engines/pipeline", {
        method: "POST",
        body: JSON.stringify({
          network,
          address: address || undefined,
          query: query || undefined,
          estimated_gas: Number(estimate) || 80000,
        }),
      });
      setPipeline(data);
      setOut(data);
      flash(data.summary || "pipeline done");
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  const engines = catalog?.engines || [];
  const result = out?.result || out;

  return (
    <section className="panel cloud-engines">
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">CLOUD ENGINES · HOSTED WEB APP · MONAD RPC</span>
          <h3>Real server-side engines inside the platform</h3>
          <p className="muted sm">
            These run on the API host serving this UI — not in the browser tab. They call live Monad
            JSON-RPC and platform modules. Local AI stays on-device separately.
          </p>
          <p className="muted sm">
            {catalog?.count ?? "…"} engines · chain <b>{network}</b> ·{" "}
            <code>POST /engines/pipeline</code>
          </p>
        </div>
        <div className="win-actions">
          <button
            type="button"
            className="forge win-btn"
            disabled={disabled}
            onClick={() => {
              if (onRunSystem) return onRunSystem();
              // fallback local system call
              return (async () => {
                setBusy(true);
                try {
                  const data = await api("/system/run", {
                    method: "POST",
                    body: JSON.stringify({
                      network,
                      query: query || "Monad gas and vault",
                      address: address || "",
                      estimated_gas: Number(estimate) || 80000,
                    }),
                  });
                  setPipeline(data.cloud || data);
                  setOut(data);
                  flash(data.headline || "system linked");
                } catch (e) {
                  setErr(String(e.message || e));
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            ▶ RUN SYSTEM
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={runPipeline}>
            Cloud pipeline only
          </button>
          <button type="button" className="ghost" onClick={() => onNavigate?.("live")}>
            Platform shell
          </button>
        </div>
      </div>

      {err ? <div className="banner err">{err}</div> : null}
      {log ? <div className="banner ok">{log}</div> : null}

      <div className="primitive-row local-caps" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))" }}>
        {engines.map((e) => (
          <button
            key={e.id}
            type="button"
            className={`primitive-card ${selected === e.id ? "ok" : ""}`}
            style={{ cursor: "pointer", textAlign: "left", border: selected === e.id ? "1px solid #2ee6a644" : undefined }}
            onClick={() => setSelected(e.id)}
          >
            <span className="eyebrow">{e.kind}</span>
            <b>{e.name}</b>
            <span className="muted sm">{e.id}</span>
          </button>
        ))}
      </div>

      <div className="grid2 tight" style={{ margin: "12px" }}>
        <article className="result">
          <label>RUN · {selected}</label>
          <p className="muted sm">
            {(engines.find((e) => e.id === selected) || {}).description}
          </p>
          <label className="field">
            <span className="muted sm">Address (optional · public only)</span>
            <input
              className="local-textarea"
              style={{ minHeight: 36, resize: "none" }}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x… vault or wallet"
            />
          </label>
          <label className="field">
            <span className="muted sm">Research query / scan text</span>
            <textarea
              className="local-textarea"
              rows={3}
              value={selected === "security" ? scanText : query}
              onChange={(e) =>
                selected === "security" ? setScanText(e.target.value) : setQuery(e.target.value)
              }
              placeholder={
                selected === "security"
                  ? "Paste public text to scan…"
                  : "Research question for cloud research engine…"
              }
            />
          </label>
          <label className="field">
            <span className="muted sm">Estimated gas (gas engine)</span>
            <input
              className="local-textarea"
              style={{ minHeight: 36, resize: "none" }}
              type="number"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
            />
          </label>
          <div className="chips tight">
            <button
              type="button"
              className="forge"
              disabled={disabled}
              onClick={() => {
                if (selected === "chain")
                  return runEngine("chain", { op: "pulse", address: address || undefined });
                if (selected === "gas")
                  return runEngine("gas", { estimated_gas: Number(estimate) || 80000 });
                if (selected === "law") return runEngine("law", { op: "status" });
                if (selected === "research") return runEngine("research", { query });
                if (selected === "index") return runEngine("index", { op: "all" });
                if (selected === "docs") return runEngine("docs", { kind: "ops" });
                if (selected === "security")
                  return runEngine("security", { text: scanText || query });
                return runEngine(selected, {});
              }}
            >
              Run {selected}
            </button>
            <button type="button" className="ghost" disabled={disabled} onClick={runPipeline}>
              Full pipeline
            </button>
            <button type="button" className="ghost" disabled={disabled} onClick={refresh}>
              Refresh catalog
            </button>
          </div>
          <p className="muted sm law-note">
            <b>Security:</b> Cloud engines refuse private_key / seed / mnemonic fields. Use public
            addresses only.
          </p>
        </article>

        <article className="result">
          <label>OUTPUT</label>
          {pipeline?.summary && (
            <div className="proto featured">
              <span className="eyebrow">PIPELINE</span>
              <b>{pipeline.summary}</b>
              <div className="caps" style={{ marginTop: 8 }}>
                {(pipeline.steps || []).map((s) => (
                  <span key={s.engine} className={`badge ${s.ok ? "on" : "warn"}`}>
                    {s.engine} {s.ok ? "✓" : "✗"}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!out ? (
            <p className="muted sm">Run an engine or the full pipeline.</p>
          ) : (
            <pre className="code sm doc-preview" style={{ maxHeight: 480 }}>
              {JSON.stringify(result, null, 2).slice(0, 12000)}
            </pre>
          )}
          {(result?.markdown || result?.download) && (
            <div className="chips tight">
              {result?.markdown && (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    const blob = new Blob([result.markdown], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = result.filename || "cloud-report.md";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download markdown
                </button>
              )}
              {result?.download && (
                <a className="link" href={apiUrl(result.download)} target="_blank" rel="noreferrer">
                  Server file →
                </a>
              )}
            </div>
          )}
          {out?.ok === false && out?.error && (
            <p className="muted sm down">{out.error}</p>
          )}
          {result?.brief?.summary && (
            <div className="proto featured">
              <span className="eyebrow">RESEARCH BRIEF</span>
              <b>{result.brief.summary}</b>
              <ul className="pillars">
                {(result.brief.insights || []).slice(0, 4).map((i) => (
                  <li key={i.title}>{i.title}</li>
                ))}
              </ul>
            </div>
          )}
          {result?.recommended_gas_limit != null && (
            <div className="proto">
              <b>
                Gas limit {result.recommended_gas_limit} (est {result.estimated_gas})
              </b>
              <p className="muted sm">
                Live ~{result.live_gas_price_gwei?.toFixed?.(3) ?? result.live_gas_price_gwei} gwei ·{" "}
                {result.doctrine}
              </p>
            </div>
          )}
          {result?.block_number != null && (
            <div className="proto">
              <b>
                Chain block {result.block_number} · id {result.observed_chain_id}
              </b>
              <p className="muted sm">
                match={String(result.chain_match)} · {result.rpc}
              </p>
            </div>
          )}
        </article>
      </div>

      <article className="result" style={{ margin: "0 12px 12px" }}>
        <label>API · HOW THE WEB APP HOSTS ENGINES</label>
        <ul className="pillars">
          <li>
            Browser → <code>POST /engines/{"{id}"}/run</code> on the same origin / API host
          </li>
          <li>
            Chain engine → Monad JSON-RPC batch (<code>eth_chainId</code>, block, gasPrice, balance)
          </li>
          <li>Law / index / docs engines → platform modules + receipt seal on the server</li>
          <li>Onchain contracts (SovereignVault, …) live on Monad; engines read/operate around them</li>
          <li>LOCAL AI remains browser-only — complementary, not a replacement</li>
        </ul>
      </article>
    </section>
  );
}
