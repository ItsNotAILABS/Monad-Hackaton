import React, { useEffect, useState } from "react";

/**
 * Live command-center landing:
 * constant market board + AI daily brief + laws explained as they fire.
 */
export function Landing({ api, network, onNavigate, onRunCompany, busy }) {
  const [feed, setFeed] = useState(null);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await api(`/landing?network=${network}`);
        if (alive) {
          setFeed(data);
          setErr("");
          setFlash(true);
          setTimeout(() => setFlash(false), 280);
        }
      } catch (e) {
        if (alive) setErr(String(e.message || e));
      }
    };
    load();
    const poll = feed?.poll_ms_hint || 3500;
    const id = setInterval(() => {
      load();
      setTick((t) => t + 1);
    }, poll);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [api, network, feed?.poll_ms_hint]);

  if (err && !feed) {
    return (
      <section className="panel">
        <div className="banner err">{err}</div>
      </section>
    );
  }

  if (!feed) {
    return (
      <section className="panel">
        <p className="muted">Lighting up the live board…</p>
      </section>
    );
  }

  const teach = feed.teaching_now || {};
  const brief = feed.ai_brief || {};
  const market = feed.market_panel || {};
  const lawStack = feed.law_stack || {};
  const pillars = feed.pillars || {};
  const enforce = feed.enforcement_demo || {};
  const marks = market.marks || {};

  return (
    <section className={`panel landing-live ${flash ? "pulse-update" : ""}`}>
      <div className="live-bar">
        <span className="live-dot" />
        <b>LIVE</b>
        <span className="muted sm">
          {feed.headline} · poll #{tick} · {(feed.elapsed_ms || 0).toFixed(0)}ms
        </span>
        <span className="badge on">{lawStack.law_count || 0} laws embedded</span>
        <span className="muted sm">
          THESIS consults {enforce.laws_consulted ?? "—"} · ok=
          {String(enforce.ok ?? "—")}
        </span>
        <a
          className="link sm"
          href={feed.docs?.best_practices}
          target="_blank"
          rel="noreferrer"
        >
          docs.monad.xyz/best-practices
        </a>
      </div>

      <div className="ticker-wrap">
        <div className="ticker" key={`t-${tick}`}>
          {(feed.ticker || []).map((t) => (
            <span key={t.symbol} className={`tick ${t.side}`}>
              <em>{t.symbol}</em>{" "}
              {typeof t.price === "number"
                ? t.price.toLocaleString(undefined, { maximumFractionDigits: 4 })
                : t.price}{" "}
              <small>
                {t.change_pct >= 0 ? "+" : ""}
                {Number(t.change_pct).toFixed(2)}%
              </small>
            </span>
          ))}
          {(feed.ticker || []).map((t) => (
            <span key={`${t.symbol}-2`} className={`tick ${t.side}`}>
              <em>{t.symbol}</em>{" "}
              {typeof t.price === "number"
                ? t.price.toLocaleString(undefined, { maximumFractionDigits: 4 })
                : t.price}
            </span>
          ))}
        </div>
      </div>

      <div className="hero-card land-hero">
        <div>
          <span className="eyebrow">MONAD DEFI COMPANY · COMMAND CENTER</span>
          <h2>{feed.tagline}</h2>
          <p className="muted">{brief.narrative || brief.coach_headline}</p>
          <div className="chips">
            <button type="button" className="forge" disabled={busy} onClick={onRunCompany}>
              STAFF THE COMPANY →
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate("desk")}>
              Desk arena
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate("ai")}>
              AI node
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate("hq")}>
              Full HQ
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate("academy")}>
              Academy
            </button>
          </div>
        </div>
        <div className="hero-side market-board">
          <div className="kv">
            <span>Desk equity</span>
            <b>{Number(market.desk_equity || 0).toFixed(2)}</b>
          </div>
          <div className="kv">
            <span>Cash</span>
            <b>{Number(market.desk_cash || 0).toFixed(2)}</b>
          </div>
          <div className="kv">
            <span>Day PnL</span>
            <b className={Number(market.day_pnl || 0) >= 0 ? "up" : "down"}>
              {Number(market.day_pnl || 0) >= 0 ? "+" : ""}
              {Number(market.day_pnl || 0).toFixed(2)}
            </b>
          </div>
          {Object.entries(marks)
            .slice(0, 4)
            .map(([sym, px]) => (
              <div className="kv" key={sym}>
                <span>{sym}</span>
                <b className="mono">{Number(px).toFixed(4)}</b>
              </div>
            ))}
          <div className="kv">
            <span>Gas limit demo</span>
            <b className="mono muted sm">
              {market.gas_demo?.estimated_gas}→{market.gas_demo?.recommended_gas_limit}
            </b>
          </div>
        </div>
      </div>

      <div className="pillar-row">
        {["safety", "governance", "execution", "intelligence"].map((p) => (
          <div key={p} className="pillar-card">
            <span className="eyebrow">{p}</span>
            <b>{pillars[p]?.count ?? lawStack.pillars?.[p] ?? 0}</b>
            <span className="muted sm">laws on</span>
            {(pillars[p]?.sample || []).slice(0, 1).map((l) => (
              <div key={l.id} className="law-chip mini">
                <em>{l.id}</em>
                <span>{l.as_used || l.rule}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="grid3">
        <article className="result">
          <label>AI DAILY BRIEF ANALYSIS</label>
          <p className="cert" style={{ fontSize: "1rem" }}>
            {brief.coach_headline || "Company online"}
          </p>
          <p className="muted sm">{brief.pitch}</p>
          <ul className="pillars">
            {(brief.bullets || []).map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {brief.gas_tip && (
            <div className="proto">
              <b>Gas tip · {brief.gas_tip.title}</b>
              <p className="muted sm">{brief.gas_tip.body}</p>
            </div>
          )}
          <label>Coach tips</label>
          {(brief.tips || []).map((t, i) => (
            <div key={i} className="proto">
              <b>
                {t.kind || "tip"}: {t.title}
              </b>
              <p className="muted sm">{t.body}</p>
            </div>
          ))}
          <p className="muted sm law-note">
            Brief is governed by <em>intel.teach-on-action</em> +{" "}
            <em>intel.no-hallucinated-apy</em> — no invented yields.
          </p>
        </article>

        <article>
          <label>
            TEACHING AS YOU OPERATE · rotates every {teach.rotation_seconds || 20}s
          </label>
          <div className="proto featured">
            <span className="eyebrow">BEST PRACTICE · MONAD DOCS</span>
            <b>{teach.best_practice?.title}</b>
            <p className="muted sm">{teach.best_practice?.body}</p>
            {teach.best_practice?.why_now && (
              <p className="why-now">
                <b>Why now:</b> {teach.best_practice.why_now}
              </p>
            )}
            <p className="muted sm">
              <b>Do:</b> {teach.best_practice?.do}
            </p>
            {(teach.best_practice?.laws_explained || []).map((l) => (
              <div key={l.id} className="law-chip on">
                <em>{l.id}</em>
                <span>{l.as_used || l.rule}</span>
              </div>
            ))}
            {teach.best_practice?.docs && (
              <a
                className="link"
                href={teach.best_practice.docs}
                target="_blank"
                rel="noreferrer"
              >
                docs.monad.xyz best practices →
              </a>
            )}
            {teach.next_best_practice && (
              <p className="muted sm up-next">Next up: {teach.next_best_practice}</p>
            )}
          </div>
          <div className="proto">
            <span className="eyebrow">COOL MOVE</span>
            <b>{teach.cool_move?.title}</b>
            <p className="muted sm">{teach.cool_move?.body}</p>
            {teach.cool_move?.teach && (
              <p className="why-now">
                <b>As used:</b> {teach.cool_move.teach}
              </p>
            )}
            {(teach.cool_move?.laws_explained || []).map((l) => (
              <div key={l.id} className="law-chip">
                <em>{l.id}</em>
                <span>{l.as_used || l.rule}</span>
              </div>
            ))}
            <button
              type="button"
              className="ghost"
              onClick={() => onNavigate(teach.cool_move?.href || "hq")}
            >
              {teach.cool_move?.cta || "Go"}
            </button>
          </div>
        </article>

        <article className="result">
          <label>LIVE STREAM · LAWS AS USED</label>
          <div className="stream">
            {(feed.stream || []).map((s, i) => (
              <div key={`${s.kind}-${i}-${tick % 3}`} className={`stream-item kind-${s.kind}`}>
                <header>
                  <b>{s.kind}</b>
                </header>
                <p>{s.text}</p>
                {s.explain && <p className="muted sm">{s.explain}</p>}
                {s.why_now && (
                  <p className="why-now">
                    <b>Why now:</b> {s.why_now}
                  </p>
                )}
                {s.teach && (
                  <p className="why-now">
                    <b>As used:</b> {s.teach}
                  </p>
                )}
                {(s.laws || []).map((l) => (
                  <div key={`${l.id}-${i}`} className="law-chip">
                    <em>{l.id}</em>
                    <span>{l.as_used || l.rule}</span>
                  </div>
                ))}
                {s.do && (
                  <p className="muted sm">
                    <b>Do:</b> {s.do}
                  </p>
                )}
                {s.docs && (
                  <a className="link sm" href={s.docs} target="_blank" rel="noreferrer">
                    source docs →
                  </a>
                )}
                {s.cta && (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => onNavigate(s.href || "hq")}
                  >
                    {s.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
          <label>ALWAYS-ON ECOSYSTEM LAWS</label>
          {(teach.active_laws || []).map((l) => (
            <div key={l.id} className="law-chip on">
              <em>{l.id}</em>
              <span>{l.as_used || l.rule}</span>
            </div>
          ))}
          <label>VENUES</label>
          <div className="caps">
            {(market.venues || []).map((v) => (
              <span key={v.id} className="badge on">
                {v.name}
              </span>
            ))}
          </div>
          <p className="muted sm law-note">{lawStack.doctrine}</p>
        </article>
      </div>
    </section>
  );
}
