import { Contract, Interface, keccak256, toUtf8Bytes } from "ethers";
import { connectWallet, createReadContext, loadRuntimeConfig } from "./agentEconomy.js";

const CREDENTIAL_ABI = [
  "function mintAgentCredential(address subject,bytes32 identityHash,bytes32 capabilityHash,string metadataURI) returns (uint256 tokenId)",
  "function mintJobProof(uint256 jobId,string metadataURI) returns (uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function locked(uint256 tokenId) view returns (bool)",
  "function getCredential(uint256 tokenId) view returns ((uint8 kind,address subject,uint256 referenceId,bytes32 contentHash,string metadataURI,uint64 mintedAt))",
  "function tokensOfOwner(address owner) view returns (uint256[])",
  "event CredentialMinted(uint256 indexed tokenId,uint8 indexed kind,address indexed subject,uint256 referenceId,bytes32 contentHash,string metadataURI)"
];

const credentialInterface = new Interface(CREDENTIAL_ABI);

function requireCredentialAddress(config) {
  const address = config?.contracts?.agentCredential;
  if (!address) throw new Error("Agent credential contract is not configured for this deployment.");
  return address;
}

function mintedTokenId(receipt) {
  for (const log of receipt.logs || []) {
    try {
      const parsed = credentialInterface.parseLog(log);
      if (parsed?.name === "CredentialMinted") return Number(parsed.args.tokenId);
    } catch {}
  }
  return null;
}

export async function mintJobProof({ jobId, metadataURI }) {
  const context = await connectWallet();
  const address = requireCredentialAddress(context.config);
  const code = await context.provider.getCode(address);
  if (!code || code === "0x") throw new Error("Credential contract is not deployed at the configured address.");
  const credential = new Contract(address, CREDENTIAL_ABI, context.signer);
  const tx = await credential.mintJobProof(Number(jobId), String(metadataURI).trim());
  const receipt = await tx.wait();
  return { ...context, txHash: tx.hash, receipt, tokenId: mintedTokenId(receipt) };
}

export async function mintAgentIdentity({ subject, identity, capability, metadataURI }) {
  const context = await connectWallet();
  const address = requireCredentialAddress(context.config);
  const code = await context.provider.getCode(address);
  if (!code || code === "0x") throw new Error("Credential contract is not deployed at the configured address.");
  const credential = new Contract(address, CREDENTIAL_ABI, context.signer);
  const tx = await credential.mintAgentCredential(
    String(subject).trim(),
    keccak256(toUtf8Bytes(String(identity).trim())),
    keccak256(toUtf8Bytes(String(capability).trim())),
    String(metadataURI).trim()
  );
  const receipt = await tx.wait();
  return { ...context, txHash: tx.hash, receipt, tokenId: mintedTokenId(receipt) };
}

export async function listCredentials(owner) {
  const config = await loadRuntimeConfig();
  const address = requireCredentialAddress(config);
  const { provider } = await createReadContext();
  const credential = new Contract(address, CREDENTIAL_ABI, provider);
  const code = await provider.getCode(address);
  if (!code || code === "0x") throw new Error("Credential contract is not deployed at the configured address.");
  const ids = Array.from(await credential.tokensOfOwner(owner), Number);
  const credentials = await Promise.all(ids.map(async (tokenId) => {
    const raw = await credential.getCredential(tokenId);
    return {
      tokenId,
      kind: Number(raw.kind ?? raw[0]),
      subject: raw.subject ?? raw[1],
      referenceId: Number(raw.referenceId ?? raw[2]),
      contentHash: raw.contentHash ?? raw[3],
      metadataURI: raw.metadataURI ?? raw[4],
      mintedAt: Number(raw.mintedAt ?? raw[5]),
      locked: true
    };
  }));
  return { config, credentials };
}
