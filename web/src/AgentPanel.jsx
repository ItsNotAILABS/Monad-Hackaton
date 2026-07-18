import React, { useCallback, useEffect, useState } from "react";
import { MicButton } from "./MicButton.jsx";
import { runHybrid } from "./workers/hybrid.js";

/**
 * Long-horizon agent UI — delta attention, multi-device, self-evolve.
 * Text out · STT in for notes/commands · X marketing drafts.
 */
export function AgentPanel({ api, network, busy: parentBusy, onNavigate }) {
  const [status, setStatus] = useState(null);
  const [step, setStep] = useState(null);
  const [goal, setGoal] = useState("Operate Monad DeFi safely with daily seatbelt");
  const [note, setNote] = useState("");
  const [stt, setStt] = useState("");
  const [xDraft, setXDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [worker, setWorker] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await api("/agent"));
      setErr("");
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const disabled = busy || parentBusy;

  async function runStep() {
    setBusy(true);
    setErr("");
    try {
      // parallel browser worker residual score
      let w = null;
      try {
        w = await runHybrid("pulse", {
          goal: goal || note || stt,
          senses: { text: goal, note, stt, market: 1, law: 1 },
        });
        setWorker(w.result || w);
      } catch {
        /* optional */
      }
      const data = await api("/agent/step", {
        method: "POST",
        body: JSON.stringify({
          goal: goal || stt || note,
          network,
          note,
          stt,
          execute: true,
        }),
      });
      setStep(data);
      await refresh();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function draftX() {
    setBusy(true);
    setErr("");
    try {
      const d = await api("/x/from-actions", { method: "POST" });
      setXDraft(d);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel agent-panel">
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">LONG-HORIZON AGENT · DELTA ATTENTION · MULTI-DEVICE</span>
          <h3>New AI — residual, local, self-evolving</h3>
          <p className="muted sm">
            Delta attention only re-pays cost on changed senses. Fast decode + browser/node workers.
            Text replies · mic for notes/commands · no robot voice.
          </p>
          <p className="muted sm">
            Step <b>{status?.step ?? "—"}</b> · skills{" "}
            {status?.skills
              ? Object.entries(status.skills)
                  .slice(0, 3)
                  .map(([k, v]) => `${k}:${v}`)
                  .join(" · ")
              : "…"}
          </p>
        </div>
        <div className="win-actions">
          <button type="button" className="forge win-btn" disabled={disabled} onClick={runStep}>
            AGENT STEP →
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={draftX}>
            DRAFT X POST
          </button>
          <button type="button" className="ghost" onClick={() => onNavigate?.("builder")}>
            BUILDER
          </button>
        </div>
      </div>

      {err ? <div className="banner err">{err}</div> : null}

      <div className="grid2">
        <article>
          <label>GOAL · NOTES · STT</label>
          <input
            className="term-input"
            style={{ width: "100%", marginBottom: 8 }}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Horizon goal…"
          />
          <textarea
            className="term-input"
            style={{ width: "100%", minHeight: 80 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Working notes (type or dictate)…"
          />
          <div className="chips tight" style={{ marginTop: 8 }}>
            <MicButton
              label="STT note"
              disabled={disabled}
              continuous={false}
              onPartial={(t) => setStt(t)}
              onText={(t) => {
                setStt(t);
                setNote((n) => (n ? `${n} ${t}` : t));
                const low = t.toLowerCase();
                if (low.includes("agent step") || low.includes("think") || low.includes("run step")) {
                  setTimeout(runStep, 100);
                }
                if (low.includes("post") || low.includes("tweet") || low.includes("draft x")) {
                  setTimeout(draftX, 100);
                }
              }}
            />
            <MicButton
              label="STT command"
              disabled={disabled}
              onText={(t) => {
                setGoal(t);
                setTimeout(runStep, 100);
              }}
            />
          </div>
          {stt ? <p className="muted sm">last STT: {stt}</p> : null}
        </article>
        <article className="result">
          <label>LAST STEP (TEXT)</label>
          {!step ? (
            <p className="muted">Run AGENT STEP — multi-sense → delta attention → tools → evolve.</p>
          ) : (
            <>
              <div className="kv">
                <span>Intent</span>
                <b>{step.intent}</b>
              </div>
              <div className="kv">
                <span>Efficiency</span>
                <b>{(step.efficiency || {}).delta_gain}</b>
              </div>
              <div className="kv">
                <span>Decode ms</span>
                <b>{(step.fast_decode || {}).elapsed_ms}</b>
              </div>
              <pre className="code sm" style={{ maxHeight: 200, overflow: "auto" }}>
                {step.answer}
              </pre>
              <label>DEVICES</label>
              <ul className="muted sm">
                {(step.devices || []).map((d) => (
                  <li key={d.device}>
                    <b>{d.device}</b> — {d.role}
                  </li>
                ))}
              </ul>
              <label>SELF-EVOLVE</label>
              <pre className="code sm">{JSON.stringify(step.self_evolve?.changes || {}, null, 2)}</pre>
            </>
          )}
        </article>
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        <article>
          <label>BROWSER WORKER RESIDUAL</label>
          {!worker ? (
            <p className="muted sm">Runs with each step (off main thread).</p>
          ) : (
            <pre className="code sm" style={{ maxHeight: 180, overflow: "auto" }}>
              {JSON.stringify(
                {
                  delta: worker.delta_attention,
                  decode: worker.fast_decode,
                  arena: worker.arena,
                },
                null,
                2
              ).slice(0, 1200)}
            </pre>
          )}
        </article>
        <article>
          <label>X MARKETING (ECOSYSTEM + YOU)</label>
          <p className="muted sm">
            AI drafts posts about real actions. You publish via intent URL — sovereign marketing for
            Monad + your work.
          </p>
          {!xDraft ? (
            <button type="button" className="forge" disabled={disabled} onClick={draftX}>
              DRAFT FROM ACTIONS →
            </button>
          ) : (
            <>
              <p style={{ whiteSpace: "pre-wrap" }}>{xDraft.text}</p>
              <a className="link" href={xDraft.intent_url} target="_blank" rel="noreferrer">
                Open X intent →
              </a>
              <button
                type="button"
                className="ghost"
                style={{ marginLeft: 8 }}
                disabled={disabled}
                onClick={async () => {
                  await api("/x/mark-posted", {
                    method: "POST",
                    body: JSON.stringify({ draft_id: xDraft.id }),
                  });
                  setXDraft({ ...xDraft, status: "posted_by_user" });
                }}
              >
                Mark posted
              </button>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
