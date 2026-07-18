import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const CATEGORIES = ["dex", "lending", "vault", "staking", "perps", "analytics", "agent"];

const API =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof window !== "undefined" && window.location.port === "5173" ? "/api" : "http://127.0.0.1:8043");

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data.detail || data.error || res.statusText || "request failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

const DEFAULT_POLICY = {
  max_slippage_bps: 50,
  max_protocol_exposure_bps: 2000,
  min_liquid_reserve_bps: 2500,
  max_leverage_bps: 12500,
  max_action_value: 1000,
  require_simulation: true,
  allowed_categories: CATEGORIES.filter((c) => c !== "perps"),
};

function Pill({ ok, children, warn }) {
  const cls = warn ? "warn" : ok ? "ok" : "bad";
  return <span className={`pill ${cls}`}>{children}</span>;
}

function StatusDot({ status }) {
  return <i className={`dot ${status || "pending"}`} title={status} />;
}

function App() {
  const [tab, setTab] = useState("studio");
  const [health, setHealth] = useState(null);
  const [judge, setJudge] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("THESIS Sovereign Ops");
  const [objective, setObjective] = useState(
    "Coordinate my Monad portfolio across swaps, lending, and vaults while agents only propose actions that pass my onchain lawbook and leave receipts."
  );
  const [selected, setSelected] = useState(["dex", "lending", "vault", "staking", "analytics"]);
  const [network, setNetwork] = useState("monad-testnet");
  const [policy, setPolicy] = useState(DEFAULT_POLICY);

  const [pipeline, setPipeline] = useState(null);
  const [filePath, setFilePath] = useState("");
  const [arena, setArena] = useState(null);
  const [projects, setProjects] = useState([]);

  const [quests, setQuests] = useState([]);
  const [questId, setQuestId] = useState("");
  const [quest, setQuest] = useState(null);
  const [pick, setPick] = useState(0);
  const [understood, setUnderstood] = useState(false);
  const [grade, setGrade] = useState(null);

  const [protocols, setProtocols] = useState([]);
  const [deployment, setDeployment] = useState(null);
  const [rpc, setRpc] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [desk, setDesk] = useState(null);
  const [deskArena, setDeskArena] = useState(null);
  const [markFeed, setMarkFeed] = useState(null);
  const [strategyRun, setStrategyRun] = useState(null);
  const [vaultRoute, setVaultRoute] = useState(null);
  const [ticketForm, setTicketForm] = useState({
    venue_id: "kuru",
    pair: "MON/USDC",
    side: "buy",
    qty: 25,
    limit_price: 1,
    slippage_bps: 20,
    leverage_bps: 10000,
    agent: "desk-trader",
    rationale: "Manual desk ticket",
  });

  const files = pipeline?.files || {};
  const fileList = useMemo(() => Object.keys(files).sort(), [files]);
  const activeFile = filePath && files[filePath] != null ? filePath : fileList[0] || "";
  const fileContent = activeFile ? files[activeFile] : "";

  const status = useMemo(() => {
    if (busy) return "WORKING";
    if (err) return "ERROR";
    if (health?.status === "operational") return "ONLINE";
    return "BOOT";
  }, [busy, err, health]);

  const buildBody = useCallback(
    () => ({
      name,
      objective,
      categories: selected,
      network,
      policy: { ...policy, allowed_categories: selected },
      persist: true,
    }),
    [name, objective, selected, network, policy]
  );

  const refresh = useCallback(async () => {
    try {
      const [h, j, p, d, q, wp, rc, dk] = await Promise.all([
        api("/health"),
        api("/judge"),
        api("/protocols"),
        api("/deployment"),
        api("/academy/quests"),
        api("/workspace/projects"),
        api("/receipts/recent?n=12"),
        api("/desk"),
      ]);
      setHealth(h);
      setJudge(j);
      setProtocols(p);
      setDeployment(d);
      setQuests(q.quests || []);
      if (!questId && q.quests?.length) setQuestId(q.quests[0].id);
      setProjects(wp.projects || []);
      setReceipts(rc.receipts || []);
      setDesk(dk);
      if (dk?.marks?.["MON/USDC"]) {
        setTicketForm((f) => ({ ...f, limit_price: dk.marks["MON/USDC"] }));
      }
      setErr("");
    } catch (e) {
      setErr(String(e.message || e));
      setHealth(null);
    }
  }, [questId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!questId) return;
    let c = false;
    (async () => {
      try {
        const q = await api(`/academy/quests/${questId}`);
        if (!c) {
          setQuest(q);
          setPick(0);
          setGrade(null);
          setUnderstood(false);
        }
      } catch (e) {
        if (!c) setErr(String(e.message || e));
      }
    })();
    return () => {
      c = true;
    };
  }, [questId]);

  async function runPipeline() {
    setBusy(true);
    setErr("");
    try {
      const data = await api("/pipeline", { method: "POST", body: JSON.stringify(buildBody()) });
      setPipeline(data);
      setArena(data.arena || null);
      const paths = Object.keys(data.files || {});
      setFilePath(paths.includes("docs/AGENT.md") ? "docs/AGENT.md" : paths[0] || "");
      setTab("studio");
      await refresh();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function runArenaAuto() {
    setBusy(true);
    setErr("");
    try {
      const data = await api("/arena/auto", { method: "POST", body: JSON.stringify(buildBody()) });
      setArena(data);
      setTab("nomos");
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function runGrade() {
    setBusy(true);
    setErr("");
    try {
      const data = await api("/academy/grade", {
        method: "POST",
        body: JSON.stringify({ quest_id: questId, selected_action_index: pick, understood }),
      });
      setGrade(data);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function probeRpc() {
    setBusy(true);
    try {
      setRpc(await api(`/rpc/probe?network=${network}`));
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
      const data = await api("/desk/arena", { method: "POST", body: "{}" });
      setDeskArena(data);
      setDesk(await api("/desk"));
      setTab("desk");
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function submitTicket() {
    setBusy(true);
    setErr("");
    try {
      const data = await api("/desk/ticket", {
        method: "POST",
        body: JSON.stringify(ticketForm),
      });
      setDesk(data.desk);
      if (data.ticket?.status === "risk_accepted") {
        // optional: leave for user to fill
      }
      setDeskArena(null);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function fillTicket(id) {
    setBusy(true);
    setErr("");
    try {
      const data = await api(`/desk/fill/${id}`, { method: "POST", body: "{}" });
      setDesk(data.desk);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function resetDeskBook() {
    setBusy(true);
    try {
      setDesk(await api("/desk/reset", { method: "POST", body: "{}" }));
      setDeskArena(null);
      setStrategyRun(null);
      setVaultRoute(null);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function refreshMarks() {
    setBusy(true);
    setErr("");
    try {
      const data = await api(`/desk/marks/refresh?network=${network}`, {
        method: "POST",
        body: "{}",
      });
      setMarkFeed(data.feed);
      setDesk(data.desk);
      if (data.desk?.marks?.[ticketForm.pair]) {
        setTicketForm((f) => ({ ...f, limit_price: data.desk.marks[f.pair] }));
      }
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function runStrategy(id) {
    setBusy(true);
    setErr("");
    try {
      const data = await api(`/desk/strategies/${id}?submit=true`, {
        method: "POST",
        body: "{}",
      });
      setStrategyRun(data);
      setDesk(data.desk);
      setTab("desk");
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function routeVault(ticketId) {
    setBusy(true);
    setErr("");
    try {
      const data = await api(`/desk/vault-route/${ticketId}`, {
        method: "POST",
        body: "{}",
      });
      setVaultRoute(data);
      if (data.desk) setDesk(data.desk);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function openProject(id) {
    setBusy(true);
    try {
      const proj = await api(`/workspace/projects/${id}`);
      setPipeline({
        project_id: proj.project_id,
        manifest: proj.manifest,
        files: proj.files || {},
        events: proj.events || [],
        arena: proj.arena,
        progress: { complete: (proj.events || []).filter((e) => e.status === "complete").length, total: (proj.events || []).length, pct: 0 },
        file_stats: { n_files: Object.keys(proj.files || {}).length },
        workspace: proj.project,
      });
      setArena(proj.arena || null);
      const paths = Object.keys(proj.files || {});
      setFilePath(paths[0] || "");
      setTab("ide");
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  const vault =
    deployment?.primary_submission_address ||
    deployment?.contracts?.SovereignVault ||
    health?.deployment?.primary_submission_address ||
    "";

  const progress = pipeline?.progress;

  return (
    <div className="shell">
      <header className="top">
        <div>
          <span className="eyebrow">THESIS v{health?.version || "0.3"} · MONAD WORKSTATION</span>
          <h1>
            THESIS <i>Forge</i>
          </h1>
          <p className="tagline">
            Full pipeline IDE · agents under laws · failure-first academy · explainable events
          </p>
        </div>
        <div className="top-right">
          <div className={`status s-${status.toLowerCase()}`}>{status}</div>
          <button type="button" className="ghost" onClick={refresh}>
            Sync
          </button>
        </div>
      </header>

      {err ? (
        <div className="banner err">
          {err}
          <span className="muted"> · start API: uvicorn thesis_forge.api:app --port 8043</span>
        </div>
      ) : null}

      <nav className="tabs">
        {[
          ["studio", "STUDIO"],
          ["ide", "IDE"],
          ["nomos", "NOMOS"],
          ["desk", "DESK"],
          ["academy", "ACADEMY"],
          ["codex", "CODEX"],
          ["judge", "JUDGE"],
        ].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "studio" && (
        <section className="panel">
          <div className="grid3">
            <article>
              <label>PROJECT</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
              <label>OBJECTIVE</label>
              <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={5} />
              <label>NETWORK</label>
              <div className="chips">
                {[
                  ["monad-testnet", "Testnet 10143"],
                  ["monad-mainnet", "Mainnet 143"],
                ].map(([id, lab]) => (
                  <button key={id} type="button" className={network === id ? "on" : ""} onClick={() => setNetwork(id)}>
                    {lab}
                  </button>
                ))}
              </div>
              <label>PLANES</label>
              <div className="chips">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={selected.includes(c) ? "on" : ""}
                    onClick={() => setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <label>LAWBOOK QUICK</label>
              {[
                ["max_slippage_bps", "Slippage"],
                ["max_action_value", "Max value"],
              ].map(([k, lab]) => (
                <div className="field" key={k}>
                  <span>{lab}</span>
                  <input
                    type="number"
                    value={policy[k]}
                    onChange={(e) => setPolicy((p) => ({ ...p, [k]: Number(e.target.value) }))}
                  />
                </div>
              ))}
              <button type="button" className="forge" disabled={busy} onClick={runPipeline}>
                RUN FULL PIPELINE →
              </button>
              <button type="button" className="ghost block" disabled={busy} onClick={runArenaAuto}>
                Arena only
              </button>
            </article>

            <article className="result">
              <label>PIPELINE EVENTS</label>
              {!pipeline ? (
                <p className="muted">Run pipeline to emit 11 explainability stages (builder + agent + judge surfaces).</p>
              ) : (
                <>
                  <div className="progress">
                    <div className="bar" style={{ width: `${progress?.pct || 0}%` }} />
                  </div>
                  <div className="kv">
                    <span>Progress</span>
                    <b>
                      {progress?.complete}/{progress?.total} complete · {progress?.blocked || 0} blocked
                    </b>
                  </div>
                  <div className="kv">
                    <span>Package</span>
                    <b>{pipeline.file_stats?.n_files || 0} files</b>
                  </div>
                  <div className="kv">
                    <span>Project</span>
                    <code>{pipeline.project_id}</code>
                  </div>
                  <div className="events">
                    {(pipeline.events || []).map((ev) => (
                      <div key={ev.event_uid || ev.id} className={`ev ${ev.status}`}>
                        <header>
                          <StatusDot status={ev.status} />
                          <b>{ev.name}</b>
                          <span className="actor">{ev.actor}</span>
                        </header>
                        <p>{ev.plain_language}</p>
                        {ev.resolution ? <p className="res">{ev.resolution}</p> : null}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </article>

            <article className="result">
              <label>WORKSPACE</label>
              <p className="muted sm">Persisted under projects/ — reload anytime in IDE.</p>
              <div className="proj-list">
                {projects.length === 0 ? (
                  <p className="muted">No saved projects yet.</p>
                ) : (
                  projects.map((p) => (
                    <button key={p.project_id} type="button" className="option" onClick={() => openProject(p.project_id)}>
                      <b>{p.project_id}</b>
                      <span>
                        {p.n_files || "?"} files · chain {p.chain_id || "?"}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {pipeline?.receipt && (
                <div className="kv">
                  <span>Release receipt</span>
                  <code>{String(pipeline.receipt.receipt_hash || pipeline.receipt).slice(0, 20)}…</code>
                </div>
              )}
            </article>
          </div>
        </section>
      )}

      {tab === "ide" && (
        <section className="panel ide">
          <aside className="tree">
            <label>PACKAGE</label>
            {fileList.length === 0 ? (
              <p className="muted sm">Run STUDIO pipeline first.</p>
            ) : (
              fileList.map((p) => (
                <button key={p} type="button" className={activeFile === p ? "on" : ""} onClick={() => setFilePath(p)}>
                  {p}
                </button>
              ))
            )}
          </aside>
          <article className="editor">
            <label>{activeFile || "NO FILE"}</label>
            <pre className="code">{fileContent || "// empty"}</pre>
          </article>
          <aside className="ide-side">
            <label>MANIFEST</label>
            {pipeline?.manifest ? (
              <>
                <div className="kv">
                  <span>Hash</span>
                  <code>{pipeline.manifest.manifest_hash?.slice(0, 16)}…</code>
                </div>
                <div className="kv">
                  <span>Chain</span>
                  <b>{pipeline.manifest.chain_id}</b>
                </div>
                <div className="kv">
                  <span>Contracts</span>
                  <b>{(pipeline.manifest.contracts || []).length}</b>
                </div>
                <label>DEPLOY</label>
                <pre className="code sm">
                  {pipeline.manifest.deploy_plan?.commands?.deploy_script}
                  {"\n"}
                  {pipeline.manifest.deploy_plan?.commands?.forge_script}
                </pre>
              </>
            ) : (
              <p className="muted">No manifest loaded.</p>
            )}
          </aside>
        </section>
      )}

      {tab === "nomos" && (
        <section className="panel">
          <div className="grid2">
            <article>
              <label>LAWBOOK</label>
              {[
                ["max_slippage_bps", "Max slippage (bps)"],
                ["max_protocol_exposure_bps", "Max exposure (bps)"],
                ["min_liquid_reserve_bps", "Min reserve (bps)"],
                ["max_leverage_bps", "Max leverage (bps)"],
                ["max_action_value", "Max action value"],
              ].map(([k, lab]) => (
                <div className="field" key={k}>
                  <span>{lab}</span>
                  <input
                    type="number"
                    value={policy[k]}
                    onChange={(e) => setPolicy((p) => ({ ...p, [k]: Number(e.target.value) }))}
                  />
                </div>
              ))}
              <button type="button" className="forge" disabled={busy} onClick={runArenaAuto}>
                AUTO-PROPOSE + ARBITRATE →
              </button>
              <p className="muted sm">Generates reckless + balanced + yield + dust agents, scores under laws.</p>
            </article>
            <article className="result">
              <label>ARENA</label>
              {!arena ? (
                <p className="muted">Run auto arena or full pipeline.</p>
              ) : (
                <>
                  <div className="kv">
                    <span>Accepted / Rejected</span>
                    <b>
                      {arena.n_accepted} / {arena.n_rejected}
                    </b>
                  </div>
                  {arena.winner ? (
                    <div className="winner">
                      <Pill ok>WINNER · {arena.winner.action.agent}</Pill>
                      <p>{arena.winner.evaluation.human_summary}</p>
                    </div>
                  ) : (
                    <Pill ok={false}>NO LAWFUL WINNER</Pill>
                  )}
                  <div className="plans">
                    {(arena.evaluations || []).map((row, i) => (
                      <div key={i} className={`plan ${row.evaluation.accepted ? "yes" : "no"}`}>
                        <header>
                          <b>
                            {row.action.agent} · {row.action.protocol}
                          </b>
                          <Pill ok={row.evaluation.accepted}>{row.evaluation.accepted ? "ACCEPT" : "REJECT"}</Pill>
                        </header>
                        <p>
                          score {row.evaluation.score} · {row.action.rationale || row.action.action}
                        </p>
                        {!row.evaluation.accepted && (
                          <ul>
                            {(row.evaluation.reasons || row.evaluation.violations || []).map((r) => (
                              <li key={r}>{r}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </article>
          </div>
        </section>
      )}

      {tab === "desk" && (
        <section className="panel">
          <div className="grid3">
            <article>
              <label>TRADING BUSINESS DESK</label>
              <p className="muted sm">
                Agent tickets pass <b>desk risk + NOMOS</b>. Paper fills update the book. Live venue keys never enter the
                browser — SovereignVault remains the onchain capital gate.
              </p>
              {desk && (
                <>
                  <div className="kv">
                    <span>Cash USDC</span>
                    <b>{Number(desk.cash_usdc).toFixed(2)}</b>
                  </div>
                  <div className="kv">
                    <span>Equity</span>
                    <b>{Number(desk.equity).toFixed(2)}</b>
                  </div>
                  <div className="kv">
                    <span>Day PnL</span>
                    <b className={desk.day_pnl >= 0 ? "up" : "down"}>{Number(desk.day_pnl).toFixed(2)}</b>
                  </div>
                  <div className="kv">
                    <span>Realized / Unrealized</span>
                    <b>
                      {Number(desk.realized_pnl).toFixed(2)} / {Number(desk.unrealized_pnl).toFixed(2)}
                    </b>
                  </div>
                  <div className="kv">
                    <span>Mode</span>
                    <Pill ok={desk.paper_mode}>{desk.paper_mode ? "PAPER" : "LIVE*"}</Pill>
                  </div>
                </>
              )}
              <button type="button" className="forge" disabled={busy} onClick={runDeskArena}>
                RUN DESK ARENA (agents) →
              </button>
              <button type="button" className="ghost block" disabled={busy} onClick={refreshMarks}>
                Refresh live marks
              </button>
              {markFeed && (
                <p className="muted sm">
                  Marks · {markFeed.meta?.entropy || "feed"} · MON{" "}
                  {markFeed.marks?.["MON/USDC"]?.toFixed?.(4) ?? markFeed.marks?.["MON/USDC"]}
                </p>
              )}
              <label>STRATEGIES</label>
              <div className="chips col">
                {(desk?.strategies || [
                  { id: "market-make", name: "Market make" },
                  { id: "inventory", name: "Inventory" },
                  { id: "take-profit", name: "Take profit" },
                ]).map((s) => (
                  <button key={s.id} type="button" className="on" disabled={busy} onClick={() => runStrategy(s.id)}>
                    {s.name || s.id}
                    {s.tagline ? ` — ${s.tagline}` : ""}
                  </button>
                ))}
              </div>
              {strategyRun && (
                <p className="muted sm">
                  Strategy {strategyRun.strategy?.id}: {strategyRun.n_accepted} accept / {strategyRun.n_rejected}{" "}
                  reject
                </p>
              )}
              <button type="button" className="ghost block" disabled={busy} onClick={resetDeskBook}>
                Reset paper book
              </button>
              <label>NEW TICKET</label>
              <div className="field">
                <span>Venue</span>
                <select
                  value={ticketForm.venue_id}
                  onChange={(e) => {
                    const venue_id = e.target.value;
                    const v = (desk?.venues || []).find((x) => x.id === venue_id);
                    const pair = v?.pairs?.[0] || ticketForm.pair;
                    setTicketForm((f) => ({
                      ...f,
                      venue_id,
                      pair,
                      limit_price: desk?.marks?.[pair] || f.limit_price,
                    }));
                  }}
                >
                  {(desk?.venues || [])
                    .filter((v) => v.kind !== "analytics" && v.kind !== "custody_gate")
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="field">
                <span>Pair</span>
                <select
                  value={ticketForm.pair}
                  onChange={(e) =>
                    setTicketForm((f) => ({
                      ...f,
                      pair: e.target.value,
                      limit_price: desk?.marks?.[e.target.value] || f.limit_price,
                    }))
                  }
                >
                  {(
                    (desk?.venues || []).find((v) => v.id === ticketForm.venue_id)?.pairs || [
                      ticketForm.pair,
                    ]
                  ).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <span>Side</span>
                <select
                  value={ticketForm.side}
                  onChange={(e) => setTicketForm((f) => ({ ...f, side: e.target.value }))}
                >
                  <option value="buy">buy</option>
                  <option value="sell">sell</option>
                </select>
              </div>
              {[
                ["qty", "Qty"],
                ["limit_price", "Limit"],
                ["slippage_bps", "Slip bps"],
              ].map(([k, lab]) => (
                <div className="field" key={k}>
                  <span>{lab}</span>
                  <input
                    type="number"
                    value={ticketForm[k]}
                    onChange={(e) => setTicketForm((f) => ({ ...f, [k]: Number(e.target.value) }))}
                  />
                </div>
              ))}
              <input
                value={ticketForm.rationale}
                onChange={(e) => setTicketForm((f) => ({ ...f, rationale: e.target.value }))}
                placeholder="Rationale"
              />
              <button type="button" className="forge" disabled={busy} onClick={submitTicket}>
                SUBMIT TICKET → RISK GATE
              </button>
            </article>

            <article className="result">
              <label>DESK ARENA / RISK</label>
              {!deskArena ? (
                <p className="muted">Run desk arena to score mm / degen / arb / whale agents against trading limits.</p>
              ) : (
                <>
                  <div className="kv">
                    <span>Accepted / Rejected</span>
                    <b>
                      {deskArena.n_accepted} / {deskArena.n_rejected}
                    </b>
                  </div>
                  {deskArena.winner && (
                    <div className="winner">
                      <Pill ok>WINNER · {deskArena.winner.ticket?.agent}</Pill>
                      <p>{deskArena.winner.ticket?.rationale}</p>
                    </div>
                  )}
                  <div className="plans">
                    {(deskArena.results || []).map((r, i) => (
                      <div key={i} className={`plan ${r.accepted ? "yes" : "no"}`}>
                        <header>
                          <b>
                            {r.ticket.agent} · {r.ticket.venue_id} · {r.ticket.pair}
                          </b>
                          <Pill ok={r.accepted}>{r.accepted ? "ACCEPT" : "REJECT"}</Pill>
                        </header>
                        <p>
                          {r.ticket.side} {r.ticket.qty} @ {r.ticket.limit_price} · notional{" "}
                          {Number(r.ticket.notional || r.ticket.qty * r.ticket.limit_price).toFixed(0)}
                        </p>
                        {!r.accepted && (
                          <ul>
                            {(r.reasons || r.violations || []).map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </article>

            <article className="result">
              <label>BOOK · POSITIONS · TICKETS</label>
              <label>Positions</label>
              {(desk?.positions || []).length === 0 ? (
                <p className="muted sm">Flat.</p>
              ) : (
                (desk.positions || []).map((p) => (
                  <div key={p.venue_id + p.pair} className="proto">
                    <b>
                      {p.pair} · {p.venue_id}
                    </b>
                    <div className="muted sm">
                      qty {p.qty.toFixed?.(4) ?? p.qty} · avg {Number(p.avg_price).toFixed(4)} · uPnL{" "}
                      {Number(p.unrealized_pnl).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
              <label>Recent tickets</label>
              <div className="plans">
                {(desk?.tickets_recent || []).slice(0, 12).map((t) => (
                  <div
                    key={t.ticket_id}
                    className={`plan ${
                      t.status === "paper_filled" || t.status === "risk_accepted" ? "yes" : "no"
                    }`}
                  >
                    <header>
                      <b>
                        {t.side} {t.pair}
                      </b>
                      <Pill ok={t.status !== "risk_rejected"}>{t.status}</Pill>
                    </header>
                    <p>
                      {t.agent} · {t.venue_id} · {t.qty} @ {t.limit_price}
                    </p>
                    {t.status === "risk_accepted" && (
                      <button type="button" className="ghost" disabled={busy} onClick={() => fillTicket(t.ticket_id)}>
                        Paper fill
                      </button>
                    )}
                    {(t.status === "risk_accepted" ||
                      t.status === "paper_filled" ||
                      t.status === "routed_sim") && (
                      <button
                        type="button"
                        className="ghost"
                        disabled={busy}
                        onClick={() => routeVault(t.ticket_id)}
                      >
                        Vault route sim
                      </button>
                    )}
                    {t.reasons?.length > 0 && t.status === "risk_rejected" && (
                      <ul>
                        {t.reasons.slice(0, 3).map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              {vaultRoute && (
                <>
                  <label>VAULT ROUTE</label>
                  <Pill ok={vaultRoute.would_execute}>
                    {vaultRoute.would_execute ? "WOULD EXECUTE" : "BLOCKED"}
                  </Pill>
                  <p className="muted sm">{vaultRoute.narrative}</p>
                  {vaultRoute.cast_command && <pre className="code sm">{vaultRoute.cast_command}</pre>}
                  {vaultRoute.next && <p className="muted sm">{vaultRoute.next}</p>}
                </>
              )}
              <label>Venues</label>
              <div className="proto-list" style={{ maxHeight: 160 }}>
                {(desk?.venues || []).map((v) => (
                  <div key={v.id} className="proto">
                    <b>{v.name}</b>
                    <span className="muted">
                      {" "}
                      · {v.kind} · {v.adapter_status || v.atlas_status}
                    </span>
                    <p className="muted sm">{v.use}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {tab === "academy" && (
        <section className="panel grid2">
          <article>
            <label>FAILURE-FIRST QUESTS</label>
            <div className="chips col">
              {quests.map((q) => (
                <button key={q.id} type="button" className={questId === q.id ? "on" : ""} onClick={() => setQuestId(q.id)}>
                  {q.title}
                </button>
              ))}
            </div>
            {quest && (
              <>
                <h3>{quest.title}</h3>
                <p>{quest.lesson}</p>
                <p className="ai">
                  <b>AI constraint:</b> {quest.ai_constraint}
                </p>
                <p className="muted">{quest.why_it_matters}</p>
                {(quest.options || []).map((opt, i) => (
                  <button key={i} type="button" className={`option ${pick === i ? "on" : ""}`} onClick={() => setPick(i)}>
                    <b>
                      {opt.agent} · {opt.protocol}
                    </b>
                    <span>
                      slip {opt.slippage_bps} · lev {opt.resulting_leverage_bps} · {opt.rationale}
                    </span>
                  </button>
                ))}
                <label className="check">
                  <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />I
                  understand why the lawful plan is safer
                </label>
                <button type="button" className="forge" disabled={busy} onClick={runGrade}>
                  GRADE LAB →
                </button>
              </>
            )}
          </article>
          <article className="result">
            <label>CERTIFICATE</label>
            {!grade ? (
              <p className="muted">Pass a lab to seal an academy receipt.</p>
            ) : (
              <>
                <Pill ok={grade.passed}>{grade.passed ? "PASSED" : "NOT YET"}</Pill>
                <p className="cert">{grade.certificate_line}</p>
                <p>{grade.chosen_summary}</p>
                {(grade.graded_options || []).map((g, i) => (
                  <div key={i} className={`plan ${g.evaluation.accepted ? "yes" : "no"}`}>
                    <header>
                      <b>{g.action.agent}</b>
                      <Pill ok={g.evaluation.accepted}>{g.evaluation.accepted ? "ACCEPT" : "REJECT"}</Pill>
                    </header>
                  </div>
                ))}
              </>
            )}
          </article>
        </section>
      )}

      {tab === "codex" && (
        <section className="panel grid2">
          <article>
            <label>ECOSYSTEM ATLAS</label>
            <div className="proto-list">
              {protocols.map((p) => (
                <div key={p.id} className="proto">
                  <div>
                    <b>{p.name}</b>
                    <span className="muted">
                      {" "}
                      · {p.category} · {p.adapter_status}
                    </span>
                  </div>
                  <div className="caps">{(p.capabilities || []).join(" · ")}</div>
                  {p.notes ? <p className="muted sm">{p.notes}</p> : null}
                </div>
              ))}
            </div>
          </article>
          <article className="result">
            <label>NETWORK + DEPLOY</label>
            <button type="button" className="ghost block" disabled={busy} onClick={probeRpc}>
              Probe RPC live
            </button>
            {rpc && (
              <div className="kv">
                <span>RPC</span>
                <Pill ok={rpc.ok} warn={!rpc.ok}>
                  {rpc.ok ? `chain ${rpc.observed_chain_id}` : rpc.error || "fail"}
                </Pill>
              </div>
            )}
            <div className="kv">
              <span>Spark contract</span>
              <b>SovereignVault</b>
            </div>
            <div className="kv">
              <span>Address</span>
              <code>{vault || "not deployed"}</code>
            </div>
            {vault ? (
              <a
                className="link"
                href={deployment?.explorer_vault || `https://testnet.monadvision.com/address/${vault}`}
                target="_blank"
                rel="noreferrer"
              >
                Explorer →
              </a>
            ) : (
              <pre className="code sm">./scripts/deploy.sh testnet</pre>
            )}
            <label>RECEIPTS</label>
            <div className="receipts">
              {receipts
                .slice()
                .reverse()
                .map((r) => (
                  <div key={r.receipt_hash} className="rcp">
                    <b>{r.kind}</b>
                    <code>{r.receipt_hash?.slice(0, 14)}…</code>
                  </div>
                ))}
            </div>
          </article>
        </section>
      )}

      {tab === "judge" && (
        <section className="panel">
          <article className="result judge">
            <label>JUDGE / AI AGENT PROOF PANEL</label>
            <p className="doctrine">{judge?.doctrine || health?.doctrine}</p>
            <div className="grid2 tight">
              <div>
                <div className="kv">
                  <span>Product</span>
                  <b>{judge?.product}</b>
                </div>
                <div className="kv">
                  <span>Version</span>
                  <b>{judge?.version}</b>
                </div>
                <div className="kv">
                  <span>Vaporware</span>
                  <Pill ok={!judge?.vaporware}>{String(judge?.vaporware)}</Pill>
                </div>
                <div className="kv">
                  <span>Live API</span>
                  <Pill ok={judge?.live_api}>{String(judge?.live_api)}</Pill>
                </div>
                <div className="kv">
                  <span>Contract set</span>
                  <b>{(judge?.features?.contracts || []).join(", ")}</b>
                </div>
              </div>
              <div>
                <div className="kv">
                  <span>Pipeline stages</span>
                  <b>{judge?.features?.pipeline_stages}</b>
                </div>
                <div className="kv">
                  <span>Academy quests</span>
                  <b>{judge?.features?.academy_quests}</b>
                </div>
                <div className="kv">
                  <span>Protocols</span>
                  <b>{judge?.features?.protocols}</b>
                </div>
                <div className="kv">
                  <span>Vault on chain</span>
                  <Pill ok={judge?.checklist?.contract_address}>
                    {judge?.checklist?.contract_address ? "yes" : "pending deploy"}
                  </Pill>
                </div>
                <div className="kv">
                  <span>Github</span>
                  <a className="link" href={judge?.repo} target="_blank" rel="noreferrer">
                    repo
                  </a>
                </div>
              </div>
            </div>
            <label>REAL PATHS (not mocks)</label>
            <ul className="pillars">
              {(judge?.checklist?.real_api_paths || []).map((p) => (
                <li key={p}>
                  <code>{p}</code>
                </li>
              ))}
            </ul>
          </article>
        </section>
      )}

      <footer className="pipeline">
        INTENT <b>→</b> MAP <b>→</b> ARCH <b>→</b> POLICY <b>→</b> CODEGEN <b>→</b> VALIDATE <b>→</b> ARENA <b>→</b>{" "}
        READY <b>→</b> DEPLOY* <b>→</b> VERIFY* <b>→</b> RECEIPT
        <div className="muted sm">* operator-gated (no keys in browser)</div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
