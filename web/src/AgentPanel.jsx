import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MicButton } from "./MicButton.jsx";
import { runHybrid } from "./workers/hybrid.js";
import { AutonomousEconomy } from "./AutonomousEconomy.jsx";

const SERVICES = [
  { id: "sentinel", name: "SENTINEL", role: "Risk and policy audit", quote: "0.08 MON", sla: "90 sec", output: "Policy verdict and execution receipt" },
  { id: "oracle", name: "ORACLE", role: "Market and protocol intelligence", quote: "0.05 MON", sla: "60 sec", output: "Evidence-backed market brief" },
  { id: "forge", name: "FORGE", role: "Smart-contract and app generation", quote: "0.25 MON", sla: "10 min", output: "Build package, tests, manifest, and receipt" },
  { id: "operator", name: "OPERATOR", role: "On-chain operations planning", quote: "0.12 MON", sla: "3 min", output: "Governed action plan and simulation proof" },
  { id: "publisher", name: "PUBLISHER", role: "Research and ecosystem publishing", quote: "0.06 MON", sla: "4 min", output: "Publication package and provenance receipt" },
  { id: "arbiter", name: "ARBITER", role: "Agent-job verification", quote: "0.04 MON", sla: "45 sec", output: "Acceptance, rejection, or dispute evidence" },
];

export function AgentPanel({ api, network, busy: parentBusy, onNavigate }) {
  const [status, setStatus] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [selected, setSelected] = useState(SERVICES[0]);
  const [goal, setGoal] = useState("Audit a proposed Monad service and return a governed proof receipt");
  const [job, setJob] = useState(null);
  const [worker, setWorker] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const disabled = busy || parentBusy;

  const refresh = useCallback(async () => {
    try {
      const [agent, recent] = await Promise.all([api("/agent"), api("/receipts/recent?n=8")]);
      setStatus(agent);
      setReceipts(recent.receipts || []);
      setErr("");
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, [api]);

  useEffect(() => { refresh(); }, [refresh]);

  const economy = useMemo(() => ({
    services: SERVICES.length,
    completed: receipts.length,
    reputation: Math.min(100, 72 + receipts.length * 2),
    settlement: network === "monad-mainnet" ? "wallet approval required" : "testnet simulation",
  }), [network, receipts.length]);

  async function hireService(service = selected) {
    setSelected(service);
    setBusy(true);
    setErr("");
    try {
      let residual = null;
      try {
        const out = await runHybrid("pulse", { goal, service: service.id, network, senses: { market: 1, law: 1, service: service.id } });
        residual = out.result || out;
        setWorker(residual);
      } catch { /* browser worker is optional */ }

      const mission = await api("/company/run", {
        method: "POST",
        body: JSON.stringify({ objective: `${service.name} service job: ${goal}. Required output: ${service.output}. Quote: ${service.quote}.` }),
      });
      const step = await api("/agent/step", {
        method: "POST",
        body: JSON.stringify({ goal, network, note: `service=${service.id}; quote=${service.quote}; sla=${service.sla}`, execute: true }),
      });
      const recent = await api("/receipts/recent?n=8");
      setReceipts(recent.receipts || []);
      setJob({
        service,
        mission: mission.mission || mission,
        step,
        residual,
        stage: "proof-issued",
        settlement: network === "monad-mainnet" ? "awaiting owner wallet approval" : "simulated on testnet",
      });
      await refresh();
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
          <span className="eyebrow">DECENTRALIZED AGENT ECONOMY · MONAD</span>
          <h3>Hire autonomous services. Govern the work. Verify the proof.</h3>
          <p className="muted sm">Agents publish service capabilities, accept scoped jobs, execute under THESIS laws, and return machine-checkable receipts before settlement.</p>
          <div className="chips tight">
            <span className="badge on">{economy.services} services</span>
            <span className="badge on">{economy.completed} receipts</span>
            <span className="badge on">reputation {economy.reputation}</span>
            <span className="badge warn">{economy.settlement}</span>
          </div>
        </div>
        <div className="win-actions">
          <button type="button" className="forge win-btn" disabled={disabled} onClick={() => hireService(selected)}>HIRE {selected.name} →</button>
          <button type="button" className="ghost" onClick={() => onNavigate?.("proof")}>PROOF</button>
          <button type="button" className="ghost" onClick={() => onNavigate?.("studio")}>PUBLISH SERVICE</button>
        </div>
      </div>

      {err ? <div className="banner err">{err}</div> : null}

      <div className="grid3">
        {SERVICES.map((service) => (
          <article key={service.id} className={selected.id === service.id ? "result" : ""} onClick={() => setSelected(service)} style={{ cursor: "pointer" }}>
            <span className="eyebrow">{service.id}</span>
            <h3>{service.name}</h3>
            <p>{service.role}</p>
            <div className="kv"><span>Quote</span><b>{service.quote}</b></div>
            <div className="kv"><span>SLA</span><b>{service.sla}</b></div>
            <p className="muted sm">{service.output}</p>
            <button type="button" className="ghost block" disabled={disabled} onClick={(e) => { e.stopPropagation(); hireService(service); }}>CREATE JOB</button>
          </article>
        ))}
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        <article>
          <label>SERVICE REQUEST</label>
          <textarea className="term-input" style={{ width: "100%", minHeight: 110 }} value={goal} onChange={(e) => setGoal(e.target.value)} />
          <div className="chips tight" style={{ marginTop: 8 }}>
            <MicButton label="DICTATE JOB" disabled={disabled} onText={setGoal} />
            <button type="button" className="forge" disabled={disabled || !goal.trim()} onClick={() => hireService(selected)}>ISSUE GOVERNED JOB</button>
          </div>
          <p className="muted sm">The current build creates a governed mission, runs the agent cycle, and records proof. Mainnet value transfer remains owner-approved.</p>
        </article>

        <article className="result">
          <label>JOB LIFECYCLE</label>
          {!job ? <p className="muted">Select a service and issue a job.</p> : <>
            <div className="kv"><span>Provider</span><b>{job.service.name}</b></div>
            <div className="kv"><span>Stage</span><b>{job.stage}</b></div>
            <div className="kv"><span>Settlement</span><b>{job.settlement}</b></div>
            <div className="kv"><span>Mission</span><b>{job.mission?.mission_id || job.mission?.id || "created"}</b></div>
            <pre className="code sm" style={{ maxHeight: 220, overflow: "auto" }}>{job.step?.answer || JSON.stringify(job.step, null, 2)}</pre>
          </>}
        </article>
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        <article>
          <label>PROOF AND REPUTATION</label>
          {(receipts || []).slice(0, 6).map((r, i) => <div className="kv" key={r.id || r.receipt_id || i}><span>{r.kind || r.type || "service receipt"}</span><b>{r.status || "recorded"}</b></div>)}
          {!receipts.length ? <p className="muted sm">No receipts returned yet.</p> : null}
        </article>
        <article>
          <label>AGENT RUNTIME</label>
          <div className="kv"><span>Runtime step</span><b>{status?.step ?? "—"}</b></div>
          <div className="kv"><span>Network</span><b>{network}</b></div>
          <div className="kv"><span>Browser worker</span><b>{worker ? "active" : "ready"}</b></div>
          <p className="muted sm">Service discovery → quote → governed job → execution → proof → owner-approved settlement.</p>
        </article>
      </div>

      <AutonomousEconomy api={api} network={network} disabled={disabled} />
    </section>
  );
}
