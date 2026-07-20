import React, { useMemo, useState } from "react";
import { compileAgentCard, mintAgentCard } from "./chain/agentCards.js";
import { explorerTransactionUrl } from "./chain/agentEconomy.js";

const initial = { name: "", role: "Service Agent", description: "", namespace: "", capabilities: "", purpose: "", laws: "", autonomy: "bounded", endpoint: "", protocol: "MCP", model: "", externalUrl: "", version: "1" };

export function AgentMintStudio({ config, disabled, onWallet }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const compiled = useMemo(() => compileAgentCard(form, config?.network || {}), [form, config]);
  const set = (name) => (event) => setForm((value) => ({ ...value, [name]: event.target.value }));
  const ready = form.name && form.description && form.namespace && form.capabilities && form.purpose && Number(form.version) > 0;

  async function submit() {
    setBusy(true); setError("");
    try { const output = await mintAgentCard(compiled); setResult(output); onWallet?.(output.address); }
    catch (cause) { setError(String(cause?.shortMessage || cause?.message || cause)); }
    finally { setBusy(false); }
  }

  const txUrl = explorerTransactionUrl(config, result?.txHash);
  return <section className="panel" style={{ marginTop: 12 }}>
    <div className="win-strip platform-strip"><div className="win-copy"><span className="eyebrow">THESIS AGENT MINT</span><h3>Compile and mint a locked Agent Card.</h3><p className="muted sm">The card commits to the agent profile, capability graph, doctrine, runtime manifest, and version.</p></div><button type="button" className="forge win-btn" disabled={disabled || busy || !config?.contracts?.agentCard || !ready} onClick={submit}>{busy ? "MINTING…" : "SIGN + MINT AGENT"}</button></div>
    {!config?.contracts?.agentCard ? <div className="banner err">AGENT_CARD_ADDRESS is not configured.</div> : null}{error ? <div className="banner err">{error}</div> : null}{result ? <div className="banner ok">Agent Card #{result.tokenId ?? "confirmed"} minted.{txUrl ? <a className="link" href={txUrl} target="_blank" rel="noreferrer"> transaction →</a> : null}</div> : null}
    <div className="grid2"><article><label>AGENT MANIFEST</label><input className="term-input" value={form.name} onChange={set("name")} placeholder="Agent name"/><input className="term-input" value={form.role} onChange={set("role")} placeholder="Role"/><input className="term-input" value={form.namespace} onChange={set("namespace")} placeholder="Namespace"/><textarea className="term-input" style={{width:"100%",minHeight:70}} value={form.description} onChange={set("description")} placeholder="Description"/><textarea className="term-input" style={{width:"100%",minHeight:70}} value={form.capabilities} onChange={set("capabilities")} placeholder="Comma-separated capabilities"/><textarea className="term-input" style={{width:"100%",minHeight:70}} value={form.purpose} onChange={set("purpose")} placeholder="Purpose"/><textarea className="term-input" style={{width:"100%",minHeight:70}} value={form.laws} onChange={set("laws")} placeholder="One law per line"/><input className="term-input" value={form.endpoint} onChange={set("endpoint")} placeholder="Runtime endpoint"/><input className="term-input" value={form.model} onChange={set("model")} placeholder="Runtime descriptor"/><input className="term-input" value={form.version} onChange={set("version")} placeholder="Version"/></article><article className="result"><label>AGENT CARD</label><span className="eyebrow">{form.namespace || "agent.namespace"}</span><h2>{form.name || "UNMINTED AGENT"}</h2><p>{form.role}</p><p className="muted sm">{form.description || "Complete the manifest to mint."}</p><div className="kv"><span>Profile</span><b className="mono sm">{compiled.profileHash.slice(0,12)}…</b></div><div className="kv"><span>Capabilities</span><b className="mono sm">{compiled.capabilityHash.slice(0,12)}…</b></div><div className="kv"><span>Doctrine</span><b className="mono sm">{compiled.doctrineHash.slice(0,12)}…</b></div><div className="kv"><span>Runtime</span><b className="mono sm">{compiled.runtimeHash.slice(0,12)}…</b></div><div className="kv"><span>Version</span><b>v{form.version}</b></div><p className="muted sm">Cards are permanently locked. Changes create a new version rather than rewriting history.</p></article></div>
  </section>;
}
