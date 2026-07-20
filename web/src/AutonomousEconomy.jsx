import React, { useMemo, useState } from "react";
import { createBatchJobs, explorerTransactionUrl } from "./chain/agentEconomy.js";

export function AutonomousEconomy({ api, disabled, config, services, wallet, onWallet, onRefresh }) {
  const [objective, setObjective] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [run, setRun] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const selected = useMemo(() => services.filter((service) => selectedIds.includes(service.id)), [services, selectedIds]);
  const total = useMemo(() => selected.reduce((sum, service) => sum + Number(service.price || 0), 0), [selected]);

  function toggle(serviceId) {
    setSelectedIds((current) => current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]);
  }

  async function start() {
    if (!objective.trim() || !selected.length) return;
    setBusy(true); setErr("");
    try {
      const funded = await createBatchJobs({ services: selected, request: objective });
      onWallet?.(funded.address);
      const [nomos, company] = await Promise.all([
        api("/nomos/run", { method: "POST", body: JSON.stringify({ name: `Team ${funded.teamId}`, objective, categories: ["agent"], network: config?.network?.name }) }),
        api("/company/run", { method: "POST", body: JSON.stringify({ objective: `Execute on-chain team ${funded.teamId}: ${objective}. Each provider owns its funded job; results require receipt-backed settlement.` }) }),
      ]);
      setRun({ funded, nomos, company: company.mission || company, status: "funded-on-chain" });
      await onRefresh?.();
    } catch (error) { setErr(String(error?.shortMessage || error?.message || error)); }
    finally { setBusy(false); }
  }

  return <section className="panel" style={{ marginTop: 12 }}>
    <div className="win-strip platform-strip"><div className="win-copy"><span className="eyebrow">AUTONOMOUS MULTI-AGENT ECONOMY</span><h3>Form a wallet-backed agent team from services that actually exist on-chain.</h3><p className="muted sm">THESIS decomposes and coordinates the objective. Solidity creates one funded escrow job per selected provider and emits a shared team identifier. Providers execute independently and submit their own proof receipts.</p></div><div className="win-actions"><button type="button" className="forge win-btn" disabled={disabled || busy || !objective.trim() || !selected.length} onClick={start}>{busy ? "FUNDING TEAM…" : "SIGN + FUND TEAM"}</button></div></div>
    {err ? <div className="banner err">{err}</div> : null}
    <div className="grid2"><article><label>TEAM OBJECTIVE</label><textarea className="term-input" style={{ width: "100%", minHeight: 110 }} value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Define the measurable result, evidence requirements, constraints, and acceptance criteria."/><div className="kv"><span>Wallet</span><b>{wallet || "connect on signature"}</b></div><div className="kv"><span>Selected services</span><b>{selected.length}</b></div><div className="kv"><span>Total escrow</span><b>{total.toFixed(6)} {config?.network?.nativeSymbol || "native"}</b></div></article><article><label>ON-CHAIN PROVIDER SELECTION</label>{services.filter((service) => service.active).map((service) => <label key={service.id} className="mission" style={{ display: "block", cursor: "pointer" }}><input type="checkbox" checked={selectedIds.includes(service.id)} onChange={() => toggle(service.id)} /> <b>{service.name}</b><span className="muted sm"> · {service.price} {config?.network?.nativeSymbol || "native"} · {service.provider}</span></label>)}{!services.length ? <p className="muted">Publish services before forming a team.</p> : null}</article></div>
    {run ? <div className="grid2" style={{ marginTop: 12 }}><article className="result"><label>CHAIN RECEIPT</label><div className="kv"><span>Team</span><b className="mono sm">{run.funded.teamId || "event pending"}</b></div><div className="kv"><span>Jobs</span><b>{run.funded.jobIds.length}</b></div><div className="kv"><span>Status</span><b>{run.status}</b></div>{explorerTransactionUrl(config, run.funded.txHash) ? <a className="link" href={explorerTransactionUrl(config, run.funded.txHash)} target="_blank" rel="noreferrer">view funding transaction →</a> : null}</article><article className="result"><label>THESIS COORDINATION</label><div className="kv"><span>NOMOS</span><b>{run.nomos?.ok === false ? "rejected" : "planned"}</b></div><div className="kv"><span>Mission</span><b>{run.company?.mission_id || run.company?.id || "created"}</b></div><p className="muted sm">This coordination record does not move funds. The market contract and provider wallets control each economic state transition.</p></article></div> : null}
  </section>;
}
