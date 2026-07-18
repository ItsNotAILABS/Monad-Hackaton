import React, { useCallback, useEffect, useState } from "react";
import { MicButton } from "./MicButton.jsx";

/**
 * MonadBuilder HQ — easy, AI-delivered daily seatbelt (TEXT brief only — no robot TTS).
 * Mic = speech-to-text for notes / "run my morning" commands.
 */
export function BuilderHome({ api, network, busy: parentBusy, onNavigate, onRunSystem, onRefreshHome }) {
  const [home, setHome] = useState(null);
  const [morning, setMorning] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [note, setNote] = useState("");
  const [sttPartial, setSttPartial] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await api(`/builder?network=${network}`);
      setHome(d);
      setErr("");
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, [api, network]);

  useEffect(() => {
    load();
  }, [load]);

  const disabled = busy || parentBusy;
  const brief = home?.brief || {};
  const stats = brief.stats || {};

  async function runMorning() {
    setBusy(true);
    setErr("");
    try {
      const m = await api("/builder/morning", {
        method: "POST",
        body: JSON.stringify({ network }),
      });
      setMorning(m);
      setToast(m.celebration || m.headline);
      setTimeout(() => setToast(""), 6000);
      await load();
      if (onRefreshHome) onRefreshHome();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function refreshBrief() {
    setBusy(true);
    try {
      const b = await api(`/builder/brief?network=${network}`);
      setHome((h) => ({ ...(h || {}), brief: b }));
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel builder-home">
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">MONADBUILDER HQ · AI DELIVERED · EASY</span>
          <h3>{home?.tagline || "AI delivers your Monad day"}</h3>
          <p className="muted sm">{home?.one_liner}</p>
          <p className="muted sm doctrine-line">
            {brief.brief_text || brief.ai_voice || "Loading your seatbelt…"}
          </p>
          <p className="muted sm">Text brief only · no robot voice · mic = speech-to-text for notes/commands</p>
        </div>
        <div className="win-actions">
          <button type="button" className="forge win-btn" disabled={disabled} onClick={runMorning}>
            ▶ AI MORNING (1 TAP)
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={refreshBrief}>
            REFRESH BRIEF
          </button>
          <MicButton
            label="Dictate"
            disabled={disabled}
            onPartial={setSttPartial}
            onText={(t) => {
              setSttPartial("");
              const low = t.toLowerCase();
              if (low.includes("morning") || low.includes("check in") || low.includes("start my day")) {
                runMorning();
                return;
              }
              setNote((n) => (n ? `${n} ${t}` : t));
            }}
          />
          <button type="button" className="ghost" onClick={() => onNavigate?.("ai")}>
            AI CHAT
          </button>
        </div>
      </div>

      {toast ? <div className="banner ok">{toast}</div> : null}
      {err ? <div className="banner err">{err}</div> : null}

      <div className="grid3" style={{ marginBottom: 12 }}>
        <article className="plan yes">
          <header>
            <b>LVL {stats.level ?? "—"}</b>
            <span className="pill ok">XP {stats.xp ?? 0}</span>
          </header>
          <p className="muted sm">Level up by tiny daily reps — not all-nighters.</p>
        </article>
        <article className="plan yes">
          <header>
            <b>🔥 Streak {stats.streak ?? 0}</b>
            <span className="pill warn">best {stats.best_streak ?? 0}</span>
          </header>
          <p className="muted sm">Addictive on purpose: protect capital, not doomscroll.</p>
        </article>
        <article className="plan">
          <header>
            <b>Mood · {brief.mood || "…"}</b>
          </header>
          <p className="muted sm">{brief.celebration}</p>
        </article>
      </div>

      <div className="grid2">
        <article className="result">
          <label>TODAY · AI ACTIONS</label>
          {(brief.actions || []).map((a) => (
            <div key={a.id} className="plan yes" style={{ marginBottom: 8 }}>
              <header>
                <b>{a.label}</b>
                <span className="pill ok">+{a.xp} XP</span>
              </header>
              <p className="muted sm">{a.why}</p>
            </div>
          ))}
          <p className="muted sm" style={{ marginTop: 8 }}>
            Type or dictate to AI: {(home?.ai_phrases || []).map((p) => `"${p}"`).join(" · ")}
          </p>
          <label style={{ marginTop: 10 }}>VOICE → TEXT NOTES (not brief playback)</label>
          {sttPartial ? <p className="muted sm">…{sttPartial}</p> : null}
          <textarea
            className="term-input"
            style={{ width: "100%", minHeight: 72, marginTop: 6 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Dictate or type operator notes…"
          />
        </article>
        <article>
          <label>WINNING UTILITIES (EASY)</label>
          <div className="plans">
            {(home?.utilities || []).map((u) => (
              <div key={u.id} className="plan">
                <header>
                  <b>{u.name}</b>
                  <span className="pill ok">{u.seconds}s</span>
                </header>
                <p className="muted sm">
                  AI: <code>{u.say_to_ai}</code> · {u.habit}
                </p>
              </div>
            ))}
          </div>
          {morning && (
            <>
              <label style={{ marginTop: 12 }}>LAST MORNING</label>
              <p className="muted sm">{morning.headline}</p>
              <ul className="muted sm">
                {(morning.steps || []).map((s) => (
                  <li key={s.id}>
                    {s.ok ? "✓" : "·"} {s.id}: {s.detail}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="chips tight" style={{ marginTop: 12 }}>
            <button type="button" className="ghost" onClick={() => onNavigate?.("term")}>
              TERM
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate?.("tools")}>
              TOOLS
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate?.("judge")}>
              PROOF
            </button>
            <button type="button" className="ghost" disabled={disabled} onClick={onRunSystem}>
              ▶ RUN SYSTEM
            </button>
          </div>
          <p className="muted sm" style={{ marginTop: 10 }}>
            {home?.brand?.name_note}
          </p>
        </article>
      </div>
    </section>
  );
}
