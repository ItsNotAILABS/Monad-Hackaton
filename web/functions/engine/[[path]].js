function json(payload,status=200){return new Response(JSON.stringify(payload),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});}
function normalizedPath(value){if(Array.isArray(value))return value.map(String).join("/");return String(value||"").replace(/^\/+/,"");}
export async function onRequest({request,env,params}){
  if(!env.THESIS_ENGINE?.fetch)return json({ok:false,error:"THESIS_ENGINE service binding is not configured"},503);
  const source=new URL(request.url);const suffix=`/${normalizedPath(params.path)}${source.search}`;const headers=new Headers(request.headers);headers.delete("host");headers.set("x-thesis-pages-gateway","1");
  return env.THESIS_ENGINE.fetch(new Request(`https://thesis.internal${suffix}`,{method:request.method,headers,body:["GET","HEAD"].includes(request.method)?undefined:request.body,redirect:"manual"}));
}
