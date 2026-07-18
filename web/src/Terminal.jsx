import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "./api.js";
import { MicButton } from "./MicButton.jsx";

/**
 * Sovereign embedded web terminal — THESIS commands only.
 * Vault · ecosystem · briefs · workflows · full PDF reports.
 */
export function Terminal({ api, network, busy: parentBusy, onNavigate }) {
  const [banner, setBanner] = useState(null);
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [reports, setReports] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const push = useCallback((kind, text) => {
    const parts = String(text || "").split("\n");
    setLines((prev) => [
      ...prev,
      ...parts.map((t) => ({ kind, text: t, ts: Date.now() })),
    ].slice(-500));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [b, r] = await Promise.all([
        api(`/terminal?network=${network}`),
        api("/reports").catch(() => ({ reports: [] })),
      ]);
      setBanner(b);
      setReports(r.reports || []);
      setErr("");
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, [api, network]);

  useEffect(() => {
    refresh();
    push("sys", "THESIS sovereign terminal — type help · no OS shell · no keys");
    push("sys", "Try: brief · vault · ecosystem · workflow morning · report pdf");
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const disabled = busy || parentBusy;

  async function exec(cmd) {
    const command = (cmd ?? input).trim();
    if (!command) return;
    setInput("");
    push("in", `$ ${command}`);
    if (command === "clear") {
      setLines([]);
      push("sys", "(cleared)");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const data = await api("/terminal/exec", {
        method: "POST",
        body: JSON.stringify({ command, network }),
      });
      push(data.ok ? "out" : "err", data.text || "(empty)");
      if (command.startsWith("report") || command === "reports") {
        const r = await api("/reports");
        setReports(r.reports || []);
      }
    } catch (e) {
      push("err", String(e.message || e));
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  async function genReport() {
    setBusy(true);
    try {
      const data = await api("/reports/full", {
        method: "POST",
        body: JSON.stringify({ network, format: "both" }),
      });
      push("out", `Report ready · PDF ${data.download?.pdf} · MD ${data.download?.markdown}`);
      const r = await api("/reports");
      setReports(r.reports || []);
    } catch (e) {
      push("err", String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      exec();
    }
  }

  const hints = banner?.hints || [];
  const workflows = Object.keys(banner?.workflows || {});

  return (
    <section className="panel terminal-panel">
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">SOVEREIGN WEB TERMINAL · AGENT + PLATFORM</span>
          <h3>{banner?.product || "THESIS Terminal"}</h3>
          <p className="muted sm">
            Embedded command surface — <b>not bash</b>. Vault, ecosystem, daily briefs, tailored
            workflows, full PDF reports. Same tools the in-app agent uses.
          </p>
          <p className="muted sm doctrine-line">
            {banner?.doctrine || "Agents propose. Laws decide. Owner signs. Receipts remember."}
          </p>
        </div>
        <div className="win-actions">
          <button type="button" className="forge win-btn" disabled={disabled} onClick={() => exec("auto")}>
            AUTO LOOP
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={() => exec("workflow alpha")}>
            ALPHA WORKFLOW
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={genReport}>
            FULL PDF REPORT
          </button>
          <button type="button" className="ghost" onClick={() => onNavigate?.("ai")}>
            AI NODE
          </button>
        </div>
      </div>

      {err ? <div className="banner err">{err}</div> : null}

      <div className="chips tight" style={{ marginBottom: 10 }}>
        {["brief", "vault", "signals", "auto", "intel", "arena", "nomos", "report pdf", "help"].map((c) => (
          <button key={c} type="button" className="ghost" disabled={disabled} onClick={() => exec(c)}>
            {c}
          </button>
        ))}
        {workflows.map((w) => (
          <button
            key={w}
            type="button"
            className="ghost"
            disabled={disabled}
            onClick={() => exec(`workflow ${w}`)}
          >
            wf:{w}
          </button>
        ))}
      </div>

      <div className="grid2 terminal-layout">
        <article className="terminal-shell">
          <label>TERMINAL</label>
          <div className="terminal-screen" onClick={() => inputRef.current?.focus()}>
            {lines.map((ln, i) => (
              <div key={`${ln.ts}-${i}`} className={`term-line ${ln.kind}`}>
                {ln.text || "\u00a0"}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="terminal-input-row">
            <span className="term-prompt">mb&gt;</span>
            <input
              ref={inputRef}
              className="term-input"
              value={input}
              disabled={disabled}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="brief | morning | vault | auto | report pdf"
              autoComplete="off"
              spellCheck={false}
            />
            <MicButton
              label="STT"
              disabled={disabled}
              onPartial={(t) => setInput(t)}
              onText={(t) => {
                setInput(t);
                // auto-run common spoken commands
                const low = t.toLowerCase().trim();
                if (
                  ["brief", "morning", "auto", "signals", "help", "vault", "status"].some(
                    (c) => low === c || low.startsWith(c + " ")
                  ) ||
                  low.startsWith("workflow ") ||
                  low.startsWith("report ")
                ) {
                  setTimeout(() => exec(t), 50);
                }
              }}
            />
            <button type="button" className="forge" disabled={disabled || !input.trim()} onClick={() => exec()}>
              RUN
            </button>
          </div>
          <p className="muted sm">Mic = speech-to-text for commands only · briefs stay text (no TTS)</p>
          <p className="muted sm">
            {hints.join(" · ")} · system_shell=
            {String(banner?.system_shell)} · real_keys={String(banner?.real_keys)}
          </p>
        </article>

        <article>
          <label>VAULT · ECOSYSTEM · DOWNLOADS</label>
          <div className="kv">
            <span>Network</span>
            <b>{network}</b>
          </div>
          <div className="kv">
            <span>Sovereign</span>
            <span className="pill ok">true</span>
          </div>
          <p className="muted sm">
            Quick access mirrors agent tools: daily brief, vault gate, ecosystem catalog, company
            workflows, PDF full reports under <code>receipts/reports/</code>.
          </p>
          <label style={{ marginTop: 12 }}>GENERATED REPORTS</label>
          {!reports.length ? (
            <p className="muted sm">None yet — run <code>report pdf</code> or FULL PDF REPORT.</p>
          ) : (
            <div className="plans">
              {reports.slice(0, 12).map((r) => (
                <div key={r.name} className="plan yes">
                  <header>
                    <b>{r.kind}</b>
                    <a
                      className="link"
                      href={apiUrl(r.download)}
                      target="_blank"
                      rel="noreferrer"
                      download={r.name}
                    >
                      download
                    </a>
                  </header>
                  <p className="muted sm">
                    {r.name} · {(r.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ))}
            </div>
          )}
          <label style={{ marginTop: 14 }}>TAILORED WORKFLOWS</label>
          <ul className="muted sm">
            {Object.entries(banner?.workflows || {}).map(([id, w]) => (
              <li key={id}>
                <b>{id}</b> — {w.name}: {(w.steps || []).join(" → ")}
              </li>
            ))}
          </ul>
          <label style={{ marginTop: 12 }}>AGENT ACCESS</label>
          <p className="muted sm">
            {banner?.agent_access || "AI node uses the same command surface via terminal tools."}
          </p>
          <div className="chips tight">
            <button type="button" className="ghost" onClick={() => onNavigate?.("desk")}>
              DESK
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate?.("home")}>
              DAILY
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate?.("hq")}>
              HQ
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate?.("tools")}>
              TOOLS
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
