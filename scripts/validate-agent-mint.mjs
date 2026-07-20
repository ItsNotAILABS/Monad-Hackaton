import assert from "node:assert/strict";
import { compileAgentCard } from "../web/src/chain/agentCards.js";

let assertions = 0;
function check(value, message) { assertions += 1; assert.ok(value, message); }
function equal(left, right, message) { assertions += 1; assert.equal(left, right, message); }

const base = {
  name: "SENTINEL",
  role: "Risk Service Agent",
  description: "Evaluates policy and execution risk.",
  namespace: "thesis.risk.sentinel",
  capabilities: "policy-audit, simulation, receipt-review",
  purpose: "Prevent unsafe execution.",
  laws: "Require evidence\nReject silent execution\nPreserve receipts",
  autonomy: "bounded",
  endpoint: "https://agent.example/mcp",
  protocol: "MCP + HTTPS",
  model: "NOVA Runtime",
  externalUrl: "https://agent.example",
  version: "1"
};

const first = compileAgentCard(base, { name: "monad-testnet", chainId: 10143 });
const second = compileAgentCard({ ...base }, { name: "monad-testnet", chainId: 10143 });
equal(first.profileHash, second.profileHash, "profile deterministic");
equal(first.capabilityHash, second.capabilityHash, "capability deterministic");
equal(first.doctrineHash, second.doctrineHash, "doctrine deterministic");
equal(first.runtimeHash, second.runtimeHash, "runtime deterministic");
equal(first.metadata.schema, "thesis.agent-card.v1", "schema");
equal(first.metadata.name, "SENTINEL", "name");
equal(first.version, 1, "version");
check(first.metadataURI.startsWith("data:application/json;base64,"), "data URI");
check(first.profileHash.startsWith("0x") && first.profileHash.length === 66, "profile hash");
check(first.capabilityHash.startsWith("0x") && first.capabilityHash.length === 66, "capability hash");
check(first.doctrineHash.startsWith("0x") && first.doctrineHash.length === 66, "doctrine hash");
check(first.runtimeHash.startsWith("0x") && first.runtimeHash.length === 66, "runtime hash");

for (let version = 1; version <= 25; version += 1) {
  const card = compileAgentCard({ ...base, version: String(version), description: `${base.description} v${version}` }, { name: "monad-testnet", chainId: 10143 });
  equal(card.version, version, `version ${version}`);
  check(card.profileHash.length === 66, `profile ${version}`);
  check(card.capabilityHash.length === 66, `capability ${version}`);
  check(card.doctrineHash.length === 66, `doctrine ${version}`);
}

for (let index = 0; index < 20; index += 1) {
  const capability = `capability-${index}`;
  const card = compileAgentCard({ ...base, capabilities: `${base.capabilities}, ${capability}` }, { name: "monad-testnet", chainId: 10143 });
  check(card.metadata.thesis.capabilities.includes(capability), `capability ${index} present`);
  check(card.capabilityHash !== first.capabilityHash, `capability ${index} changes hash`);
}

for (let index = 0; index < 10; index += 1) {
  const law = `Law ${index}`;
  const card = compileAgentCard({ ...base, laws: `${base.laws}\n${law}` }, { name: "monad-testnet", chainId: 10143 });
  check(card.metadata.thesis.doctrine.laws.includes(law), `law ${index} present`);
  check(card.doctrineHash !== first.doctrineHash, `law ${index} changes hash`);
}

for (const chainId of [1, 10, 143, 10143, 8453]) {
  const card = compileAgentCard(base, { name: `chain-${chainId}`, chainId });
  equal(card.metadata.thesis.runtime.chainId, chainId, `chain ${chainId}`);
  check(card.runtimeHash !== first.runtimeHash || chainId === 10143, `chain ${chainId} runtime hash`);
}

check(assertions >= 100, `expected at least 100 assertions, received ${assertions}`);
console.log(JSON.stringify({ ok: true, suite: "agent-mint-manifest", assertions }, null, 2));
