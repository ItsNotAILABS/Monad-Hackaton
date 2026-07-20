/** MonadBuilder HQ Cloudflare edge router. */
import { corsHeaders, edgeMeta, json, originFetch } from "./lib/origin.js";
import { runSeatbelt } from "./agents/seatbelt.js";
import { runSignals } from "./agents/signals.js";
import { runNomos } from "./agents/nomos.js";
import { runXpost } from "./agents/xpost.js";
import { runHorizon } from "./agents/horizon.js";
import { runSyntheticCanary } from "./synthetic.js";

const AGENTS={seatbelt:runSeatbelt,signals:runSignals,nomos:runNomos,x:runXpost,xpost:runXpost,horizon:runHorizon,agent:runHorizon};

export default {
  async fetch(request,env,ctx){
    const cors=corsHeaders(request);
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers:cors});
    const url=new URL(request.url); const path=url.pathname.replace(/\/+$/,"")||"/"; const meta=edgeMeta(request,env); const colo=meta.edge.colo;
    try{
      if(path==="/"||path==="/health"){
        let originOk=null;
        try{const ping=await originFetch(env,"/health",{colo}); originOk=ping.ok;}catch{originOk=false;}
        return json({schema:"monadbuilder.edge.health.v1",ok:true,...meta,agents:Object.keys(AGENTS),origin_reachable:originOk,routes:["GET /health","GET /agents","GET /synthetic/status","POST /synthetic/run","POST /v1/run","POST /agent/seatbelt","POST /agent/signals","POST /agent/nomos","POST /agent/x","POST /agent/horizon"]},200,cors);
      }
      if(path==="/agents") return json({schema:"monadbuilder.edge.agents.v1",...meta,agents:[{id:"seatbelt",path:"/agent/seatbelt",actions:["brief","morning","reject"]},{id:"signals",path:"/agent/signals",actions:["board","auto"]},{id:"nomos",path:"/agent/nomos",actions:["run","arena"]},{id:"x",path:"/agent/x",actions:["draft"]},{id:"horizon",path:"/agent/horizon",actions:["step"]}],architecture:{edge:"Cloudflare Workers",origin:"THESIS laws, desk, vault, receipts",browser:"Web Workers + STT",chain:"Monad + Ethereum L1 gateway"}},200,cors);
      if(path==="/synthetic/status"&&request.method==="GET"){
        const result=await originFetch(env,"/synthetic/status",{colo}); return json({ok:result.ok,...meta,result},result.status,cors);
      }
      if(path==="/synthetic/run"&&request.method==="POST"){
        const result=await runSyntheticCanary(env,"cloudflare-http"); return json({schema:"monadbuilder.edge.synthetic.v1",ok:true,...meta,result},200,cors);
      }
      if(path==="/v1/run"&&request.method==="POST"){
        const body=await request.json().catch(()=>({})); const agentId=(body.agent||"seatbelt").toLowerCase(); const fn=AGENTS[agentId];
        if(!fn) return json({ok:false,error:`unknown agent ${agentId}`,agents:Object.keys(AGENTS)},400,cors);
        return json({schema:"monadbuilder.edge.run.v1",ok:true,...meta,result:await fn(env,body,colo)},200,cors);
      }
      const m=path.match(/^\/agent\/([a-z]+)$/i);
      if(m&&request.method==="POST"){
        const agentId=m[1].toLowerCase(); const fn=AGENTS[agentId]; if(!fn) return json({ok:false,error:`unknown agent ${agentId}`},404,cors);
        const body=await request.json().catch(()=>({})); return json({schema:"monadbuilder.edge.run.v1",ok:true,...meta,result:await fn(env,body,colo)},200,cors);
      }
      if(path==="/proxy/brief"&&request.method==="GET") return json({ok:true,...meta,result:await runSeatbelt(env,{action:"brief"},colo)},200,cors);
      return json({ok:false,error:"not found",path,...meta},404,cors);
    }catch(e){return json({ok:false,error:String(e.message||e),...meta},500,cors);}
  },
  async scheduled(controller,env,ctx){
    ctx.waitUntil(runSyntheticCanary(env,`cloudflare-cron:${controller.cron}`).catch(error=>console.error("synthetic canary",error)));
  }
};
