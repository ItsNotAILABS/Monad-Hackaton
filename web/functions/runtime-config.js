const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
function json(payload, status = 200) { return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }); }
export async function onRequestGet({ env }) {
  const canonicalReceipt = String(env.RECEIPT_CHAIN_ADDRESS || "").trim();
  const aliasReceipt = String(env.AGENT_RECEIPT_CHAIN_ADDRESS || "").trim();
  if (canonicalReceipt && aliasReceipt && canonicalReceipt.toLowerCase() !== aliasReceipt.toLowerCase()) {
    return json({ ok: false, configured: false, error: "conflicting receipt-chain bindings", bindings: ["RECEIPT_CHAIN_ADDRESS", "AGENT_RECEIPT_CHAIN_ADDRESS"] }, 503);
  }
  const receiptChainAddress = canonicalReceipt || aliasReceipt;
  const requiredValues = {
    MONAD_CHAIN_ID: env.MONAD_CHAIN_ID,
    MONAD_NETWORK_NAME: env.MONAD_NETWORK_NAME,
    MONAD_NATIVE_SYMBOL: env.MONAD_NATIVE_SYMBOL,
    AGENT_MARKET_ADDRESS: env.AGENT_MARKET_ADDRESS,
    RECEIPT_CHAIN_ADDRESS: receiptChainAddress,
    AGENT_REGISTRY_ADDRESS: env.AGENT_REGISTRY_ADDRESS
  };
  const missing = Object.entries(requiredValues).filter(([, value]) => !String(value || "").trim()).map(([key]) => key);
  if (!env.MONAD_RPC_URL) missing.push("MONAD_RPC_URL");
  if (!env.THESIS_ENGINE?.fetch && !env.THESIS_API_ORIGIN) missing.push("THESIS_API_ORIGIN or THESIS_ENGINE");
  if (missing.length) return json({ ok: false, configured: false, error: "runtime configuration incomplete", missing }, 503);
  const contracts = {
    agentMarket: String(env.AGENT_MARKET_ADDRESS),
    receiptChain: receiptChainAddress,
    agentRegistry: String(env.AGENT_REGISTRY_ADDRESS),
    agentCredential: env.AGENT_CREDENTIAL_ADDRESS ? String(env.AGENT_CREDENTIAL_ADDRESS) : null,
    agentCard: env.AGENT_CARD_ADDRESS ? String(env.AGENT_CARD_ADDRESS) : null
  };
  const invalidAddresses = Object.entries(contracts).filter(([, value]) => value && !ADDRESS_PATTERN.test(value)).map(([key]) => key);
  if (invalidAddresses.length) return json({ ok: false, configured: false, error: "invalid contract address configuration", invalidAddresses }, 503);
  const chainId = Number(env.MONAD_CHAIN_ID);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) return json({ ok: false, configured: false, error: "invalid MONAD_CHAIN_ID" }, 503);
  return json({ ok: true, configured: true, network: { chainId, name: String(env.MONAD_NETWORK_NAME), nativeSymbol: String(env.MONAD_NATIVE_SYMBOL), rpcPath: "/rpc", walletRpcUrl: env.MONAD_WALLET_RPC_URL ? String(env.MONAD_WALLET_RPC_URL) : null, explorerUrl: env.MONAD_EXPLORER_URL ? String(env.MONAD_EXPLORER_URL).replace(/\/+$/, "") : null }, contracts, bindingAliases: { receiptChain: aliasReceipt ? "AGENT_RECEIPT_CHAIN_ADDRESS" : "RECEIPT_CHAIN_ADDRESS" }, engineBase: "/engine", release: env.RELEASE_SHA ? String(env.RELEASE_SHA) : null });
}
