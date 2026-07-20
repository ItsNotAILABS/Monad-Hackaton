import { Contract, Interface, keccak256, toUtf8Bytes } from "ethers";
import { connectWallet, createReadContext } from "./agentEconomy.js";

const AGENT_CARD_ABI = [
  "function mintAgentCard(bytes32 profileHash,bytes32 capabilityHash,bytes32 doctrineHash,bytes32 runtimeHash,uint32 version,string metadataURI) returns (uint256 tokenId)",
  "function getAgentCard(uint256 tokenId) view returns ((address agent,bytes32 profileHash,bytes32 capabilityHash,bytes32 doctrineHash,bytes32 runtimeHash,string metadataURI,uint64 mintedAt,uint32 version))",
  "function tokensOfOwner(address owner) view returns (uint256[])",
  "function locked(uint256 tokenId) view returns (bool)",
  "event AgentCardMinted(uint256 indexed tokenId,address indexed agent,bytes32 indexed profileHash,bytes32 capabilityHash,bytes32 doctrineHash,bytes32 runtimeHash,uint32 version,string metadataURI)"
];

const cardInterface = new Interface(AGENT_CARD_ABI);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.keys(value).sort().reduce((out, key) => { out[key] = stable(value[key]); return out; }, {});
  return value;
}

function canonical(value) { return JSON.stringify(stable(value)); }
function hash(value) { return keccak256(toUtf8Bytes(canonical(value))); }
function encodeDataURI(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `data:application/json;base64,${btoa(binary)}`;
}

export function compileAgentCard(input, chain = {}) {
  const capabilities = String(input.capabilities || "").split(",").map((item) => item.trim()).filter(Boolean);
  const profile = { name: input.name.trim(), role: input.role.trim(), description: input.description.trim(), namespace: input.namespace.trim() };
  const doctrine = { purpose: input.purpose.trim(), laws: String(input.laws || "").split("\n").map((item) => item.trim()).filter(Boolean), autonomy: input.autonomy };
  const runtime = { endpoint: input.endpoint.trim() || null, protocol: input.protocol.trim() || null, model: input.model.trim() || null, network: chain.name || null, chainId: chain.chainId || null };
  const metadata = {
    schema: "thesis.agent-card.v1",
    name: profile.name,
    description: profile.description,
    external_url: input.externalUrl.trim() || undefined,
    attributes: [
      { trait_type: "Role", value: profile.role },
      { trait_type: "Namespace", value: profile.namespace },
      { trait_type: "Autonomy", value: doctrine.autonomy },
      { trait_type: "Version", value: Number(input.version) }
    ],
    thesis: { profile, capabilities, doctrine, runtime }
  };
  return {
    metadata,
    metadataURI: encodeDataURI(metadata),
    profileHash: hash(profile),
    capabilityHash: hash(capabilities),
    doctrineHash: hash(doctrine),
    runtimeHash: hash(runtime),
    version: Number(input.version)
  };
}

function tokenIdFromReceipt(receipt) {
  for (const log of receipt.logs || []) {
    try { const parsed = cardInterface.parseLog(log); if (parsed?.name === "AgentCardMinted") return Number(parsed.args.tokenId); } catch {}
  }
  return null;
}

export async function mintAgentCard(compiled) {
  const context = await connectWallet();
  const address = context.config?.contracts?.agentCard;
  if (!address) throw new Error("AGENT_CARD_ADDRESS is not configured for this deployment.");
  const code = await context.provider.getCode(address);
  if (!code || code === "0x") throw new Error("Agent card contract has no deployed bytecode.");
  const cards = new Contract(address, AGENT_CARD_ABI, context.signer);
  const tx = await cards.mintAgentCard(compiled.profileHash, compiled.capabilityHash, compiled.doctrineHash, compiled.runtimeHash, compiled.version, compiled.metadataURI);
  const receipt = await tx.wait();
  return { ...context, txHash: tx.hash, receipt, tokenId: tokenIdFromReceipt(receipt), compiled };
}

export async function listAgentCards(owner) {
  const { config, provider } = await createReadContext();
  const address = config?.contracts?.agentCard;
  if (!address) return { config, cards: [] };
  const code = await provider.getCode(address);
  if (!code || code === "0x") throw new Error("Agent card contract has no deployed bytecode.");
  const contract = new Contract(address, AGENT_CARD_ABI, provider);
  const ids = Array.from(await contract.tokensOfOwner(owner), Number);
  const cards = await Promise.all(ids.map(async (tokenId) => {
    const raw = await contract.getAgentCard(tokenId);
    return { tokenId, agent: raw.agent ?? raw[0], profileHash: raw.profileHash ?? raw[1], capabilityHash: raw.capabilityHash ?? raw[2], doctrineHash: raw.doctrineHash ?? raw[3], runtimeHash: raw.runtimeHash ?? raw[4], metadataURI: raw.metadataURI ?? raw[5], mintedAt: Number(raw.mintedAt ?? raw[6]), version: Number(raw.version ?? raw[7]), locked: true };
  }));
  return { config, cards };
}
