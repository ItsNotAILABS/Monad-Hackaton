import { Interface, formatEther } from "ethers";
import { createReadContext, loadRuntimeConfig } from "./agentEconomy.js";

const MARKET_EVENTS = new Interface([
  "event ServicePublished(uint256 indexed serviceId,address indexed provider,bytes32 indexed capability,uint96 price,uint32 slaSeconds,string name,string metadataURI)",
  "event ServiceUpdated(uint256 indexed serviceId,uint96 price,uint32 slaSeconds,bool active,string metadataURI)",
  "event JobFunded(uint256 indexed jobId,uint256 indexed serviceId,address indexed client,address provider,uint96 payment,bytes32 requestHash)",
  "event TeamFunded(bytes32 indexed teamId,address indexed client,uint256[] jobIds,uint256 totalPayment,bytes32 requestHash)",
  "event JobAccepted(uint256 indexed jobId,address indexed provider,uint64 executionDeadline)",
  "event JobSubmitted(uint256 indexed jobId,address indexed provider,bytes32 resultHash,bytes32 receiptHash,uint64 reviewDeadline)",
  "event JobDisputed(uint256 indexed jobId,address indexed client)",
  "event JobCompleted(uint256 indexed jobId,address indexed provider,uint256 providerPayment,uint256 protocolFee)",
  "event JobRefunded(uint256 indexed jobId,address indexed client,uint256 payment)",
  "event FeesWithdrawn(address indexed recipient,uint256 amount)"
]);

const RECEIPT_EVENTS = new Interface([
  "event ReceiptSealed(address indexed vault,bytes32 indexed receiptHash,bytes32 previousHash,address indexed agent,bool success)"
]);

const CREDENTIAL_EVENTS = new Interface([
  "event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)",
  "event Locked(uint256 indexed tokenId)",
  "event CredentialMinted(uint256 indexed tokenId,uint8 indexed kind,address indexed subject,uint256 referenceId,bytes32 contentHash,string metadataURI)"
]);

const EVENT_INTERFACES = [
  ["market", MARKET_EVENTS],
  ["receipt", RECEIPT_EVENTS],
  ["credential", CREDENTIAL_EVENTS]
];

function normalize(value) {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      if (!/^\d+$/.test(key)) output[key] = normalize(item);
    }
    return output;
  }
  return value;
}

function enrich(event, nativeSymbol) {
  const args = { ...event.args };
  for (const key of ["price", "payment", "totalPayment", "providerPayment", "protocolFee", "amount"]) {
    if (args[key] != null) args[`${key}Formatted`] = `${formatEther(BigInt(args[key]))} ${nativeSymbol}`;
  }
  if (args.executionDeadline) args.executionDeadlineISO = new Date(Number(args.executionDeadline) * 1000).toISOString();
  if (args.reviewDeadline) args.reviewDeadlineISO = new Date(Number(args.reviewDeadline) * 1000).toISOString();
  if (event.name === "CredentialMinted") args.kindLabel = Number(args.kind) === 0 ? "agent-identity" : "job-proof";
  return { ...event, args };
}

export async function decodeEconomyTransaction(transactionHash) {
  const hash = String(transactionHash || "").trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) throw new Error("Enter a complete transaction hash.");
  const [{ config, provider }, runtime] = await Promise.all([createReadContext(), loadRuntimeConfig()]);
  const receipt = await provider.getTransactionReceipt(hash);
  if (!receipt) throw new Error("Transaction receipt was not found on the configured network.");
  const knownAddresses = Object.fromEntries(
    Object.entries(runtime.contracts || {}).filter(([, value]) => value).map(([key, value]) => [String(value).toLowerCase(), key])
  );
  const decoded = [];
  const unknown = [];
  for (const log of receipt.logs || []) {
    let parsed = null;
    for (const [family, iface] of EVENT_INTERFACES) {
      try {
        const match = iface.parseLog(log);
        if (match) {
          parsed = enrich({ family, name: match.name, signature: match.signature, address: log.address, contract: knownAddresses[String(log.address).toLowerCase()] || null, logIndex: Number(log.index), args: normalize(match.args) }, config.network.nativeSymbol);
          break;
        }
      } catch {}
    }
    if (parsed) decoded.push(parsed);
    else unknown.push({ address: log.address, topics: Array.from(log.topics || []), data: log.data, logIndex: Number(log.index) });
  }
  return {
    transactionHash: hash,
    blockNumber: Number(receipt.blockNumber),
    status: Number(receipt.status),
    from: receipt.from,
    to: receipt.to,
    gasUsed: receipt.gasUsed?.toString?.() || String(receipt.gasUsed),
    events: decoded,
    unknownLogs: unknown,
    explorerUrl: config.network.explorerUrl ? `${config.network.explorerUrl}/tx/${hash}` : null,
    network: config.network
  };
}
