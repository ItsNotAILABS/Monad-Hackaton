const READ_METHODS = new Set(["eth_blockNumber","eth_call","eth_chainId","eth_createAccessList","eth_estimateGas","eth_feeHistory","eth_gasPrice","eth_getBalance","eth_getBlockByHash","eth_getBlockByNumber","eth_getBlockReceipts","eth_getBlockTransactionCountByHash","eth_getBlockTransactionCountByNumber","eth_getCode","eth_getLogs","eth_getStorageAt","eth_getTransactionByBlockHashAndIndex","eth_getTransactionByBlockNumberAndIndex","eth_getTransactionByHash","eth_getTransactionCount","eth_getTransactionReceipt","eth_maxPriorityFeePerGas","net_version","web3_clientVersion"]);
function json(payload,status=200){return new Response(JSON.stringify(payload),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});}
function validatePayload(payload){const requests=Array.isArray(payload)?payload:[payload];if(!requests.length)return "empty JSON-RPC batch";for(const item of requests){if(!item||item.jsonrpc!=="2.0"||!READ_METHODS.has(item.method))return `method not allowed: ${String(item?.method||"unknown")}`;}return null;}
export async function onRequestPost({request,env}){
  if(!env.MONAD_RPC_URL)return json({jsonrpc:"2.0",id:null,error:{code:-32000,message:"RPC not configured"}},503);
  const contentLength=Number(request.headers.get("content-length")||0);if(contentLength>128000)return json({error:"request too large"},413);
  let payload;try{payload=await request.json();}catch{return json({error:"invalid JSON"},400);}
  const validationError=validatePayload(payload);if(validationError)return json({error:validationError},403);
  const upstream=await fetch(String(env.MONAD_RPC_URL),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  return new Response(upstream.body,{status:upstream.status,headers:{"content-type":upstream.headers.get("content-type")||"application/json","cache-control":"no-store"}});
}
export async function onRequestGet(){return json({error:"POST required"},405);}
