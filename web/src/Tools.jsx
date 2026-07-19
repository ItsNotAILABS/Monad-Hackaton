import React, { useCallback, useEffect, useState } from "react";

/**
 * Focused shippable tools — easy path for humans + any AI via MCP/HTTP.
 */
export function Tools({ api, network, busy: parentBusy, onNavigate, onRunSystem }) {
  const [catalog, setCatalog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [log, setLog] = useState("");
  const [last, setLast] = useState(null);
  const [running, setRunning] = useState("");

  const refresh = useCallback(async () => {
    try {
      const d = await api("/tools");
      setCatalog(d);
      setErr("");
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const disabled = busy || parentBusy;

  async function run(id) {
    setBusy(true);
    setRunning(id);
    setErr("");
    try {
      const data = await api(`/tools/${id}/run`, {
        method: "POST",
        body: JSON.stringify({ network }),
      });
      setLast(data);
      const proof = data?.result?.proof || (data.ok ? "ok" : "fail");
      setLog(`${id}: ${proof}`);
      setTimeout(() => setLog(""), 6000);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
      setRunning("");
    }
  }

  async function easyPath() {
    setBusy(true);
    setRunning("easy_path");
    setErr("");
    try {
      const data = await api("/tools/easy_path/run", {
        method: "POST",
        body: JSON.stringify({ network }),
      });
      setLast(data);
      setLog(data?.result?.proof || "easy path done");
      setTimeout(() => setLog(""), 8000);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
      setRunning("");
    }
  }

  const tools = catalog?.tools || [];
  const result = last?.result;

  return (
    <section className="panel tools-panel">
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">FOCUSED TOOLS · HUMAN · IN-APP AI · ANY AI (MCP)</span>
          <h3>{catalog?.tagline || "Press one tool. Get proof."}</h3>
          <p className="muted sm">
            Polished winners ship one feature. You get the same <b>quick wins</b> here — reject,
            gas, arena — plus LawBook dual stack and Company OS underneath.
          </p>
          <p className="muted sm">
            {(catalog?.how_to_use || []).join(" · ")}
          </p>
        </div>
        <div className="win-actions">
          <button type="button" className="forge win-btn" disabled={disabled} onClick={easyPath}>
            EASY PATH (60s) →
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={() => run("win_path")}>
            WIN PATH
          </button>
          <button type="button" className="ghost" onClick={() => onNavigate?.("judge")}>
            PROOF
          </button>
        </div>
      </div>

      {err ? <div className="banner err">{err}</div> : null}
      {log ? <div className="banner ok">{log}</div> : null}

      <div className="chips tight" style={{ margin: "0 0 12px" }}>
        {(catalog?.easy_path || []).map((s) => (
          <button
            key={s.step}
            type="button"
            className="ghost"
            disabled={disabled}
            onClick={() => run(s.tool)}
            title={s.why}
          >
            {s.step}. {s.tool}
          </button>
        ))}
      </div>

      <div className="grid3 tools-grid">
        {tools.map((t) => (
          <article key={t.id} className={`plan ${running === t.id ? "yes" : ""}`}>
            <header>
              <b>{t.name}</b>
              <span className="pill ok">{t.seconds}s</span>
            </header>
            <p className="muted sm">{t.do}</p>
            <p className="muted sm">
              Proof: <code>{t.proof}</code>
            </p>
            <p className="muted sm">Beats: {t.beats_crowd}</p>
            <button
              type="button"
              className="forge"
              disabled={disabled}
              onClick={() => run(t.id)}
            >
              {running === t.id ? "…" : "RUN →"}
            </button>
          </article>
        ))}
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <article className="result">
          <label>LAST PROOF</label>
          {!last ? (
            <p className="muted">Run any tool. Receipt sealed on each run.</p>
          ) : (
            <>
              <div className="kv">
                <span>Tool</span>
                <b>{last.tool?.id || "—"}</b>
              </div>
              <div className="kv">
                <span>OK</span>
                <span className={`pill ${last.ok ? "ok" : "bad"}`}>{String(last.ok)}</span>
              </div>
              <div className="kv">
                <span>Proof</span>
                <code className="sm">{result?.proof || "—"}</code>
              </div>
              {result?.n_rejected != null && (
                <div className="kv">
                  <span>Rejected</span>
                  <b>{result.n_rejected}</b>
                </div>
              )}
              {result?.winner && (
                <div className="kv">
                  <span>Winner</span>
                  <b>{result.winner}</b>
                </div>
              )}
              {result?.recommended_gas_limit != null && (
                <div className="kv">
                  <span>Gas limit</span>
                  <b>{result.recommended_gas_limit}</b>
                </div>
              )}
              {result?.answer && <p className="muted sm">{result.answer}</p>}
              {result?.steps && (
                <div className="plans">
                  {result.steps.map((s) => (
                    <div key={s.tool} className={`plan ${s.ok ? "yes" : "no"}`}>
                      <header>
                        <b>{s.tool}</b>
                        <span className={`pill ${s.ok ? "ok" : "bad"}`}>{s.ok ? "OK" : "FAIL"}</span>
                      </header>
                      <p>{s.proof}</p>
                    </div>
                  ))}
                </div>
              )}
              {last.receipt?.receipt_hash && (
                <div className="kv">
                  <span>Receipt</span>
                  <code className="sm">{String(last.receipt.receipt_hash).slice(0, 18)}…</code>
                </div>
              )}
              <pre className="code sm" style={{ maxHeight: 220, overflow: "auto" }}>
                {JSON.stringify(result || last, null, 2).slice(0, 1800)}
              </pre>
            </>
          )}
        </article>
        <article>
          <label>MCP · ANY AI OUTSIDE</label>
          <p className="muted sm">
            Claude, Cursor, Grok, or any MCP client — same tools as this tab.
          </p>
          <pre className="code sm">
            {catalog?.mcp?.entry || "python -m thesis_forge.mcp_server"}
            {"\n"}
            GET /tools/mcp
          </pre>
          <label style={{ marginTop: 12 }}>VS POLISHED WINNERS</label>
          <p className="muted sm">
            They win on focused demos. We ship those as tools — then keep governance depth
            most agent wallets skip. See PROOF tab · docs/VS_WINNERS.md
          </p>
          <div className="chips tight">
            <button type="button" className="ghost" onClick={() => onNavigate?.("nomos")}>
              NOMOS
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate?.("desk")}>
              DESK
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
