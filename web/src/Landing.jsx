import React, { useEffect, useState, useCallback } from "react";

/**
 * Platform shell — primitives + installed apps + live market.
 * Polls /landing (platform feed) and dispatches real app actions.
 */
export function Landing({
  api,
  network,
  busy,
  onNavigate,
  onAction,
  winPath,
  systemRun,
}) {
  const [feed, setFeed] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);
  const [flash, setFlash] = useState(false);
  const [invokeLog, setInvokeLog] = useState(null);

  const load = useCallback(async () => {
    try {
      const [data, plat] = await Promise.all([
        api(`/landing?network=${network}`),
        api(`/platform?network=${network}`),
      ]);
      setFeed(data);
      setPlatform(plat);
      setErr("");
      setFlash(true);
      setTimeout(() => setFlash(false), 280);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, [api, network]);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (!alive) return;
      await load();
      if (alive) setTick((t) => t + 1);
    };
    poll();
    const id = setInterval(poll, feed?.poll_ms_hint || 4000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [load, feed?.poll_ms_hint]);

  function act(action, payload = {}) {
    if (onAction) onAction(action, payload);
  }

  function goModule(m) {
    if (m?.action) {
      act(m.action, { module: m.id, href: m.tab });
    } else if (m?.tab) {
      onNavigate(m.tab);
    }
  }

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
        <p className="muted">Booting platform kernel…</p>
      </section>
    );
  }

  const teach = feed.teaching_now || {};
  const brief = feed.ai_brief || {};
  const market = feed.market_panel || {};
  const lawStack = feed.law_stack || {};
  const pillars = feed.pillars || {};
  const enforce = feed.enforcement_demo || {};
  const apps = feed.apps || {};
  const modules = apps.modules || [];
  const wallets = apps.wallets || {};
  const vault = apps.vault || {};
  const desk = apps.desk || {};
  const ai = apps.ai || {};
  const daily = apps.daily || {};
  const projects = apps.projects || {};
  const marks = market.marks || {};
  const route = vault.latest_route || null;
  const plat = platform || feed.platform || {};
  const win = winPath || null;
  const system = systemRun || null;
  const sys = plat.system || feed.platform?.system || {};
  const platApps = plat.apps || {};
  const firstParty = platApps.first_party || [];
  const forged = platApps.forged || [];

  async function invokePlatform(appId, action, params = {}) {
    // Prefer parent handlers for full app state sync (usable end-to-end)
    if (appId === "app.company" && action === "run") {
      act("run_company");
      return;
    }
    if (appId === "app.desk" && action === "arena") {
      act("desk_arena");
      return;
    }
    if (appId === "app.cloud" || (appId === "app.shell" && (action === "run" || action === "system"))) {
      act("run_system");
      return;
    }
    try {
      const out = await api(`/platform/apps/${encodeURIComponent(appId)}/invoke`, {
        method: "POST",
        body: JSON.stringify({ action, network, params }),
      });
      setInvokeLog(out);
      return out;
    } catch (e) {
      setInvokeLog({ ok: false, error: String(e.message || e) });
    }
  }

  return (
    <section className={`panel landing-live ${flash ? "pulse-update" : ""}`}>
      <div className="live-bar">
        <span className="live-dot" />
        <b>PLATFORM</b>
        <span className="muted sm">
          {feed.headline} · #{tick} · {(feed.elapsed_ms || 0).toFixed(0)}ms
        </span>
        <span className="badge on">{lawStack.law_count || 0} laws</span>
        <span className={`badge ${wallets.linked ? "on" : "warn"}`}>
          {wallets.linked || 0} wallets
        </span>
        <span className={`badge ${vault.deployed ? "on" : "warn"}`}>
          vault {vault.deployed ? "set" : "—"}
        </span>
        <span className="badge on">
          {(platApps.total ?? projects.count) || 0} apps
        </span>
        <span className={`badge ${plat.kernel?.ok ? "on" : "warn"}`}>
          kernel {plat.kernel?.primitives_ok}/{plat.kernel?.primitives_total}
        </span>
        <span className="muted sm">
          laws consult {enforce.laws_consulted ?? "—"} · ok={String(enforce.ok ?? "—")}
        </span>
      </div>

      {/* Platform kernel strip */}
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">THESIS PLATFORM · ONE SYSTEM</span>
          <h3>{plat.what_this_is || feed.tagline}</h3>
          <p className="muted sm">{plat.doctrine || lawStack.doctrine}</p>
          <p className="muted sm">
            <b>{platApps.first_party_count ?? firstParty.length}</b> apps ·{" "}
            <b>{plat.pulse?.laws ?? lawStack.law_count ?? sys.laws}</b> laws · wallets{" "}
            <b>{sys.wallets_linked ?? wallets.linked ?? 0}</b> · vault{" "}
            <b className="mono sm">{sys.vault ? `${String(sys.vault).slice(0, 10)}…` : "—"}</b> · packages{" "}
            <b>{sys.projects ?? projects.count ?? 0}</b>
          </p>
        </div>
        <div className="win-actions">
          <button
            type="button"
            className="forge win-btn"
            disabled={busy}
            onClick={() => act("run_system")}
          >
            ▶ RUN SYSTEM
          </button>
          <button type="button" className="ghost" disabled={busy} onClick={() => onNavigate("cloud")}>
            Cloud
          </button>
          <button type="button" className="ghost" disabled={busy} onClick={() => onNavigate("poly")}>
            Polyglot
          </button>
          <button type="button" className="ghost" disabled={busy} onClick={() => onNavigate("local")}>
            Local AI
          </button>
        </div>
      </div>

      {system && (
        <div className="win-result">
          <div className="win-result-head">
            <span className="live-dot" />
            <b>{system.headline || "SYSTEM RUN"}</b>
            <span className={`badge ${system.ok ? "on" : "warn"}`}>{system.ok ? "OK" : "ISSUES"}</span>
            <span className="muted sm">{(system.elapsed_ms || 0).toFixed?.(0) ?? system.elapsed_ms}ms</span>
          </div>
          <p className="muted sm">{system.on_chain_story}</p>
          <div className="win-proof-grid">
            <div className="kv">
              <span>Desk reject</span>
              <b className="up">{system.desk_arena?.n_rejected ?? "—"}</b>
            </div>
            <div className="kv">
              <span>Accepted</span>
              <b>{system.desk_arena?.n_accepted ?? "—"}</b>
            </div>
            <div className="kv">
              <span>Company</span>
              <b>{system.company?.status || "—"}</b>
            </div>
            <div className="kv">
              <span>Vault route</span>
              <b>
                {system.vault_route?.would_execute === true
                  ? "WOULD"
                  : system.vault_route?.skipped
                    ? "skip"
                    : "blocked/sim"}
              </b>
            </div>
          </div>
          <div className="caps" style={{ marginTop: 8 }}>
            {(system.steps || []).map((s) => (
              <span key={s.step} className={`badge ${s.ok ? "on" : "warn"}`}>
                {s.step} {s.ok ? "✓" : "✗"}
              </span>
            ))}
          </div>
          {system.vault_route?.narrative && (
            <p className="muted sm" style={{ marginTop: 8 }}>
              Vault: {system.vault_route.narrative}
            </p>
          )}
          {system.brief?.narrative && (
            <p className="muted sm">{system.brief.narrative}</p>
          )}
          {system.polyglot?.synthesis && (
            <div className="proto" style={{ marginTop: 8 }}>
              <span className="eyebrow">POLYGLOT</span>
              <b>
                {system.polyglot.synthesis.winner_agent || "mesh"} · gas{" "}
                {system.polyglot.synthesis.recommended_gas_limit ?? "—"} · VaR{" "}
                {Number(system.polyglot.synthesis.var || 0).toFixed(1)}
              </b>
            </div>
          )}
          <div className="chips tight">
            {(system.next || []).map((n) => (
              <button key={n.tab} type="button" className="ghost" onClick={() => onNavigate(n.tab)}>
                {n.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Primitives row */}
      <div className="primitive-row">
        {(plat.primitives || []).map((p) => (
          <div key={p.id} className={`primitive-card ${p.ok || (p.status && p.status.ok) ? "ok" : "warn"}`}>
            <span className="eyebrow">{p.id || p.name}</span>
            <b>{p.name}</b>
            <span className="muted sm">{p.role}</span>
            <span className={`dot-inline ${(p.ok ?? p.status?.ok) ? "on" : "off"}`}>
              {(p.ok ?? p.status?.ok) ? "online" : "check"}
            </span>
          </div>
        ))}
      </div>

      {/* First-party apps from platform registry */}
      {(firstParty.length > 0 || forged.length > 0) && (
        <div className="registry-block">
          <label className="reg-label">APP REGISTRY · FIRST-PARTY</label>
          <div className="app-modules registry">
            {firstParty.map((a) => (
              <button
                key={a.id}
                type="button"
                className="app-mod status-live"
                disabled={busy}
                onClick={() => {
                  if (a.tab) onNavigate(a.tab);
                  else if (a.actions?.[0]) invokePlatform(a.id, a.actions[0]);
                }}
              >
                <span className="eyebrow">{a.kind}</span>
                <b>{a.name}</b>
                <span className="metric">{a.id}</span>
                <span className="muted sm detail">{a.description}</span>
                <span className="cta-line">open · {a.entry}</span>
              </button>
            ))}
          </div>
          {forged.length > 0 && (
            <>
              <label className="reg-label">INSTALLED PACKAGES · FORGED</label>
              <div className="app-modules registry forged-row">
                {forged.slice(0, 8).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="app-mod status-live"
                    disabled={busy}
                    onClick={() => act("open_project", { projectId: a.project_id })}
                  >
                    <span className="eyebrow">pkg</span>
                    <b>{a.name}</b>
                    <span className="metric">{a.meta?.n_files || "?"} files</span>
                    <span className="cta-line">open in IDE</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {invokeLog && (
        <div className={`win-result ${invokeLog.ok ? "" : "err-ish"}`}>
          <div className="win-result-head">
            <span className="live-dot" />
            <b>
              INVOKE · {invokeLog.app_id}.{invokeLog.action}
            </b>
            <span className={`badge ${invokeLog.ok ? "on" : "warn"}`}>
              {invokeLog.ok ? "OK" : "FAIL"}
            </span>
            <span className="muted sm">
              {(invokeLog.elapsed_ms || 0).toFixed?.(0) ?? invokeLog.elapsed_ms}ms · laws{" "}
              {invokeLog.law?.laws_consulted ?? "—"}
            </span>
            <button type="button" className="ghost" onClick={() => setInvokeLog(null)}>
              dismiss
            </button>
          </div>
          {invokeLog.error && <p className="muted sm">{invokeLog.error}</p>}
          {invokeLog.result?.n_rejected != null && (
            <p className="muted sm">
              Arena: accept {invokeLog.result.n_accepted} · reject {invokeLog.result.n_rejected}
            </p>
          )}
          {invokeLog.result?.answer && (
            <p className="muted sm">{String(invokeLog.result.answer).slice(0, 280)}</p>
          )}
        </div>
      )}

      {win && (
        <div className="win-result">
          <div className="win-result-head">
            <span className="live-dot" />
            <b>SYSTEM CHECK · {win.headline || "proof"}</b>
            <span className="badge on">
              {win.proof?.scorecard_grade} {win.proof?.scorecard_pct}%
            </span>
          </div>
          <div className="win-proof-grid">
            <div className="kv">
              <span>Desk rejects</span>
              <b className="up">{win.desk_arena?.n_rejected ?? 0}</b>
            </div>
            <div className="kv">
              <span>Laws</span>
              <b>{win.proof?.laws_embedded ?? "—"}</b>
            </div>
            <div className="kv">
              <span>AI keys</span>
              <b className="up">{win.proof?.ai_no_keys ? "NEVER" : "?"}</b>
            </div>
            <div className="kv">
              <span>Apps wired</span>
              <b>{(win.proof?.modules ?? "—")}</b>
            </div>
          </div>
        </div>
      )}

      <div className="ticker-wrap">
        <div className="ticker" key={`t-${tick}`}>
          {(feed.ticker || []).concat(feed.ticker || []).map((t, i) => (
            <span key={`${t.symbol}-${i}`} className={`tick ${t.side}`}>
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
        </div>
      </div>

      {/* App module grid — real product surfaces */}
      <div className="app-modules">
        {modules.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`app-mod status-${m.status || "live"}`}
            disabled={busy}
            onClick={() => goModule(m)}
          >
            <span className="eyebrow">{m.id}</span>
            <b>{m.title}</b>
            <span className="metric">{m.metric}</span>
            <span className="muted sm detail">{m.detail}</span>
            {(m.laws || []).slice(0, 1).map((l) => (
              <span key={l.id} className="law-chip mini">
                <em>{l.id}</em>
              </span>
            ))}
            <span className="cta-line">{m.cta}</span>
          </button>
        ))}
      </div>

      <div className="hero-card land-hero">
        <div>
          <span className="eyebrow">PLATFORM SHELL · KERNEL + MARKET + APPS</span>
          <h2>{feed.tagline}</h2>
          <p className="muted">{brief.narrative || brief.coach_headline}</p>
          <div className="chips">
            <button type="button" className="forge" disabled={busy} onClick={() => act("run_system")}>
              ▶ RUN SYSTEM
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => invokePlatform("app.desk", "arena")}>
              Desk
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => act("run_company")}>
              Company
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => act("connect_wallet")}>
              Wallets
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => act("vault_route")}>
              Vault
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate("cloud")}>
              Cloud
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate("poly")}>
              Polyglot
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate("local")}>
              Local AI
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => act("forge")}>
              Forge
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
          <div className="kv">
            <span>Wallets</span>
            <b>{wallets.linked || 0}</b>
          </div>
          <div className="kv">
            <span>Vault</span>
            <b className="mono muted sm">
              {vault.address ? `${vault.address.slice(0, 8)}…` : "not set"}
            </b>
          </div>
          <div className="kv">
            <span>Packages</span>
            <b>{projects.count || 0}</b>
          </div>
          {Object.entries(marks)
            .slice(0, 3)
            .map(([sym, px]) => (
              <div className="kv" key={sym}>
                <span>{sym}</span>
                <b className="mono">{Number(px).toFixed(4)}</b>
              </div>
            ))}
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

      {/* Real product panels */}
      <div className="grid4">
        <article className="result app-panel">
          <label>WALLETS · PUBLIC ONLY</label>
          <p className="muted sm">{wallets.teach}</p>
          {(wallets.laws || []).map((l) => (
            <div key={l.id} className="law-chip on">
              <em>{l.id}</em>
              <span>{l.as_used || l.rule}</span>
            </div>
          ))}
          {(wallets.links || []).length === 0 ? (
            <p className="muted sm">No wallets linked yet.</p>
          ) : (
            (wallets.links || []).map((w) => (
              <div key={w.link_id} className="proto">
                <b>
                  {w.kind} · {w.label || w.address?.slice(0, 10)}
                </b>
                <p className="muted sm mono">
                  {w.address?.slice(0, 14)}… · {w.chain}
                </p>
                <p className="muted sm">
                  {Object.entries(w.balances || {})
                    .map(([s, a]) => `${s}:${a}`)
                    .join(" · ") || "no attested balances"}
                </p>
              </div>
            ))
          )}
          <div className="chips tight">
            <button type="button" className="ghost" disabled={busy} onClick={() => act("connect_wallet", { kind: "metamask" })}>
              MetaMask
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => act("connect_wallet", { kind: "phantom" })}>
              Phantom
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => act("manual_wallet")}>
              Watch-only
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => act("sync_twins")}>
              Sync twins
            </button>
          </div>
        </article>

        <article className="result app-panel">
          <label>SOVEREIGN VAULT</label>
          <p className="muted sm">{vault.teach}</p>
          <div className="kv">
            <span>Address</span>
            <b className="mono sm">{vault.address || "not recorded"}</b>
          </div>
          <div className="kv">
            <span>Status</span>
            <b>{vault.status}</b>
          </div>
          <div className="kv">
            <span>Routable tickets</span>
            <b>{vault.routable_tickets || 0}</b>
          </div>
          {(vault.laws || []).map((l) => (
            <div key={l.id} className="law-chip">
              <em>{l.id}</em>
              <span>{l.as_used || l.rule}</span>
            </div>
          ))}
          {route && (
            <div className="proto featured">
              <span className="eyebrow">LATEST ROUTE SIM</span>
              <b className={route.would_execute ? "up" : "down"}>
                {route.would_execute ? "WOULD EXECUTE" : "BLOCKED / SIM"}
              </b>
              <p className="muted sm">{route.narrative}</p>
              {(route.steps || []).slice(0, 3).map((s) => (
                <p key={s.id} className="muted sm">
                  {s.ok ? "✓" : "✗"} {s.id}: {s.detail}
                </p>
              ))}
            </div>
          )}
          <div className="chips tight">
            <button type="button" className="ghost" disabled={busy} onClick={() => act("vault_route")}>
              Vault route sim
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate("desk")}>
              Open desk
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate("codex")}>
              Deployment
            </button>
          </div>
        </article>

        <article className="result app-panel">
          <label>DESK · POSITIONS · TICKETS</label>
          <p className="muted sm">{desk.teach}</p>
          <div className="kv">
            <span>Equity / cash</span>
            <b>
              {Number(desk.equity || 0).toFixed(0)} / {Number(desk.cash_usdc || 0).toFixed(0)}
            </b>
          </div>
          <div className="kv">
            <span>Tickets A/R</span>
            <b>
              {desk.ticket_stats?.accepted || 0}/{desk.ticket_stats?.rejected || 0}
            </b>
          </div>
          {(desk.positions || []).slice(0, 3).map((p) => (
            <div key={p.venue_id + p.pair} className="proto">
              <b>
                {p.pair} · {p.venue_id}
              </b>
              <span className="muted sm">
                qty {Number(p.qty).toFixed(3)} · uPnL {Number(p.unrealized_pnl).toFixed(2)}
              </span>
            </div>
          ))}
          {(desk.tickets_recent || []).slice(0, 4).map((t) => (
            <div
              key={t.ticket_id}
              className={`proto ${t.status === "risk_rejected" ? "no" : "yes"}`}
            >
              <b>
                {t.side} {t.pair}
              </b>
              <span className="muted sm">
                {t.status} · {t.venue_id}
              </span>
              {(t.status === "risk_accepted" ||
                t.status === "paper_filled" ||
                t.status === "routed_sim") && (
                <button
                  type="button"
                  className="ghost"
                  disabled={busy}
                  onClick={() => act("vault_route", { ticketId: t.ticket_id })}
                >
                  Route vault
                </button>
              )}
            </div>
          ))}
          <div className="chips tight">
            <button type="button" className="ghost" disabled={busy} onClick={() => act("desk_arena")}>
              Run arena
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => act("refresh_marks")}>
              Refresh marks
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => act("run_strategy", { id: "market-make" })}>
              Market-make
            </button>
          </div>
          {(desk.laws || []).map((l) => (
            <div key={l.id} className="law-chip">
              <em>{l.id}</em>
              <span>{l.as_used || l.rule}</span>
            </div>
          ))}
        </article>

        <article className="result app-panel">
          <label>AI NODE · SANDBOX TWINS</label>
          <p className="muted sm">{ai.teach}</p>
          <div className="kv">
            <span>Node</span>
            <b className="mono sm">{(ai.node_id || "…").slice(0, 12)}</b>
          </div>
          <div className="kv">
            <span>Twins</span>
            <b>{ai.twin_count || 0}</b>
          </div>
          <div className="kv">
            <span>Real keys</span>
            <b className="up">NEVER</b>
          </div>
          {Object.entries(ai.twins_preview || {}).map(([sym, amt]) => (
            <div key={sym} className="proto">
              <b>{sym}</b>
              <span className="muted sm">{Number(amt).toFixed?.(4) ?? amt}</span>
            </div>
          ))}
          {(ai.laws || []).map((l) => (
            <div key={l.id} className="law-chip on">
              <em>{l.id}</em>
              <span>{l.as_used || l.rule}</span>
            </div>
          ))}
          <div className="chips tight">
            <button type="button" className="ghost" onClick={() => onNavigate("ai")}>
              Open AI node
            </button>
            <button type="button" className="ghost" disabled={busy} onClick={() => act("sync_twins")}>
              Sync twins
            </button>
          </div>
          <label>FORGED APPS</label>
          <p className="muted sm">{projects.teach}</p>
          {(projects.projects || []).slice(0, 4).map((p) => (
            <button
              key={p.project_id}
              type="button"
              className="proto project-btn"
              disabled={busy}
              onClick={() => act("open_project", { projectId: p.project_id })}
            >
              <b>{p.name || p.project_id}</b>
              <span className="muted sm">
                {(p.categories || []).join(", ") || p.network || "package"}
              </span>
            </button>
          ))}
          <button type="button" className="ghost" disabled={busy} onClick={() => act("forge")}>
            Forge new app
          </button>
        </article>
      </div>

      <div className="grid3">
        <article className="result">
          <label>AI DAILY BRIEF · FROM REAL STATE</label>
          <p className="cert" style={{ fontSize: "1rem" }}>
            {brief.coach_headline || "Company online"}
          </p>
          <ul className="pillars">
            <li>
              Wallets linked: {brief.wallet_linked ?? wallets.linked ?? 0} · Vault:{" "}
              {brief.vault_deployed || vault.deployed ? "recorded" : "not set"}
            </li>
            <li>
              Desk equity {Number(brief.desk_equity ?? desk.equity ?? 0).toFixed(2)} · Packages{" "}
              {brief.project_count ?? projects.count ?? 0}
            </li>
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
          <label>Daily missions</label>
          {(daily.missions || []).slice(0, 5).map((m) => (
            <div key={m.id} className={`proto ${m.done ? "yes" : ""}`}>
              <b>
                {m.done ? "✓" : "○"} {m.title || m.id}
              </b>
              <span className="muted sm">+{m.xp || 0} XP</span>
            </div>
          ))}
          <button type="button" className="ghost" onClick={() => onNavigate("home")}>
            Open DAILY
          </button>
          {(brief.tips || []).slice(0, 3).map((t, i) => (
            <div key={i} className="proto">
              <b>
                {t.kind || "tip"}: {t.title}
              </b>
              <p className="muted sm">{t.body}</p>
            </div>
          ))}
        </article>

        <article>
          <label>
            TEACHING AS YOU OPERATE · {teach.rotation_seconds || 20}s rotate
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
            {(teach.best_practice?.apps || []).length > 0 && (
              <p className="muted sm">
                Touches: {(teach.best_practice.apps || []).join(" · ")}
              </p>
            )}
            {(teach.best_practice?.laws_explained || []).map((l) => (
              <div key={l.id} className="law-chip on">
                <em>{l.id}</em>
                <span>{l.as_used || l.rule}</span>
              </div>
            ))}
            {teach.best_practice?.docs && (
              <a className="link" href={teach.best_practice.docs} target="_blank" rel="noreferrer">
                docs.monad.xyz best practices →
              </a>
            )}
          </div>
          <div className="proto">
            <span className="eyebrow">COOL MOVE · REAL APP ACTION</span>
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
              disabled={busy}
              onClick={() => {
                if (teach.cool_move?.action) act(teach.cool_move.action);
                else onNavigate(teach.cool_move?.href || "hq");
              }}
            >
              {teach.cool_move?.cta || "Go"}
            </button>
          </div>
        </article>

        <article className="result">
          <label>LIVE STREAM · LAWS AS APPS FIRE</label>
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
                {(s.cta || s.action) && (
                  <button
                    type="button"
                    className="ghost"
                    disabled={busy}
                    onClick={() => {
                      if (s.action) act(s.action);
                      else onNavigate(s.href || "hq");
                    }}
                  >
                    {s.cta || s.action}
                  </button>
                )}
              </div>
            ))}
          </div>
          <label>ALWAYS-ON LAWS</label>
          {(teach.active_laws || []).map((l) => (
            <div key={l.id} className="law-chip on">
              <em>{l.id}</em>
              <span>{l.as_used || l.rule}</span>
            </div>
          ))}
          <p className="muted sm law-note">{lawStack.doctrine}</p>
        </article>
      </div>
    </section>
  );
}
