import React, { useMemo, useState } from "react";

const ACTORS = [
  { id: "thesis", name: "THESIS", role: "Orchestrator", capability: "Decomposes objectives, forms teams, and resolves dependencies." },
  { id: "oracle", name: "ORACLE", role: "Intelligence", capability: "Collects market and protocol evidence for the team." },
  { id: "sentinel", name: "SENTINEL", role: "Risk", capability: "Evaluates constraints and blocks unsafe paths." },
  { id: "forge", name: "FORGE", role: "Builder", capability: "Produces contracts, interfaces, tests, and manifests." },
  { id: "operator", name: "OPERATOR", role: "Execution", capability: "Prepares governed on-chain action plans and simulations." },
  { id: "arbiter", name: "ARBITER", role: "Verification", capability: "Checks outputs, receipts, SLAs, and disputes." },
];

const PHASES = ["discover", "decompose", "delegate", "execute", "verify", "approval-ready"];

export function AutonomousEconomy({ api, network, disabled }) {
  const [objective, setObjective] = useState(
    "Find a sustainable Monad service opportunity, design the service, test it, and produce a proof-backed launch plan."
  );
  const [budget, setBudget] = useState(100);
  const [run, setRun] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const team = useMemo(() => ACTORS.map((a, index) => ({ ...a, allocation: Math.max(5, Math.round(budget / (index + 4))) })), [budget]);

  async function startSwarm() {
    setBusy(true);
    setErr("");
    try {
      const started = Date.now();
      const [nomos, company] = await Promise.all([
        api("/nomos/run", {
          method: "POST",
          body: JSON.stringify({
            name: "Autonomous Service Swarm",
            objective,
            categories: ["agent", "analytics", "vault"],
            network,
          }),
        }),
        api("/company/run", {
          method: "POST",
          body: JSON.stringify({
            objective: `Autonomous multi-agent mission: ${objective}. Internal operating budget: ${budget} credits. Irreversible actions require owner approval.`,
          }),
        }),
      ]);

      const agentRuns = [];
      for (const actor of team.slice(1, 5)) {
        const result = await api("/agent/step", {
          method: "POST",
          body: JSON.stringify({
            goal: `${actor.name}: ${actor.capability} Objective: ${objective}`,
            network,
            note: `role=${actor.role}; allocation=${actor.allocation}; coordination=thesis-swarm`,
            execute: true,
          }),
        });
        agentRuns.push({ actor, result });
      }

      const receipts = await api("/receipts/recent?n=12");
      setRun({
        objective,
        phases: PHASES,
        nomos,
        company: company.mission || company,
        agentRuns,
        receipts: receipts.receipts || [],
        elapsedMs: Date.now() - started,
        status: "approval-ready",
      });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" style={{ marginTop: 12 }}>
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">AUTONOMOUS ECONOMIC ACTORS · MULTI-AGENT SYSTEM</span>
          <h3>Independent agents coordinate work, resources, proof, and reputation.</h3>
          <p className="muted sm">
            THESIS forms a temporary agent organization, assigns internal budgets, runs parallel specialists,
            arbitrates outputs, and produces an approval-ready result. Irreversible on-chain actions remain constitution-gated.
          </p>
        </div>
        <div className="win-actions">
          <button type="button" className="forge win-btn" disabled={disabled || busy || !objective.trim()} onClick={startSwarm}>
            {busy ? "SWARM RUNNING…" : "START AUTONOMOUS SWARM →"}
          </button>
        </div>
      </div>

      {err ? <div className="banner err">{err}</div> : null}

      <div className="grid2">
        <article>
          <label>OWNER OBJECTIVE</label>
          <textarea className="term-input" style={{ width: "100%", minHeight: 100 }} value={objective} onChange={(e) => setObjective(e.target.value)} />
          <label>INTERNAL OPERATING BUDGET · {budget} CREDITS</label>
          <input type="range" min="25" max="500" step="25" value={budget} onChange={(e) => setBudget(Number(e.target.value))} style={{ width: "100%" }} />
          <p className="muted sm">Credits coordinate agent effort inside the mission. They are not transferred on-chain.</p>
        </article>
        <article>
          <label>SWARM CONSTITUTION</label>
          <div className="kv"><span>Independent planning</span><b>enabled</b></div>
          <div className="kv"><span>Peer delegation</span><b>enabled</b></div>
          <div className="kv"><span>Parallel execution</span><b>enabled</b></div>
          <div className="kv"><span>Proof required</span><b>enabled</b></div>
          <div className="kv"><span>Irreversible action</span><b>owner approval</b></div>
        </article>
      </div>

      <div className="grid3" style={{ marginTop: 12 }}>
        {team.map((actor) => (
          <article key={actor.id}>
            <span className="eyebrow">{actor.role}</span>
            <h3>{actor.name}</h3>
            <p className="muted sm">{actor.capability}</p>
            <div className="kv"><span>Allocation</span><b>{actor.allocation} credits</b></div>
            <div className="kv"><span>Autonomy</span><b>{actor.id === "thesis" ? "orchestrates" : "bounded"}</b></div>
          </article>
        ))}
      </div>

      {run ? (
        <div className="grid2" style={{ marginTop: 12 }}>
          <article className="result">
            <label>COORDINATION TRACE</label>
            {(run.phases || []).map((phase, i) => <div className="kv" key={phase}><span>{i + 1}. {phase}</span><b>{phase === run.status ? "current" : "complete"}</b></div>)}
            <div className="kv"><span>Elapsed</span><b>{run.elapsedMs} ms</b></div>
            <div className="kv"><span>Agents completed</span><b>{run.agentRuns.length}</b></div>
          </article>
          <article className="result">
            <label>SWARM OUTPUT</label>
            {run.agentRuns.map(({ actor, result }) => (
              <div key={actor.id} style={{ marginBottom: 10 }}>
                <b>{actor.name}</b>
                <p className="muted sm">{result.answer || result.intent || "completed"}</p>
              </div>
            ))}
            <div className="kv"><span>Proof receipts</span><b>{run.receipts.length}</b></div>
            <div className="kv"><span>Final state</span><b>approval-ready</b></div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
