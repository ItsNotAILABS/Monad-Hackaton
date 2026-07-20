import { BrowserProvider, Contract, Interface, JsonRpcProvider, formatEther, id, keccak256, parseEther, toUtf8Bytes } from "ethers";

const MARKET_ABI = [
  "function serviceCount() view returns (uint256)",
  "function jobCount() view returns (uint256)",
  "function getService(uint256 serviceId) view returns ((address provider,string name,string metadataURI,bytes32 capability,uint96 price,uint32 slaSeconds,bool active))",
  "function getJob(uint256 jobId) view returns ((uint256 serviceId,address client,address provider,uint96 payment,uint64 createdAt,uint64 acceptedAt,uint64 executionDeadline,uint64 reviewDeadline,uint8 status,bytes32 requestHash,bytes32 resultHash,bytes32 receiptHash))",
  "function getProviderStats(address provider) view returns ((uint64 completedJobs,uint64 refundedJobs,uint128 grossRevenue,uint32 reputationBps))",
  "function serviceIdsByProvider(address provider) view returns (uint256[])",
  "function jobIdsByClient(address client) view returns (uint256[])",
  "function jobIdsByTeam(bytes32 teamId) view returns (uint256[])",
  "function publishService(string name,string metadataURI,bytes32 capability,uint96 price,uint32 slaSeconds) returns (uint256 serviceId)",
  "function updateService(uint256 serviceId,string metadataURI,uint96 price,uint32 slaSeconds,bool active)",
  "function setServiceActive(uint256 serviceId,bool active)",
  "function createJob(uint256 serviceId,bytes32 requestHash) payable returns (uint256 jobId)",
  "function createBatchJobs(uint256[] serviceIds,bytes32 requestHash) payable returns (bytes32 teamId,uint256[] jobIds)",
  "function acceptJob(uint256 jobId)",
  "function submitResult(uint256 jobId,bytes32 resultHash,bytes32 stateHash,bytes32 actionHash) returns (bytes32 receiptHash)",
  "function approveAndRelease(uint256 jobId)",
  "function claimAfterReview(uint256 jobId)",
  "function openDispute(uint256 jobId)",
  "function cancelFundedJob(uint256 jobId)",
  "function refundExpiredJob(uint256 jobId)",
  "event ServicePublished(uint256 indexed serviceId,address indexed provider,bytes32 indexed capability,uint96 price,uint32 slaSeconds,string name,string metadataURI)",
  "event JobFunded(uint256 indexed jobId,uint256 indexed serviceId,address indexed client,address provider,uint96 payment,bytes32 requestHash)",
  "event TeamFunded(bytes32 indexed teamId,address indexed client,uint256[] jobIds,uint256 totalPayment,bytes32 requestHash)",
  "event JobSubmitted(uint256 indexed jobId,address indexed provider,bytes32 resultHash,bytes32 receiptHash,uint64 reviewDeadline)"
];

const JOB_STATUS = ["none","funded","accepted","submitted","disputed","completed","refunded"];
const marketInterface = new Interface(MARKET_ABI);
let runtimeConfigPromise = null;

function txEvent(receipt,eventName){for(const log of receipt.logs||[]){try{const parsed=marketInterface.parseLog(log);if(parsed?.name===eventName)return parsed.args;}catch{}}return null;}
export function hashText(value){return keccak256(toUtf8Bytes(String(value||"")));}

export async function loadRuntimeConfig({force=false}={}){
  if(!force&&runtimeConfigPromise)return runtimeConfigPromise;
  runtimeConfigPromise=(async()=>{const response=await fetch("/runtime-config",{headers:{Accept:"application/json"},cache:"no-store"});const data=await response.json().catch(()=>({}));if(!response.ok||!data.configured){const missing=Array.isArray(data.missing)?` Missing: ${data.missing.join(", ")}.`:"";throw new Error(`${data.error||"Web3 runtime is not configured."}${missing}`);}return data;})();
  try{return await runtimeConfigPromise;}catch(error){runtimeConfigPromise=null;throw error;}
}

export async function createReadContext(){
  const config=await loadRuntimeConfig();
  const rpcUrl=new URL(config.network.rpcPath,window.location.origin).toString();
  const provider=new JsonRpcProvider(rpcUrl,{name:config.network.name,chainId:Number(config.network.chainId)},{staticNetwork:true});
  const market=new Contract(config.contracts.agentMarket,MARKET_ABI,provider);
  const chainId=Number(await provider.send("eth_chainId",[]));
  if(chainId!==Number(config.network.chainId))throw new Error(`RPC chain mismatch. Expected ${config.network.chainId}, received ${chainId}.`);
  const code=await provider.getCode(config.contracts.agentMarket);if(!code||code==="0x")throw new Error("Agent market contract is not deployed at the configured address.");
  return {config,provider,market};
}

async function switchWalletNetwork(config){
  const chainIdHex=`0x${Number(config.network.chainId).toString(16)}`;
  try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:chainIdHex}]});}
  catch(error){if(Number(error?.code)!==4902||!config.network.walletRpcUrl)throw error;const params={chainId:chainIdHex,chainName:config.network.name,nativeCurrency:{name:config.network.nativeSymbol,symbol:config.network.nativeSymbol,decimals:18},rpcUrls:[config.network.walletRpcUrl]};if(config.network.explorerUrl)params.blockExplorerUrls=[config.network.explorerUrl];await window.ethereum.request({method:"wallet_addEthereumChain",params:[params]});}
}

