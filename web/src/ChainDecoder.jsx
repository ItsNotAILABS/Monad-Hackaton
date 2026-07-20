import React, { useState } from "react";
import { decodeEconomyTransaction } from "./chain/economyDecoder.js";

export function ChainDecoder({ disabled = false }) {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function decode() {
    setBusy(true);
    setError("");
    try {
      setResult(await decodeEconomyTransaction(hash));
    } catch (cause) {
      setResult(null);
      setError(String(cause?.message || cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" style={{ marginTop: 12 }}>
      <div className="win-strip platform-strip">
        <div className="win-copy">
          <span className="eyebrow">MONAD RECEIPT DECODER · REAL CHAIN DATA</span>
          <h3>Turn transaction logs into agent-economy state.</h3>
          <p className="muted sm">Decodes services, jobs, teams, proof receipts, settlement, refunds, and minted credentials from the configured contracts.</p>
        </div>
      </div>

      {error ? <div className="banner err">{error}</div> : null}

      <div className="grid2">
        <article>
          <label>TRANSACTION HASH</label>
          <input className="term-input" style={{ width: "100%" }} value={hash} onChange={(event) => setHash(event.target.value)} placeholder="0x…" />
          <button type="button" className="forge block" style={{ marginTop: 8 }} disabled={disabled || busy || !hash.trim()} onClick={decode}>
            {busy ? "DECODING…" : "DECODE RECEIPT →"}
          </button>
          <p className="muted sm">Unknown logs are preserved instead of discarded, so new contracts remain inspectable before the ABI is upgraded.</p>
        </article>

        <article className="result">
          <label>TRANSACTION</label>
          {!result ? <p className="muted">Paste a Monad transaction hash.</p> : <>
            <div className="kv"><span>Status</span><b>{result.status === 1 ? "success" : "reverted"}</b></div>
            <div className="kv"><span>Block</span><b>{result.blockNumber}</b></div>
            <div className="kv"><span>Gas used</span><b>{result.gasUsed}</b></div>
            <div className="kv"><span>Decoded events</span><b>{result.events.length}</b></div>
            <div className="kv"><span>Unknown logs</span><b>{result.unknownLogs.length}</b></div>
            {result.explorerUrl ? <a className="link" href={result.explorerUrl} target="_blank" rel="noreferrer">Open explorer →</a> : null}
          </>}
        </article>
      </div>

      {result ? <div className="grid2" style={{ marginTop: 12 }}>
        <article>
          <label>DECODED EVENTS</label>
          {result.events.length ? result.events.map((event) => (
            <div key={`${event.logIndex}-${event.signature}`} className="mission" style={{ marginBottom: 8 }}>
              <header><b>{event.name}</b><span className="badge on">{event.contract || event.family}</span></header>
              <pre className="code sm" style={{ maxHeight: 220, overflow: "auto" }}>{JSON.stringify(event.args, null, 2)}</pre>
            </div>
          )) : <p className="muted sm">No known THESIS events were present.</p>}
        </article>
        <article>
          <label>UNRECOGNIZED LOGS</label>
          {result.unknownLogs.length ? <pre className="code sm" style={{ maxHeight: 420, overflow: "auto" }}>{JSON.stringify(result.unknownLogs, null, 2)}</pre> : <p className="muted sm">Every log was decoded.</p>}
        </article>
      </div> : null}
    </section>
  );
}
