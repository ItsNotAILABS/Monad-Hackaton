import React, { useEffect, useState } from "react";

/**
 * 20 use cases — what judges/product asks mapped to real app actions.
 */
export function UseCases({ api, busy, onNavigate, onRunSystem, onAction }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await api("/use-cases");
        if (alive) setData(d);
      } catch (e) {
        if (alive) setErr(String(e.message || e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [api]);

  function go(uc) {
    const tab = (uc.tabs || [])[0];
    if (uc.id === 1 || uc.id === 3 || uc.id === 7) {
      if (onRunSystem) onRunSystem();
      return;
    }
    if (tab && onNavigate) onNavigate(tab);
    if (uc.id === 3 && onAction) onAction("desk_arena");
    if (uc.id === 7 && onAction) onAction("run_company");
    if (uc.id === 5 && onAction) onAction("connect_wallet", { kind: "metamask" });
  }

  const list = (data?.use_cases || []).filter((u) => {
    if (filter === "all") return true;
    if (filter === "demo") return (data?.demo_order || []).includes(u.id);
    if (filter === "monad") return (u.laws || []).some((l) => String(l).includes("monad"));
    if (filter === "ai")
      return (u.tabs || []).some((t) => ["local", "poly", "ai", "cloud"].includes(t));
    return true;
  });

  return (
    <section className="panel use-cases">
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">
            {data?.hackathon?.name || "SPARK"} · 20 USE CASES
          </span>
          <h3>What they asked for — runnable in this app</h3>
          <p className="muted sm">{data?.hackathon?.prompt}</p>
          <p className="muted sm">
            {(data?.how_to_use_in_app || []).join(" · ")}
          </p>
        </div>
        <div className="win-actions">
          <button type="button" className="forge win-btn" disabled={busy} onClick={onRunSystem}>
            ▶ RUN SYSTEM
          </button>
          <button type="button" className="ghost" onClick={() => onNavigate?.("judge")}>
            PROOF
          </button>
        </div>
      </div>

      {err ? <div className="banner err">{err}</div> : null}

      <div className="chips tight" style={{ margin: "0 12px 10px" }}>
        {[
          ["all", "All 20"],
          ["demo", "Demo 10"],
          ["monad", "Monad gas/chain"],
          ["ai", "AI / polyglot"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`ghost ${filter === id ? "on" : ""}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="uc-grid">
        {list.map((uc) => (
          <article key={uc.id} className="result uc-card">
            <span className="eyebrow">
              #{uc.id} · {(uc.tabs || []).join(" · ")}
            </span>
            <h3 style={{ margin: "6px 0", fontSize: "1.05rem" }}>{uc.title}</h3>
            <p className="muted sm">
              <b>Ask:</b> {uc.ask}
            </p>
            <p className="muted sm">
              <b>Who:</b> {uc.who}
            </p>
            <p className="muted sm">
              <b>Pain:</b> {uc.pain}
            </p>
            <p className="why-now">
              <b>Do:</b> {uc.do}
            </p>
            <div className="caps">
              {(uc.laws || []).slice(0, 4).map((l) => (
                <span key={l} className="badge on">
                  {l}
                </span>
              ))}
            </div>
            <div className="chips tight" style={{ marginTop: 8 }}>
              <button type="button" className="ghost" disabled={busy} onClick={() => go(uc)}>
                Open in app
              </button>
              {(uc.tabs || []).slice(0, 3).map((t) => (
                <button key={t} type="button" className="ghost" onClick={() => onNavigate?.(t)}>
                  {t}
                </button>
              ))}
            </div>
            <p className="muted sm mono" style={{ marginTop: 6, fontSize: 10 }}>
              {(uc.api || []).join(" · ")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
