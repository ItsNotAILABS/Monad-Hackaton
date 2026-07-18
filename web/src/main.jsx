import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
const categories=['dex','lending','vault','staking','perps','analytics','agent'];
function App(){
 const [objective,setObjective]=useState('Coordinate my Monad portfolio across swaps, lending, vaults and staking while preserving liquidity and limiting protocol concentration.');
 const [selected,setSelected]=useState(categories);
 const [status,setStatus]=useState('READY');
 const modules=useMemo(()=>['THESIS','SENSUS','MATHESIS','NOMOS','AGORA','PRAXIS','CUSTOS','MEMORIA','NERVUS','CODEX','TEST'],[]);
 const forge=()=>{setStatus('COMPILING'); setTimeout(()=>setStatus('MANIFEST SEALED'),700)};
 return <main><header><div><span className="eyebrow">MONAD-NATIVE APPLICATION FOUNDRY</span><h1>THESIS <i>Forge</i></h1></div><div className="status">{status}</div></header>
 <section className="hero"><div><h2>Describe the system.<br/>Deploy the organism.</h2><p>Generate governed Monad applications with contracts, Python intelligence engines, tests, deployment plans, verification commands and cryptographic receipts.</p></div><div className="orb"><b>11</b><span>ENGINES ONLINE</span></div></section>
 <section className="grid"><article className="command"><label>MISSION OBJECTIVE</label><textarea value={objective} onChange={e=>setObjective(e.target.value)}/><label>ECOSYSTEM PLANES</label><div className="chips">{categories.map(c=><button className={selected.includes(c)?'on':''} onClick={()=>setSelected(s=>s.includes(c)?s.filter(x=>x!==c):[...s,c])}>{c}</button>)}</div><button className="forge" onClick={forge}>FORGE MONAD APPLICATION →</button></article>
 <article><label>ENGINE CIVILIZATION</label><div className="engines">{modules.map((m,i)=><div><span>{String(i+1).padStart(2,'0')}</span><b>{m}</b><em>ONLINE</em></div>)}</div></article></section>
 <section className="pipeline">OBJECTIVE <b>→</b> MANIFEST <b>→</b> CONTRACTS <b>→</b> TEST GATES <b>→</b> MONAD DEPLOYMENT <b>→</b> VERIFIED RECEIPT</section>
 </main>}
createRoot(document.getElementById('root')).render(<App/>);
