import React, { useCallback, useEffect, useState } from "react";

/**
 * NOMOS department — auto multi-agent propose + arena.
 * REJECT is a feature. Dual law stack. Owner remains sovereign.
 */
export function Nomos({
  api,
  policy,
  setPolicy,
  buildBody,
  arena,
  setArena,
  busy: parentBusy,
  onNavigate,
  onRunSystem,
  onDeskArena,
  onCompanyRun,
}) {
  const [catalog, setCatalog] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  const [deskArena, setDeskArena] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const d = await api("/nomos");
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

  function flash(m) {
    setLog(m);
    setTimeout(() => setLog(""), 5000);
  }

  async function runArenaAuto() {
    setBusy(true);
    setErr("");
    try {
      const body = buildBody ? buildBody() : {
        name: "NOMOS Arena",
        objective: "Coordinate under dual law stack; reject unlawful paths.",
        categories: ["vault", "dex", "lending"],
        network: "monad-testnet",
        policy,
      };
      // Prefer dedicated NOMOS run (dual-stack metadata)
      let data;
      try {
        data = await api("/nomos/run", {
          method: "POST",
          body: JSON.stringify(body),
        });
      } catch {
        data = await api("/arena/auto", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setArena?.(data);
      flash(
        `Arena · accept ${data.n_accepted} / reject ${data.n_rejected}` +
          (data.n_rejected >= 1 ? " · REJECT is a feature ✓" : "")
      );
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function runDeskArena() {
    setBusy(true);
    setErr("");
    try {
      if (onDeskArena) {
        await onDeskArena();
      }
      const data = await api("/desk/arena", { method: "POST", body: "{}" });
      setDeskArena(data);
      flash(`Desk arena · accept ${data.n_accepted} / reject ${data.n_rejected}`);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  const eco = catalog?.ecosystem || {};
  const workflow = catalog?.role_in_company_os?.workflow || [];
  const evals = arena?.evaluations || [];
  const dual = arena?.dual_law_stack;

  return (
    <section className="panel nomos-panel">
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">NOMOS · RISK / LAW · COMPANY OS</span>
          <h3>{catalog?.tagline || "Auto multi-agent propose + arena (REJECT is a feature)"}</h3>
          <p className="muted sm doctrine-line">
            <b>{catalog?.doctrine || "Agents propose. Laws decide. Owner signs. Receipts remember."}</b>
          </p>
          <p className="muted sm">
            {catalog?.description ||
              "Multi-agent proposals enter the arena; dual law stacks decide; rejection is logged and valuable."}
          </p>
          <p className="muted sm">
            Ecosystem laws: <b>{eco.law_count ?? "…"}</b>
            {eco.domains?.length ? ` · domains ${eco.domains.join(", ")}` : ""}
            {eco.veto_law ? ` · veto ${eco.veto_law}` : ""}
            {catalog?.receipt_tip ? ` · tip ${catalog.receipt_tip}…` : ""}
          </p>
        </div>
        <div className="win-actions">
          <button type="button" className="forge win-btn" disabled={disabled} onClick={runArenaAuto}>
            AUTO-PROPOSE + ARBITRATE →
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={runDeskArena}>
            DESK ARENA
          </button>
          <button type="button" className="ghost" disabled={disabled} onClick={onCompanyRun}>
            STAFF COMPANY
          </button>
          <button type="button" className="ghost" onClick={() => onNavigate?.("hq")}>
            MISSION ROOM
          </button>
        </div>
      </div>

      {err ? <div className="banner err">{err}</div> : null}
      {log ? <div className="banner ok">{log}</div> : null}

      {/* Company OS workflow */}
      <div className="nomos-workflow">
        <label>COMPANY OS WORKFLOW</label>
        <div className="chips tight nomos-flow-chips">
          {workflow.map((d, i) => (
            <span
              key={d.id}
              className={`chip flow-chip ${d.id === "NOMOS" ? "on" : ""}`}
              title={d.does}
            >
              {i > 0 ? "→ " : ""}
              <b>{d.id}</b>
              <span className="muted sm"> {d.role}</span>
            </span>
          ))}
        </div>
        <p className="muted sm" style={{ marginTop: 8 }}>
          AGORA generates competing proposals · <b>NOMOS</b> applies dual law stack and can veto ·
          PRAXIS only plans signed execution · ACADEMY learns from rejects.
        </p>
      </div>

      <div className="grid2 nomos-grid">
        {/* Lawbook */}
        <article>
          <label>OWNER CONSTITUTION (LAWBOOK)</label>
          <p className="muted sm">
            Owner-defined financial laws. Combined with runtime ecosystem laws before any accept.
          </p>
          {[
            ["max_slippage_bps", "Max slippage (bps)"],
            ["max_protocol_exposure_bps", "Max protocol exposure (bps)"],
            ["min_liquid_reserve_bps", "Min liquid reserve (bps)"],
            ["max_leverage_bps", "Max leverage (bps)"],
            ["max_action_value", "Max action value"],
          ].map(([k, lab]) => (
            <div className="field" key={k}>
              <span>{lab}</span>
              <input
                type="number"
                value={policy?.[k] ?? ""}
                onChange={(e) =>
                  setPolicy?.((p) => ({ ...p, [k]: Number(e.target.value) }))
                }
              />
            </div>
          ))}
          <div className="kv">
            <span>Require simulation</span>
            <b>{String(policy?.require_simulation ?? true)}</b>
          </div>
          <div className="kv">
            <span>Allowed categories</span>
            <code className="sm">{(policy?.allowed_categories || []).join(", ") || "—"}</code>
          </div>
          <button type="button" className="forge" disabled={disabled} onClick={runArenaAuto}>
            RUN NOMOS ARENA →
          </button>
          <p className="muted sm">
            Generates reckless + balanced + yield + dust agents. Reckless path is designed to{" "}
            <b>REJECT</b>.
          </p>
        </article>

        {/* Dual stack + how it works */}
        <article>
          <label>DUAL LAW STACK</label>
          <div className="plans">
            {(catalog?.dual_law_stack || []).map((layer) => (
              <div key={layer.layer} className="plan yes">
                <header>
                  <b>{layer.name}</b>
                  <span className="pill ok">{layer.layer}</span>
                </header>
                <p>
                  {layer.source} · {layer.examples}
                </p>
              </div>
            ))}
          </div>
          {dual ? (
            <div className="kv" style={{ marginTop: 10 }}>
              <span>Last run ecosystem laws</span>
              <b>{dual.ecosystem_law_count}</b>
            </div>
          ) : null}
          <label style={{ marginTop: 14 }}>ARENA RULES (policy.evaluate)</label>
          <div className="plans">
            {(catalog?.arena_core?.rules?.rules || []).map((r) => (
              <div key={r.id} className="plan">
                <header>
                  <b>{r.id}</b>
                  <span className="pill warn">{r.op}</span>
                </header>
                <p>
                  {r.field_action} vs {r.field_policy} · {r.human}
                </p>
              </div>
            ))}
          </div>
          <label style={{ marginTop: 14 }}>HOW IT WORKS</label>
          <ol className="pillars start-steps nomos-steps">
            {(catalog?.how_it_works || []).map((s) => (
              <li key={s.step}>
                <b>{s.name}</b> — {s.detail}
              </li>
            ))}
          </ol>
          <p className="muted sm" style={{ marginTop: 8 }}>
            Core file: <code>{catalog?.arena_core?.file || "engine/thesis_forge/policy.py"}</code> ·{" "}
            {(catalog?.arena_core?.pipeline || ["evaluate", "arbitrate", "arena_report"]).join(" → ")}
          </p>
        </article>
      </div>

      {/* Arena results */}
      <div className="grid2" style={{ marginTop: 12 }}>
        <article className="result">
          <label>ARENA · PROPOSE + ARBITRATE</label>
          {!arena ? (
            <p className="muted">
              Run <b>AUTO-PROPOSE + ARBITRATE</b> or full pipeline / company staff. Expect at least one
              REJECT.
            </p>
          ) : (
            <>
              <div className="kv">
                <span>Accepted / Rejected</span>
                <b>
                  {arena.n_accepted} / {arena.n_rejected}
                </b>
              </div>
              <div className="kv">
                <span>Reject is a feature</span>
                <span className={`pill ${arena.n_rejected >= 1 || arena.reject_is_a_feature ? "ok" : "warn"}`}>
                  {arena.n_rejected >= 1 ? "PROVEN" : "run arena"}
                </span>
              </div>
              {arena.winner ? (
                <div className="winner">
                  <span className="pill ok">WINNER · {arena.winner.action?.agent}</span>
                  <p>{arena.winner.evaluation?.human_summary}</p>
                </div>
              ) : (
                <span className="pill bad">NO LAWFUL WINNER</span>
              )}
              {arena.receipt?.receipt_hash ? (
                <div className="kv">
                  <span>Receipt</span>
                  <code className="sm">{String(arena.receipt.receipt_hash).slice(0, 18)}…</code>
                </div>
              ) : null}
              {arena.scoreboard?.length ? (
                <>
                  <label style={{ marginTop: 10 }}>SCOREBOARD</label>
                  <div className="plans">
                    {arena.scoreboard.map((row) => (
                      <div
                        key={`${row.rank}-${row.agent}`}
                        className={`plan ${row.accepted ? "yes" : "no"}`}
                      >
                        <header>
                          <b>
                            #{row.rank} · {row.agent} · {row.protocol}
                          </b>
                          <span className={`pill ${row.accepted ? "ok" : "bad"}`}>
                            {row.outcome || (row.accepted ? "ACCEPT" : "REJECT")}
                          </span>
                        </header>
                        <p>score {row.score}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              <label style={{ marginTop: 10 }}>EVALUATIONS</label>
              <div className="plans">
                {evals.map((row, i) => (
                  <div
                    key={i}
                    className={`plan ${row.evaluation?.accepted ? "yes" : "no"}`}
                  >
                    <header>
                      <b>
                        {row.action?.agent} · {row.action?.protocol}
                      </b>
                      <span className={`pill ${row.evaluation?.accepted ? "ok" : "bad"}`}>
                        {row.evaluation?.accepted ? "ACCEPT" : "REJECT"}
                      </span>
                    </header>
                    <p>
                      score {row.evaluation?.score} ·{" "}
                      {row.action?.rationale || row.action?.action}
                    </p>
                    {!row.evaluation?.accepted && (
                      <ul>
                        {(row.evaluation?.reasons || row.evaluation?.violations || []).map(
                          (r) => (
                            <li key={r}>{r}</li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </article>

        <article>
          <label>DESK ARENA · TRADING SCORECARDS</label>
          {!deskArena ? (
            <p className="muted sm">
              Trading tickets evaluated under desk risk + NOMOS. Same doctrine: reject is valuable.
            </p>
          ) : (
            <>
              <div className="kv">
                <span>Accepted / Rejected</span>
                <b>
                  {deskArena.n_accepted} / {deskArena.n_rejected}
                </b>
              </div>
              {(deskArena.tickets || deskArena.results || []).slice(0, 6).map((t, i) => {
                const status = t.status || t.ticket?.status || "";
                const ok = String(status).includes("accept");
                return (
                  <div key={i} className={`plan ${ok ? "yes" : "no"}`}>
                    <header>
                      <b>
                        {t.agent || t.ticket?.agent || "ticket"} ·{" "}
                        {t.venue_id || t.ticket?.venue_id || t.pair || ""}
                      </b>
                      <span className={`pill ${ok ? "ok" : "bad"}`}>{status || "—"}</span>
                    </header>
                    {(t.reasons || t.violations || []).length > 0 && (
                      <ul>
                        {(t.reasons || t.violations).map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </>
          )}
          <button type="button" className="ghost" disabled={disabled} onClick={runDeskArena}>
            RUN DESK ARENA
          </button>

          <label style={{ marginTop: 16 }}>OWNER SOVEREIGNTY</label>
          <p className="muted sm">
            Mission Room actions:{" "}
            {(catalog?.owner_actions || ["approve", "reject", "simulate_again", "revise"]).join(
              " · "
            )}
            . Final execution requires owner signature. AI never holds real keys.
          </p>
          <div className="chips tight">
            <button type="button" className="ghost" onClick={() => onNavigate?.("hq")}>
              HQ / Mission
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate?.("academy")}>
              ACADEMY (learn rejects)
            </button>
            <button type="button" className="ghost" onClick={() => onNavigate?.("desk")}>
              DESK
            </button>
            <button type="button" className="ghost" disabled={disabled} onClick={onRunSystem}>
              ▶ RUN SYSTEM
            </button>
          </div>

          <label style={{ marginTop: 16 }}>ON-CHAIN · MONAD</label>
          <ul className="muted sm nomos-onchain">
            {(catalog?.onchain || []).map((c) => (
              <li key={c.contract}>
                <b>{c.contract}</b> — {c.role}
              </li>
            ))}
          </ul>

          <label style={{ marginTop: 12 }}>SAFETY</label>
          <ul className="muted sm">
            {(catalog?.safety || []).slice(0, 5).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </article>
      </div>

      {/* Agents strip */}
      <div className="nomos-agents" style={{ marginTop: 14 }}>
        <label>DEFAULT ARENA AGENTS</label>
        <div className="grid3">
          {(catalog?.agents || []).map((a) => (
            <article key={a.id} className="plan">
              <header>
                <b>{a.id}</b>
              </header>
              <p>
                {a.style} · <em>{a.expect}</em>
              </p>
            </article>
          ))}
        </div>
      </div>

      <p className="muted sm" style={{ marginTop: 12 }}>
        Docs: <code>docs/NOMOS.md</code> · APIs:{" "}
        {(catalog?.apis || []).map((a) => a.path).join(", ") || "/nomos, /arena/auto, /desk/arena"}
      </p>
    </section>
  );
}
