import React, { useCallback, useEffect, useState } from "react";
import * as Local from "./index.js";

/**
 * PLATFORM app: browser-local AI
 * Transformers.js · memory · security · knowledge graph · research · docs
 */
export function LocalAI({ api, network, busy: parentBusy, onNavigate }) {
  const [manifest, setManifest] = useState(null);
  const [inf, setInf] = useState(Local.inferenceStatus());
  const [mem, setMem] = useState(null);
  const [graph, setGraph] = useState(null);
  const [sec, setSec] = useState(null);
  const [note, setNote] = useState("");
  const [query, setQuery] = useState(
    "Monad gas limits, desk rejects, and how vault route stays signature-gated"
  );
  const [research, setResearch] = useState(null);
  const [docs, setDocs] = useState([]);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [log, setLog] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const m = await Local.localAiManifest();
      setManifest(m);
      setInf(Local.inferenceStatus());
      setMem(m.engines.memory);
      setGraph(m.engines.knowledge_graph);
      setSec(m.engines.security);
      setNotes(await Local.listNotes({ limit: 12 }));
      setEvents(await Local.listEvents({ limit: 12 }));
      setDocs(await Local.listDocs({ limit: 12 }));
      setNodes(Local.searchNodes("", { limit: 16 }));
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function flash(msg) {
    setLog(msg);
    setTimeout(() => setLog(""), 4000);
  }

  async function loadModel() {
    setBusy(true);
    setErr("");
    try {
      await Local.ensureEmbedder({
        onProgress: () => setInf(Local.inferenceStatus()),
      });
      setInf(Local.inferenceStatus());
      flash("Transformers.js model ready (browser cache)");
      await refresh();
    } catch (e) {
      setErr(String(e.message || e));
      setInf(Local.inferenceStatus());
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    setBusy(true);
    setErr("");
    try {
      Local.assertSafe(note);
      const emb = await Local.embedSafe(note);
      await Local.remember(note, { kind: "note", embedding: emb, source: "user" });
      await Local.ingestText(note, { source: "user-note" });
      setNote("");
      flash("Remembered locally + graph ingest");
      await refresh();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function runResearch() {
    setBusy(true);
    setErr("");
    try {
      Local.assertSafe(query);
      // Pull platform pulse for agents (public state only)
      let pulse = {};
      try {
        const plat = await api(`/platform?network=${network}`);
        pulse = {
          version: plat.version,
          laws: plat.pulse?.laws,
          wallets: plat.pulse?.wallets,
          desk_equity: plat.pulse?.desk_equity,
          venues: Object.entries(plat.pulse?.marks || {}).map(([k]) => ({ id: k, name: k })),
          apps: (plat.apps?.first_party || []).map((a) => ({ id: a.id, name: a.name })),
        };
        // enrich venues from desk if available
        try {
          const desk = await api("/desk");
          pulse.venues = (desk.venues || []).map((v) => ({ id: v.id, name: v.name }));
          pulse.desk_equity = desk.equity;
        } catch {
          /* optional */
        }
      } catch {
        /* offline shell still works */
      }

      const run = await Local.runResearch(query, pulse);
      setResearch(run);
      if (run.document_id) {
        const all = await Local.listDocs({ limit: 20 });
        setDocs(all);
        setSelectedDoc(all.find((d) => d.id === run.document_id) || all[0]);
      }
      flash(`Research complete · ${(run.elapsed_ms || 0).toFixed(0)}ms · local only`);
      await refresh();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function runSecurityAudit() {
    setBusy(true);
    setErr("");
    try {
      const audit = await Local.auditMemory();
      const dash = await Local.securityDashboard();
      const doc = await Local.generateSecurityBrief(dash, audit);
      setSelectedDoc(doc);
      flash(`Security audit · ${audit.findings?.length || 0} findings · brief saved`);
      await refresh();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function hydrateGraph() {
    setBusy(true);
    try {
      let facts = {};
      try {
        const plat = await api(`/platform?network=${network}`);
        facts = {
          version: plat.version,
          laws: plat.pulse?.laws,
          wallets: plat.pulse?.wallets,
          desk_equity: plat.pulse?.desk_equity,
          apps: (plat.apps?.first_party || []).slice(0, 12),
        };
        const desk = await api("/desk");
        facts.venues = desk.venues || [];
        facts.desk_equity = desk.equity;
      } catch {
        /* ok */
      }
      const st = await Local.hydrateFromPlatform(facts);
      const doc = await Local.generateKnowledgeMap(st, Local.searchNodes("", { limit: 30 }));
      setSelectedDoc(doc);
      flash(`KG hydrated · ${st.nodes} nodes · ${st.edges} edges`);
      await refresh();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function genOpsDoc() {
    setBusy(true);
    try {
      const plat = await api(`/platform?network=${network}`);
      const doc = await Local.generatePlatformOpsDoc(plat);
      setSelectedDoc(doc);
      flash("Platform ops document saved locally");
      await refresh();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || parentBusy;

  return (
    <section className="panel local-ai">
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">BROWSER-LOCAL AI · TRANSFORMERS.JS</span>
          <h3>Inference, memory, security, knowledge graph, research agents, documents</h3>
          <p className="muted sm">
            Everything on this tab stays on-device. No cloud LLM. Platform pulse is optional public
            state only — never keys.
          </p>
          <p className="muted sm">
            Model: <code>{inf.model}</code> · state <b>{inf.state}</b>
            {inf.state === "loading" ? ` · ${inf.progress}%` : ""} · memory notes{" "}
            <b>{mem?.notes ?? 0}</b> · graph <b>{graph?.nodes ?? 0}</b>n/{graph?.edges ?? 0}e ·
            security <b>{sec?.posture || "—"}</b>
          </p>
        </div>
        <div className="win-actions">
          <button type="button" className="forge win-btn" disabled={disabled} onClick={loadModel}>
            {inf.ready ? "Model ready ✓" : "Load local model"}
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={runSecurityAudit}>
            Security audit
          </button>
          <button type="button" className="ghost" onClick={() => onNavigate?.("live")}>
            Platform shell
          </button>
        </div>
      </div>

      {err ? <div className="banner err">{err}</div> : null}
      {log ? <div className="banner ok">{log}</div> : null}

      <div className="primitive-row local-caps">
        {[
          ["Inference", inf.ready ? "ready" : inf.state, inf.ready],
          ["Memory", `${mem?.notes ?? 0} notes`, true],
          ["Security", sec?.posture || "—", sec?.posture === "calm"],
          ["Knowledge graph", `${graph?.nodes ?? 0} nodes`, true],
          ["Agents", `${(manifest?.engines?.agents || []).length} roles`, true],
          ["Documents", `${mem?.docs ?? docs.length} docs`, true],
        ].map(([name, metric, ok]) => (
          <div key={name} className={`primitive-card ${ok ? "ok" : "warn"}`}>
            <span className="eyebrow">local</span>
            <b>{name}</b>
            <span className="muted sm">{metric}</span>
          </div>
        ))}
      </div>

      <div className="grid3">
        <article className="result">
          <label>LOCAL MEMORY</label>
          <p className="muted sm">IndexedDB · embeddings attached when model is ready</p>
          <textarea
            className="local-textarea"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note to remember (never paste keys/seeds)…"
          />
          <div className="chips tight">
            <button type="button" className="ghost" disabled={disabled || !note.trim()} onClick={saveNote}>
              Remember
            </button>
            <button type="button" className="ghost" disabled={disabled} onClick={refresh}>
              Refresh
            </button>
          </div>
          <label>Recent notes</label>
          {notes.length === 0 ? (
            <p className="muted sm">Empty — remember platform insights here.</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="proto">
                <b className="muted sm">
                  {n.kind} · {new Date(n.ts).toLocaleString()}
                </b>
                <p className="muted sm">{(n.text || "").slice(0, 180)}</p>
              </div>
            ))
          )}
        </article>

        <article className="result">
          <label>AUTONOMOUS RESEARCH AGENTS</label>
          <p className="muted sm">Scout → Risk → Synthesizer · local embeddings + graph</p>
          {(manifest?.engines?.agents || Local.listAgents()).map((a) => (
            <div key={a.id} className="proto">
              <b>
                {a.name} · {a.id}
              </b>
              <p className="muted sm">{a.role}</p>
            </div>
          ))}
          <textarea
            className="local-textarea"
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Research question…"
          />
          <button type="button" className="forge" disabled={disabled || !query.trim()} onClick={runResearch}>
            Run research loop
          </button>
          {research && (
            <div className="proto featured">
              <span className="eyebrow">LAST RUN · {(research.elapsed_ms || 0).toFixed(0)}ms</span>
              <b>{research.summary}</b>
              <ul className="pillars">
                {(research.synth?.insights || []).slice(0, 5).map((i) => (
                  <li key={i.title}>
                    <b>{i.title}</b> — {i.body}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>

        <article className="result">
          <label>SECURITY MONITOR</label>
          <p className="muted sm">{sec?.doctrine}</p>
          <div className="kv">
            <span>Posture</span>
            <b className={sec?.posture === "calm" ? "up" : "down"}>{sec?.posture || "—"}</b>
          </div>
          <div className="kv">
            <span>Alerts</span>
            <b>{sec?.alerts ?? 0}</b>
          </div>
          <div className="kv">
            <span>Critical runs</span>
            <b>{sec?.criticalRuns ?? 0}</b>
          </div>
          <button type="button" className="ghost" disabled={disabled} onClick={runSecurityAudit}>
            Audit memory + generate brief
          </button>
          <label>Events</label>
          {events.slice(0, 8).map((e) => (
            <div key={e.id} className="proto">
              <b className="muted sm">{e.kind}</b>
              <p className="muted sm">{e.text || e.detail?.message}</p>
            </div>
          ))}
        </article>
      </div>

      <div className="grid2 tight" style={{ margin: "12px" }}>
        <article className="result">
          <label>KNOWLEDGE GRAPH</label>
          <p className="muted sm">
            {graph?.nodes ?? 0} nodes · {graph?.edges ?? 0} edges · browser localStorage + memory
            links
          </p>
          <div className="chips tight">
            <button type="button" className="ghost" disabled={disabled} onClick={hydrateGraph}>
              Hydrate from platform
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                Local.clearGraph();
                flash("Graph cleared");
                refresh();
              }}
            >
              Clear graph
            </button>
          </div>
          <div className="kg-nodes">
            {nodes.map((n) => (
              <span key={n.id} className="badge on" title={n.id}>
                {n.type}:{n.label?.slice?.(0, 24) || n.id}
              </span>
            ))}
          </div>
        </article>

        <article className="result">
          <label>DOCUMENT GENERATION</label>
          <p className="muted sm">Markdown reports saved to IndexedDB — download any time</p>
          <div className="chips tight">
            <button type="button" className="ghost" disabled={disabled} onClick={genOpsDoc}>
              Platform ops doc
            </button>
            <button type="button" className="ghost" disabled={disabled} onClick={hydrateGraph}>
              Knowledge map doc
            </button>
          </div>
          <label>Saved docs</label>
          {docs.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`proto project-btn ${selectedDoc?.id === d.id ? "yes" : ""}`}
              onClick={() => setSelectedDoc(d)}
            >
              <b>{d.title}</b>
              <span className="muted sm">{new Date(d.ts).toLocaleString()}</span>
            </button>
          ))}
          {selectedDoc && (
            <>
              <div className="chips tight">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => Local.downloadMarkdown(selectedDoc)}
                >
                  Download .md
                </button>
              </div>
              <pre className="code sm doc-preview">{selectedDoc.text?.slice(0, 4000)}</pre>
            </>
          )}
        </article>
      </div>

      <article className="result" style={{ margin: "0 12px 12px" }}>
        <label>DOCTRINE</label>
        <ul className="pillars">
          {(manifest?.doctrine || []).map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