export async function connectWallet(){
  if(!window.ethereum)throw new Error("No EIP-1193 wallet was detected.");
  const config=await loadRuntimeConfig();await window.ethereum.request({method:"eth_requestAccounts"});let provider=new BrowserProvider(window.ethereum);let network=await provider.getNetwork();
  if(Number(network.chainId)!==Number(config.network.chainId)){await switchWalletNetwork(config);provider=new BrowserProvider(window.ethereum);network=await provider.getNetwork();}
  if(Number(network.chainId)!==Number(config.network.chainId))throw new Error(`Wallet must be connected to ${config.network.name}.`);
  const signer=await provider.getSigner();const address=await signer.getAddress();const market=new Contract(config.contracts.agentMarket,MARKET_ABI,signer);return {config,provider,signer,address,market};
}

function decodeService(serviceId,raw){return{id:Number(serviceId),provider:raw.provider??raw[0],name:raw.name??raw[1],metadataURI:raw.metadataURI??raw[2],capability:raw.capability??raw[3],priceWei:raw.price??raw[4],price:formatEther(raw.price??raw[4]),slaSeconds:Number(raw.slaSeconds??raw[5]),active:Boolean(raw.active??raw[6])};}
function decodeJob(jobId,raw){const status=Number(raw.status??raw[8]);return{id:Number(jobId),serviceId:Number(raw.serviceId??raw[0]),client:raw.client??raw[1],provider:raw.provider??raw[2],paymentWei:raw.payment??raw[3],payment:formatEther(raw.payment??raw[3]),createdAt:Number(raw.createdAt??raw[4]),acceptedAt:Number(raw.acceptedAt??raw[5]),executionDeadline:Number(raw.executionDeadline??raw[6]),reviewDeadline:Number(raw.reviewDeadline??raw[7]),status,statusLabel:JOB_STATUS[status]||`unknown-${status}`,requestHash:raw.requestHash??raw[9],resultHash:raw.resultHash??raw[10],receiptHash:raw.receiptHash??raw[11]};}

export async function listServices({activeOnly=false}={}){const {config,provider,market}=await createReadContext();const count=Number(await market.serviceCount());const records=await Promise.all(Array.from({length:count},(_,index)=>{const serviceId=index+1;return market.getService(serviceId).then(raw=>decodeService(serviceId,raw));}));return{config,provider,market,services:activeOnly?records.filter(service=>service.active):records};}
export async function listRecentJobs(limit=20){const {config,provider,market}=await createReadContext();const count=Number(await market.jobCount());const start=Math.max(1,count-Math.max(1,Number(limit))+1);const ids=[];for(let n=count;n>=start;n-=1)ids.push(n);const jobs=await Promise.all(ids.map(jobId=>market.getJob(jobId).then(raw=>decodeJob(jobId,raw))));return{config,provider,market,jobs};}

export async function publishService({name,metadataURI,capability,price,slaSeconds}){const context=await connectWallet();const tx=await context.market.publishService(String(name).trim(),String(metadataURI).trim(),id(String(capability).trim()),parseEther(String(price)),Number(slaSeconds));const receipt=await tx.wait();const event=txEvent(receipt,"ServicePublished");return{...context,txHash:tx.hash,receipt,serviceId:event?Number(event.serviceId):null};}
export async function createJob({service,request}){const context=await connectWallet();const tx=await context.market.createJob(service.id,hashText(request),{value:service.priceWei});const receipt=await tx.wait();const event=txEvent(receipt,"JobFunded");return{...context,txHash:tx.hash,receipt,jobId:event?Number(event.jobId):null};}
export async function createBatchJobs({services,request}){if(!services.length)throw new Error("Select at least one on-chain service.");const context=await connectWallet();const total=services.reduce((sum,service)=>sum+BigInt(service.priceWei),0n);const tx=await context.market.createBatchJobs(services.map(service=>service.id),hashText(request),{value:total});const receipt=await tx.wait();const event=txEvent(receipt,"TeamFunded");return{...context,txHash:tx.hash,receipt,teamId:event?.teamId||null,jobIds:event?Array.from(event.jobIds,Number):[]};}
export async function acceptJob(jobId){const context=await connectWallet();const tx=await context.market.acceptJob(jobId);return{...context,txHash:tx.hash,receipt:await tx.wait()};}
export async function submitJobResult({jobId,result,state,action}){const context=await connectWallet();const tx=await context.market.submitResult(jobId,hashText(result),hashText(state),hashText(action));const receipt=await tx.wait();const event=txEvent(receipt,"JobSubmitted");return{...context,txHash:tx.hash,receipt,receiptHash:event?.receiptHash||null};}
export async function approveJob(jobId){const context=await connectWallet();const tx=await context.market.approveAndRelease(jobId);return{...context,txHash:tx.hash,receipt:await tx.wait()};}
export async function disputeJob(jobId){const context=await connectWallet();const tx=await context.market.openDispute(jobId);return{...context,txHash:tx.hash,receipt:await tx.wait()};}
export async function cancelJob(jobId){const context=await connectWallet();const tx=await context.market.cancelFundedJob(jobId);return{...context,txHash:tx.hash,receipt:await tx.wait()};}
export async function refundExpiredJob(jobId){const context=await connectWallet();const tx=await context.market.refundExpiredJob(jobId);return{...context,txHash:tx.hash,receipt:await tx.wait()};}
export function sameAddress(left,right){return Boolean(left&&right&&String(left).toLowerCase()===String(right).toLowerCase());}
export function explorerTransactionUrl(config,txHash){if(!config?.network?.explorerUrl||!txHash)return null;return `${config.network.explorerUrl}/tx/${txHash}`;}
