import React, { useState } from "react";
import { mintAgentIdentity, mintJobProof } from "./chain/credentials.js";
import { explorerTransactionUrl } from "./chain/agentEconomy.js";

export function MintingStudio({ config, disabled = false, wallet = "", onWallet }) {
  const [mode, setMode] = useState("job-proof");
  const [jobId, setJobId] = useState("");
  const [subject, setSubject] = useState(wallet || "");
  const [identity, setIdentity] = useState("");
  const [capability, setCapability] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function mint() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const output = mode === "job-proof"
        ? await mintJobProof({ jobId, metadataURI })
        : await mintAgentIdentity({ subject, identity, capability, metadataURI });
      onWallet?.(output.address);
      setResult(output);
    } catch (cause) {
      setError(String(cause?.shortMessage || cause?.message || cause));
    } finally {
      setBusy(false);
    }
  }

  const ready = mode === "job-proof"
    ? Number(jobId) > 0 && metadataURI.trim()
    : subject.trim() && identity.trim() && capability.trim() && metadataURI.trim();
  const configured = Boolean(config?.contracts?.agentCredential);
  const transactionUrl = explorerTransactionUrl(config, result?.txHash);

  return (
    <section className="panel" style={{ marginTop: 12 }}>
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">AGENT CREDENTIAL MINTING · ERC-721 + ERC-5192</span>
          <h3>Mint locked identity and completed-work credentials.</h3>
          <p className="muted sm">Job proofs can only be minted by the job client or provider after the Solidity market reports completion. Identity credentials require the configured governor wallet.</p>
        </div>
        <div className="win-actions">
          <button type="button" className={mode === "job-proof" ? "forge" : "ghost"} onClick={() => setMode("job-proof")}>JOB PROOF</button>
          <button type="button" className={mode === "agent-identity" ? "forge" : "ghost"} onClick={() => setMode("agent-identity")}>AGENT IDENTITY</button>
        </div>
      </div>

      {!configured ? <div className="banner err">AGENT_CREDENTIAL_ADDRESS is not configured for this deployment.</div> : null}
      {error ? <div className="banner err">{error}</div> : null}
      {result ? <div className="banner ok">Minted token #{result.tokenId ?? "confirmed"}.{transactionUrl ? <a className="link" href={transactionUrl} target="_blank" rel="noreferrer"> view transaction →</a> : null}</div> : null}

      <div className="grid2">
        <article>
          <label>{mode === "job-proof" ? "COMPLETED JOB" : "AGENT SUBJECT"}</label>
          {mode === "job-proof" ? (
            <input className="term-input" style={{ width: "100%" }} inputMode="numeric" value={jobId} onChange={(event) => setJobId(event.target.value)} placeholder="Completed job ID" />
          ) : <>
            <input className="term-input" style={{ width: "100%" }} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Agent wallet or smart account" />
            <input className="term-input" style={{ width: "100%" }} value={identity} onChange={(event) => setIdentity(event.target.value)} placeholder="Identity namespace or DID" />
            <input className="term-input" style={{ width: "100%" }} value={capability} onChange={(event) => setCapability(event.target.value)} placeholder="Capability namespace" />
          </>}
          <input className="term-input" style={{ width: "100%" }} value={metadataURI} onChange={(event) => setMetadataURI(event.target.value)} placeholder="IPFS, Arweave, or HTTPS metadata URI" />
          <button type="button" className="forge block" disabled={disabled || busy || !configured || !ready} onClick={mint}>{busy ? "MINTING…" : "SIGN + MINT CREDENTIAL"}</button>
        </article>
        <article className="result">
          <label>MINTING LAW</label>
          <div className="kv"><span>Token standard</span><b>ERC-721 metadata</b></div>
          <div className="kv"><span>Transfer state</span><b>locked · ERC-5192</b></div>
          <div className="kv"><span>Job proof source</span><b>completed market job</b></div>
          <div className="kv"><span>Identity issuer</span><b>governor wallet</b></div>
          <div className="kv"><span>Duplicate protection</span><b>on-chain key</b></div>
          <p className="muted sm">The credential stores a content hash and metadata URI. The job-proof hash binds service, client, provider, payment, request, result, and receipt.</p>
        </article>
      </div>
    </section>
  );
}
