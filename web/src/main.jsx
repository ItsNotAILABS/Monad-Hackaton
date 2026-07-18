import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const CATEGORIES = [
  "dex",
  "lending",
  "vault",
  "staking",
  "perps",
  "analytics",
  "agent",
];

const API =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof window !== "undefined" && window.location.port === "5173"
    ? "/api"
    : "http://127.0.0.1:8043");

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

function Pill({ ok, children }) {
  return <span className={`pill ${ok ? "ok" : "bad"}`}>{children}</span>;
}

function App() {
  const [tab, setTab] = useState("studio");
  const [health, setHealth] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Studio
  const [name, setName] = useState("THESIS Sovereign Ops");
  const [objective, setObjective] = useState(
    "Coordinate my Monad portfolio across swaps, lending, and vaults while agents only propose actions that pass my lawbook."
  );
  const [selected, setSelected] = useState(["dex", "lending", "vault", "staking", "analytics"]);
  const [network, setNetwork] = useState("monad-testnet");
  const [forgeResult, setForgeResult] = useState(null);

  // Nomos
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [arena, setArena] = useState(null);

  // Academy
  const [quests, setQuests] = useState([]);
  const [questId, setQuestId] = useState("");
  const [quest, setQuest] = useState(null);
  const [pick, setPick] = useState(0);
  const [understood, setUnderstood] = useState(false);
  const [grade, setGrade] = useState(null);

  // Codex / deploy
  const [protocols, setProtocols] = useState([]);
  const [deployment, setDeployment] = useState(null);

  const status = useMemo(() => {
    if (busy) return "WORKING";
    if (err) return "ERROR";
    if (health?.status === "operational") return "ONLINE";
    return "BOOT";
  }, [busy, err, health]);

  const refresh = useCallback(async () => {
    try {
      const [h, p, d, q] = await Promise.all([
        api("/health"),
        api("/protocols"),
        api("/deployment"),
        api("/academy/quests"),
      ]);
      setHealth(h);
      setProtocols(p);
      setDeployment(d);
      setQuests(q.quests || []);
      if (!questId && q.quests?.length) setQuestId(q.quests[0].id);
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
    let cancelled = false;
    (async () => {
      try {
        const q = await api(`/academy/quests/${questId}`);
        if (!cancelled) {
          setQuest(q);
          setPick(0);
          setGrade(null);
          setUnderstood(false);
        }
      } catch (e) {
        if (!cancelled) setErr(String(e.message || e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [questId]);

  async function runForge() {
    setBusy(true);
    setErr("");
    try {
      const body = {
        name,
        objective,
        categories: selected,
        network,
        policy: {
          ...policy,
          allowed_categories: selected,
        },
      };
      const data = await api("/forge", { method: "POST", body: JSON.stringify(body) });
      setForgeResult(data);
      setTab("studio");
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function runArena() {
    setBusy(true);
    setErr("");
    try {
      const actions = [
        {
          agent: "reckless",
          category: "perps",
          protocol: "perpl",
          action: "open",
          value: 5000,
          slippage_bps: 900,
          resulting_protocol_exposure_bps: 9000,
          resulting_liquid_reserve_bps: 100,
          resulting_leverage_bps: 50000,
          expected_gain_bps: 900,
          risk_bps: 400,
          rationale: "Max degen — should REJECT",
        },
        {
          agent: "balanced",
          category: "vault",
          protocol: "beefy",
          action: "deposit",
          value: 100,
          slippage_bps: 10,
          resulting_protocol_exposure_bps: 1200,
          resulting_liquid_reserve_bps: 4000,
          resulting_leverage_bps: 10000,
          expected_gain_bps: 400,
          risk_bps: 60,
          rationale: "Lawful vault deposit — should ACCEPT",
        },
        {
          agent: "careful",
          category: "lending",
          protocol: "aave",
          action: "supply",
          value: 80,
          slippage_bps: 5,
          resulting_protocol_exposure_bps: 800,
          resulting_liquid_reserve_bps: 5000,
          resulting_leverage_bps: 10000,
          expected_gain_bps: 200,
          risk_bps: 30,
          rationale: "Conservative supply",
        },
      ];
      const data = await api("/arena", {
        method: "POST",
        body: JSON.stringify({ actions, policy }),
      });
      setArena(data);
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
        body: JSON.stringify({
          quest_id: questId,
          selected_action_index: pick,
          understood,
        }),
      });
      setGrade(data);
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

  return (
    <main>
      <header>
        <div>
          <span className="eyebrow">MONAD AI WORKSTATION · SPARK</span>
          <h1>
            THESIS <i>Forge</i>
          </h1>
          <p className="tagline">
            Agents propose. Laws decide. Humans &amp; AIs learn by failing safely.
          </p>
        </div>
        <div className="header-right">
          <div className={`status s-${status.toLowerCase()}`}>{status}</div>
          <button type="button" className="ghost" onClick={refresh}>
            Refresh
          </button>
        </div>
      </header>

      {err ? <div className="banner err">API: {err} — start engine on :8043 or set VITE_API_URL</div> : null}

      <nav className="tabs">
        {[
          ["studio", "STUDIO"],
          ["nomos", "NOMOS"],
          ["academy", "ACADEMY"],
          ["codex", "CODEX"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "on" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "studio" && (
        <section className="panel grid2">
          <article>
            <label>PROJECT NAME</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <label>MISSION OBJECTIVE</label>
            <textarea value={objective} onChange={(e) => setObjective(e.target.value)} />
            <label>NETWORK</label>
            <div className="chips">
              {[
                ["monad-testnet", "Testnet 10143"],
                ["monad-mainnet", "Mainnet 143"],
              ].map(([id, lab]) => (
                <button
                  key={id}
                  type="button"
                  className={network === id ? "on" : ""}
                  onClick={() => setNetwork(id)}
                >
                  {lab}
                </button>
              ))}
            </div>
            <label>ECOSYSTEM PLANES</label>
            <div className="chips">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={selected.includes(c) ? "on" : ""}
                  onClick={() =>
                    setSelected((s) =>
                      s.includes(c) ? s.filter((x) => x !== c) : [...s, c]
                    )
                  }
                >
                  {c}
                </button>
              ))}
            </div>
            <button type="button" className="forge" disabled={busy} onClick={runForge}>
              FORGE MANIFEST → LIVE API
            </button>
          </article>
          <article className="result">
            <label>SEALED OUTPUT</label>
            {!forgeResult ? (
              <p className="muted">
                Hit forge to compile a typed manifest, deploy plan (Foundry / Monad docs path), and
                hash-linked receipt. No mock toasts.
              </p>
            ) : (
              <>
                <div className="kv">
                  <span>Project</span>
                  <b>{forgeResult.manifest.project_id}</b>
                </div>
                <div className="kv">
                  <span>Chain</span>
                  <b>
                    {forgeResult.manifest.network} · {forgeResult.manifest.chain_id}
                  </b>
                </div>
                <div className="kv">
                  <span>Manifest</span>
                  <code>{forgeResult.manifest.manifest_hash.slice(0, 24)}…</code>
                </div>
                <div className="kv">
                  <span>Receipt</span>
                  <code>{forgeResult.receipt.receipt_hash.slice(0, 24)}…</code>
                </div>
                <label>DEPLOY PLAN</label>
                <pre>
                  {forgeResult.manifest.deploy_plan?.commands?.deploy_script}
                  {"\n"}
                  {forgeResult.manifest.deploy_plan?.commands?.forge_script}
                </pre>
                <label>SCAFFOLD · PROJECT.md</label>
                <pre>{forgeResult.scaffold?.["PROJECT.md"]}</pre>
              </>
            )}
          </article>
        </section>
      )}

      {tab === "nomos" && (
        <section className="panel">
          <div className="grid2">
            <article>
              <label>LAWBOOK</label>
              <p className="muted">Edit laws. Arena scores competing agent plans. Reject is a feature.</p>
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
                    value={policy[k]}
                    onChange={(e) =>
                      setPolicy((p) => ({ ...p, [k]: Number(e.target.value) }))
                    }
                  />
                </div>
              ))}
              <button type="button" className="forge" disabled={busy} onClick={runArena}>
                RUN ARENA · LIVE API
              </button>
            </article>
            <article className="result">
              <label>ARENA RESULT</label>
              {!arena ? (
                <p className="muted">Run arena to score reckless vs balanced plans under your lawbook.</p>
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
                    {arena.evaluations?.map((row, i) => (
                      <div
                        key={i}
                        className={`plan ${row.evaluation.accepted ? "yes" : "no"}`}
                      >
                        <header>
                          <b>{row.action.agent}</b>
                          <Pill ok={row.evaluation.accepted}>
                            {row.evaluation.accepted ? "ACCEPT" : "REJECT"}
                          </Pill>
                        </header>
                        <p>
                          {row.action.protocol} · {row.action.action} · score{" "}
                          {row.evaluation.score}
                        </p>
                        {!row.evaluation.accepted && (
                          <ul>
                            {(row.evaluation.reasons || row.evaluation.violations || []).map(
                              (r) => (
                                <li key={r}>{r}</li>
                              )
                            )}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                  {arena.receipt && (
                    <div className="kv">
                      <span>Receipt</span>
                      <code>{arena.receipt.receipt_hash.slice(0, 28)}…</code>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
        </section>
      )}

      {tab === "academy" && (
        <section className="panel grid2">
          <article>
            <label>FAILURE-FIRST QUESTS</label>
            <p className="muted">
              Learn DeFi risk by picking plans. The certificate requires understanding — not luck.
            </p>
            <div className="chips col">
              {quests.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={questId === q.id ? "on" : ""}
                  onClick={() => setQuestId(q.id)}
                >
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
                <label>PICK A PLAN</label>
                {(quest.options || []).map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`option ${pick === i ? "on" : ""}`}
                    onClick={() => setPick(i)}
                  >
                    <b>
                      {opt.agent} · {opt.protocol}
                    </b>
                    <span>
                      slip {opt.slippage_bps}bps · lev {opt.resulting_leverage_bps} ·{" "}
                      {opt.rationale}
                    </span>
                  </button>
                ))}
                <label className="check">
                  <input
                    type="checkbox"
                    checked={understood}
                    onChange={(e) => setUnderstood(e.target.checked)}
                  />
                  I understand why the lawful plan is safer
                </label>
                <button type="button" className="forge" disabled={busy} onClick={runGrade}>
                  GRADE LAB → LIVE API
                </button>
              </>
            )}
          </article>
          <article className="result">
            <label>LAB CERTIFICATE</label>
            {!grade ? (
              <p className="muted">Complete a quest to seal an academy receipt.</p>
            ) : (
              <>
                <Pill ok={grade.passed}>{grade.passed ? "PASSED" : "NOT YET"}</Pill>
                <p className="cert">{grade.certificate_line}</p>
                <p>{grade.chosen_summary}</p>
                {grade.receipt && (
                  <div className="kv">
                    <span>Receipt</span>
                    <code>{grade.receipt.receipt_hash.slice(0, 28)}…</code>
                  </div>
                )}
                <label>ALL OPTIONS GRADED</label>
                {(grade.graded_options || []).map((g, i) => (
                  <div key={i} className={`plan ${g.evaluation.accepted ? "yes" : "no"}`}>
                    <header>
                      <b>{g.action.agent}</b>
                      <Pill ok={g.evaluation.accepted}>
                        {g.evaluation.accepted ? "ACCEPT" : "REJECT"}
                      </Pill>
                    </header>
                  </div>
                ))}
              </>
            )}
          </article>
        </section>
      )}

      {tab === "codex" && (
        <section className="panel">
          <div className="grid2">
            <article>
              <label>ECOSYSTEM ATLAS</label>
              <p className="muted">
                Honest adapter status. Live ≠ simulated. Prefer official explorers for addresses.
              </p>
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
              <label>MONAD · DEPLOYMENT</label>
              <div className="kv">
                <span>API</span>
                <b>{health?.status || "offline"}</b>
              </div>
              <div className="kv">
                <span>Chain</span>
                <b>{deployment?.chainId || 10143}</b>
              </div>
              <div className="kv">
                <span>Spark contract</span>
                <b>SovereignVault</b>
              </div>
              <div className="kv">
                <span>Address</span>
                <code>{vault || "not deployed — run scripts/deploy.sh"}</code>
              </div>
              {(deployment?.explorer_vault || vault) && vault ? (
                <a
                  className="link"
                  href={
                    deployment?.explorer_vault ||
                    `https://testnet.monadvision.com/address/${vault}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Open explorer →
                </a>
              ) : null}
              <label>PILLARS</label>
              <ul className="pillars">
                {(health?.pillars || []).map((p) => (
                  <li key={p.id}>
                    <b>{p.name}</b> — {p.role}
                  </li>
                ))}
              </ul>
              <p className="doctrine">{health?.doctrine}</p>
            </article>
          </div>
        </section>
      )}

      <footer className="pipeline">
        OBJECTIVE <b>→</b> MANIFEST <b>→</b> LAWS <b>→</b> REJECT/ACCEPT <b>→</b> MONAD DEPLOY{" "}
        <b>→</b> RECEIPT
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
