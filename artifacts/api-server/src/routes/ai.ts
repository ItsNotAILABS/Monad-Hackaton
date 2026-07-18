/**
 * AI routes + chain utility routes — MonadBuilder+ AI engine
 * All endpoints use streaming SSE for real-time output.
 *
 * POST /api/ai/chat              — streaming chat (stateless, messages[] in body)
 * POST /api/ai/generate-component— returns a component config JSON from a prompt
 * POST /api/ai/analyze           — analyzes a contract address, gas scenario, or dApp spec
 * POST /api/ai/script            — generates a Monad Python/JS script from a description
 */
import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { aiRateLimiter } from "../middlewares/rateLimiter";

export const aiRouter = Router();

// Apply rate limiting to all AI endpoints (40 requests / 15 min per IP)
// Implemented in middlewares/rateLimiter.ts — uses req.ip with trust proxy
aiRouter.use(aiRateLimiter);

const MONAD_SYSTEM = `You are the MonadBuilder+ AI — an expert on:
- MonadBuilder+: a no-code drag-and-drop dApp builder for Monad blockchain
- THESIS OS: a governance engine where agents propose, laws decide, receipts remember, owner signs
- Monad network: Chain ID 143, 10,000 TPS, 400ms block time, 800ms finality, Fusaka EVM fork
  - RPC: https://rpc.monad.xyz (also rpc1/rpc2/rpc3.monad.xyz)
  - Gas model: you pay gas_LIMIT × gas_PRICE (not gas_USED like Ethereum) — always set tight limits
  - Native token: MON, WMON: 0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A
  - Block explorers: monadvision.com, monadscan.com
  - Max contract size: 128 KB

Available dApp components (type → description):
  wallet-connect, token-balance, nft-gallery, transaction-feed,
  token-swap, price-chart, dao-vote,
  hero-section, card, stats-row, divider,
  heading, paragraph, button, image

THESIS OS modules: EcosystemLaw (immutable global rules), LawBook (owner-tunable laws),
  PolicyKernel (evaluates proposals), SovereignVault (executes only cleared actions),
  ReceiptChain (immutable audit log), 16 MCP tools, morning-brief, WIN PATH daily workflow.

Be concise, technically precise, and opinionated. Prefer Monad-specific advice over generic Web3 advice.
When asked to generate components, always output valid JSON. When explaining gas, always emphasize
the limit×price model. When discussing THESIS, always emphasize the law-first governance model.`;

// ─── Component type validation ────────────────────────────────────────────
// Source of truth: artifacts/monad-builder/src/components/builder/palette.ts
const VALID_COMPONENT_TYPES = new Set([
  // Web3
  "wallet-connect", "token-balance", "nft-gallery", "transaction-feed",
  "token-swap", "price-chart", "dao-vote",
  // Layout
  "hero-section", "card", "stats-row", "divider",
  // Content
  "heading", "paragraph", "button", "image",
]);

// Known model hallucinations → correct palette type (no second AI call needed)
const TYPE_ALIASES: Record<string, string> = {
  "stats-bar":           "stats-row",
  "stats_bar":           "stats-row",
  "stats-section":       "stats-row",
  "recent-transactions": "transaction-feed",
  "recent_transactions": "transaction-feed",
  "tx-feed":             "transaction-feed",
  "text-block":          "paragraph",
  "text_block":          "paragraph",
  "text-section":        "paragraph",
  "image-block":         "image",
  "image_block":         "image",
  "image-section":       "image",
  "gas-price":           "stats-row",
  "gas_price":           "stats-row",
  "gas-tracker":         "stats-row",
  "liquidity-pool":      "token-swap",
  "swap-widget":         "token-swap",
  "nft-mint":            "nft-gallery",
  "nft-collection":      "nft-gallery",
  "governance":          "dao-vote",
  "dao-proposal":        "dao-vote",
  "staking":             "token-balance",
  "token-staking":       "token-balance",
  "wallet":              "wallet-connect",
  "wallet-button":       "wallet-connect",
};

interface RawComponent {
  type?: string;
  props?: Record<string, any>;
  id?: string;
  order?: number;
  [key: string]: any;
}

interface ValidationResult {
  components: RawComponent[];
  warnings: string[];
}

/**
 * Validate and normalise AI-generated component types against the palette.
 * Known aliases are remapped; unrecognised types are dropped with a warning.
 */
function validateComponents(raw: RawComponent[]): ValidationResult {
  const warnings: string[] = [];
  const components: RawComponent[] = [];

  for (const c of raw) {
    const rawType = String(c.type ?? "").toLowerCase().trim();

    if (!rawType) {
      warnings.push("A component with no type was removed");
      continue;
    }

    if (VALID_COMPONENT_TYPES.has(rawType)) {
      components.push({ ...c, type: rawType });
      continue;
    }

    const remapped = TYPE_ALIASES[rawType];
    if (remapped) {
      warnings.push(`Component type "${rawType}" remapped to "${remapped}"`);
      components.push({ ...c, type: remapped });
      continue;
    }

    warnings.push(`Component type "${rawType}" is not in the palette and was removed`);
  }

  return { components, warnings };
}

// ─── Chain utility — used by LiveBlockTicker ─────────────────────────────
import { Router as ChainRouter } from "express";
export const chainRouter = ChainRouter();

chainRouter.get("/block", async (_req, res) => {
  try {
    const response = await fetch("https://rpc.monad.xyz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json() as { result?: string };
    const blockNumber = data.result ? parseInt(data.result, 16) : null;
    res.json({ blockNumber, hex: data.result ?? null });
  } catch (err: any) {
    res.status(504).json({ error: "RPC timeout or unreachable" });
  }
});

chainRouter.get("/gas", async (_req, res) => {
  try {
    const [blockRes, gasRes] = await Promise.all([
      fetch("https://rpc.monad.xyz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
        signal: AbortSignal.timeout(5000),
      }),
      fetch("https://rpc.monad.xyz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_gasPrice", params: [], id: 2 }),
        signal: AbortSignal.timeout(5000),
      }),
    ]);
    const blockData = await blockRes.json() as { result?: string };
    const gasData  = await gasRes.json()  as { result?: string };
    res.json({
      blockNumber: blockData.result ? parseInt(blockData.result, 16) : null,
      gasPriceWei: gasData.result  ? parseInt(gasData.result,  16) : null,
      gasPriceGwei: gasData.result ? parseInt(gasData.result, 16) / 1e9 : null,
    });
  } catch {
    res.status(504).json({ error: "RPC timeout" });
  }
});

// ─── Streaming chat ────────────────────────────────────────────────────────
// Model: gpt-5.6-luna — conversational, not essay-length; 4096 tokens is plenty
aiRouter.post("/chat", async (req, res) => {
  const { messages = [], context = "" } = req.body as {
    messages: { role: string; content: string }[];
    context?: string;
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const systemContent = context
      ? `${MONAD_SYSTEM}\n\nAdditional context: ${context}`
      : MONAD_SYSTEM;

    const stream = await openai.chat.completions.create({
      model: "gpt-5.6-luna",
      max_completion_tokens: 4096, // conversational; 4096 is more than enough for chat
      messages: [
        { role: "system", content: systemContent },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message ?? "AI error" })}\n\n`);
  }
  res.end();
});

// ─── Component generator ──────────────────────────────────────────────────
// Model: gpt-5.6-luna — output is a tiny JSON blob; 512 tokens is generous
aiRouter.post("/generate-component", async (req, res) => {
  const { prompt, existingTypes = [] } = req.body as {
    prompt: string;
    existingTypes?: string[];
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.6-luna",
      max_completion_tokens: 512, // JSON component config is small; 512 is plenty
      messages: [
        {
          role: "system",
          content: `${MONAD_SYSTEM}

You generate MonadBuilder+ component configs. Return ONLY valid JSON (no markdown, no explanation):
{
  "type": "<component type from the list>",
  "name": "<short display name>",
  "props": { <component-specific props> },
  "reasoning": "<one sentence why this component fits>"
}

Valid component types ONLY (use exactly these strings):
  wallet-connect, token-balance, nft-gallery, transaction-feed,
  token-swap, price-chart, dao-vote,
  hero-section, card, stats-row, divider,
  heading, paragraph, button, image

Common props by type:
- wallet-connect: { label, chainId: 143, networkName: "Monad Mainnet" }
- token-swap: { fromToken: "MON", toToken: "USDC", chainId: 143, rpcUrl: "https://rpc.monad.xyz" }
- token-balance: { asset: "MON", chainId: 143, rpcUrl: "https://rpc.monad.xyz" }
- nft-gallery: { limit: 8, columns: 4, contractAddress: "0x..." }
- dao-vote: { title, subtitle, chainId: 143 }
- stats-row: { items: 3, chainId: 143 }
- price-chart: { token: "MON", chainId: 143 }
- transaction-feed: { limit: 5, explorerUrl: "https://monadvision.com" }
- hero-section: { title, subtitle }
- button: { label, variant: "primary" }
- paragraph: { text }`,
        },
        {
          role: "user",
          content: `Generate a component for: "${prompt}"${existingTypes.length ? `\nAlready on canvas: ${existingTypes.join(", ")}` : ""}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Validate the single component type against the palette
    const { components: validated, warnings } = validateComponents([parsed]);
    if (validated.length === 0) {
      // Unrecognised type — surface the warning rather than returning garbage
      res.status(422).json({ ok: false, error: warnings[0] ?? "AI returned an unrecognised component type", warnings });
      return;
    }
    // Merge the validated type back (name + reasoning are pass-through)
    const component = { ...parsed, type: validated[0].type };
    res.json({ ok: true, component, warnings });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Analyzer (contract / gas / dApp) ────────────────────────────────────
// Model: gpt-5.6-terra — analysis requires deeper reasoning quality; 4096 tokens for structured output
aiRouter.post("/analyze", async (req, res) => {
  const { type, data } = req.body as {
    type: "contract" | "gas" | "dapp" | "law";
    data: string;
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const prompts: Record<string, string> = {
    contract: `Analyze this Monad smart contract or address. Identify: purpose, key functions, gas patterns, risks, and THESIS OS integration opportunities.\n\n${data}`,
    gas: `Analyze this gas scenario on Monad. Remember: Monad charges gas_LIMIT × gas_PRICE (not gas_used). Calculate costs, suggest optimizations, identify risks.\n\n${data}`,
    dapp: `Analyze this dApp concept for Monad. Suggest: which MonadBuilder+ components to use, THESIS OS governance opportunities, Monad-specific optimizations, potential issues.\n\n${data}`,
    law: `Analyze this THESIS OS law or governance rule. Explain: what it enforces, when it triggers, edge cases, how to tune it safely.\n\n${data}`,
  };

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.6-terra", // terra: analysis needs reasoning quality, not just speed
      max_completion_tokens: 4096, // structured multi-section analysis; 4096 is sufficient
      messages: [
        { role: "system", content: MONAD_SYSTEM },
        { role: "user", content: prompts[type] ?? `Analyze: ${data}` },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message ?? "AI error" })}\n\n`);
  }
  res.end();
});

// ─── Build dApp from prompt ────────────────────────────────────────────────
// Model: gpt-5.6-terra — full dApp generation needs reasoning quality; 2048 for 5-6 component JSON
aiRouter.post("/build-dapp", async (req, res) => {
  const { prompt } = req.body as { prompt: string };

  if (!prompt?.trim()) {
    res.status(400).json({ ok: false, error: "prompt is required" });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.6-terra", // terra: full dApp layout needs coherent multi-component reasoning
      max_completion_tokens: 2048, // 5-6 component JSON fits comfortably in 2048
      messages: [
        {
          role: "system",
          content: `${MONAD_SYSTEM}

You generate a complete MonadBuilder+ dApp layout from a one-sentence idea.
Return ONLY valid JSON — no markdown, no explanation:
{
  "projectName": "<short catchy dApp name derived from the idea>",
  "components": [
    {
      "type": "<component type>",
      "props": { <component-specific props with correct Monad values> }
    }
    // 5-6 components total, ordered logically for a dApp page
  ]
}

Always include 5-6 components. Always start with a hero-section or stats-row.
Always include wallet-connect near the top. End with a button or paragraph call-to-action.
Set chainId: 143, rpcUrl: "https://rpc.monad.xyz", networkName: "Monad Mainnet" on all Web3 components.
Tailor the dApp type (DeFi/NFT/DAO/token) to the user's idea.

Valid component types ONLY (use exactly these strings):
  wallet-connect, token-balance, nft-gallery, transaction-feed,
  token-swap, price-chart, dao-vote,
  hero-section, card, stats-row, divider,
  heading, paragraph, button, image

Common props:
- wallet-connect: { label: "Connect Wallet", chainId: 143, networkName: "Monad Mainnet" }
- token-swap: { fromToken: "MON", toToken: "USDC", chainId: 143, rpcUrl: "https://rpc.monad.xyz" }
- token-balance: { asset: "MON", chainId: 143, rpcUrl: "https://rpc.monad.xyz" }
- nft-gallery: { limit: 8, columns: 4, contractAddress: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A" }
- dao-vote: { title: "Governance", subtitle: "Vote on proposals", chainId: 143 }
- stats-row: { items: 3, chainId: 143 }
- price-chart: { token: "MON", chainId: 143 }
- transaction-feed: { limit: 5, explorerUrl: "https://monadvision.com" }
- hero-section: { title: "...", subtitle: "..." }
- button: { label: "...", variant: "primary" }
- paragraph: { text: "..." }`,
        },
        {
          role: "user",
          content: `Build a dApp for: "${prompt}"`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    if (!raw) {
      res.status(500).json({ ok: false, error: "AI returned an empty response — please try again." });
      return;
    }
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Model returned truncated or non-JSON — log and surface clearly
      console.error("[build-dapp] JSON parse failed. finish_reason:", response.choices[0]?.finish_reason, "raw:", raw.slice(0, 300));
      res.status(500).json({ ok: false, error: "AI response was not valid JSON. Try a simpler prompt." });
      return;
    }

    // Validate and remap component types against the palette
    const { components: validatedRaw, warnings } = validateComponents(parsed.components ?? []);

    if (validatedRaw.length === 0) {
      res.status(500).json({ ok: false, error: "AI returned no valid components. Try a different prompt.", warnings });
      return;
    }

    // Assign stable IDs and order
    const components = validatedRaw.map((c, i) => ({
      id: `comp_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      type: c.type,
      props: (c.props as Record<string, any>) ?? {},
      order: i,
    }));

    res.json({ ok: true, projectName: parsed.projectName ?? "My Monad dApp", components, warnings });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Audit dApp (streaming) ────────────────────────────────────────────────
// Model: gpt-5.6-terra — structured audit with multiple reasoning sections; 4096 for thorough output
aiRouter.post("/audit-dapp", async (req, res) => {
  const { projectName, components } = req.body as {
    projectName: string;
    components: Array<{ type: string; props: Record<string, any> }>;
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const compSummary = components
    .map((c, i) => `${i + 1}. ${c.type} — ${JSON.stringify(c.props).slice(0, 120)}`)
    .join("\n");

  const auditPrompt = `Audit this MonadBuilder+ dApp named "${projectName}" against Monad best practices and THESIS OS governance rules.

Components on canvas:
${compSummary}

Provide a structured audit with these sections (use markdown headers):
## Overall Score
Give a score out of 10 and a one-line verdict.

## Component Coverage
Assess which Web3 capabilities are present and what's missing for a production dApp of this type.

## Gas Risk
Identify any components that could generate heavy gas usage on Monad (remember: gas_LIMIT × gas_PRICE model). Suggest tight limit strategies.

## THESIS Governance Opportunities
Suggest where THESIS OS laws, PolicyKernel proposals, or ReceiptChain logging would add governance value to this specific dApp.

## Missing Pieces
List the top 3-5 components or features this dApp needs to be production-ready on Monad Mainnet (Chain ID 143).

Be specific to the actual components listed. Do not give generic advice.`;

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.6-terra", // terra: multi-section audit requires coherent reasoning quality
      max_completion_tokens: 4096, // structured audit with 5 sections; 4096 covers it fully
      messages: [
        { role: "system", content: MONAD_SYSTEM },
        { role: "user", content: auditPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message ?? "AI error" })}\n\n`);
  }
  res.end();
});

// ─── Recommend template ────────────────────────────────────────────────────
aiRouter.post("/recommend-template", async (req, res) => {
  const { description, templates } = req.body as {
    description: string;
    templates: Array<{ id: number; name: string; slug?: string; category: string; description: string }>;
  };

  if (!description?.trim() || !templates?.length) {
    res.status(400).json({ ok: false, error: "description and templates are required" });
    return;
  }

  try {
    const templateList = templates
      .map((t) => `ID ${t.id}: [${t.category}] ${t.name} — ${t.description}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-5.6-luna",
      max_completion_tokens: 256,
      messages: [
        {
          role: "system",
          content: `${MONAD_SYSTEM}

You recommend the best MonadBuilder+ template for a user's dApp idea.
Return ONLY valid JSON — no markdown:
{ "templateId": <number>, "reason": "<one sentence why this template fits best>" }`,
        },
        {
          role: "user",
          content: `User wants to build: "${description}"\n\nAvailable templates:\n${templateList}\n\nWhich template ID best matches?`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    res.json({ ok: true, templateId: parsed.templateId, reason: parsed.reason });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Refine dApp from follow-up prompt ───────────────────────────────────
// Model: gpt-5.6-terra — refining a layout needs coherent multi-component reasoning
aiRouter.post("/refine-dapp", async (req, res) => {
  const { projectName, currentComponents, refinementPrompt } = req.body as {
    projectName: string;
    currentComponents: Array<{ type: string; props: Record<string, any> }>;
    refinementPrompt: string;
  };

  if (!refinementPrompt?.trim()) {
    res.status(400).json({ ok: false, error: "refinementPrompt is required" });
    return;
  }

  try {
    const currentSummary = (currentComponents ?? [])
      .map((c, i) => {
        const extra = c.props?.title ? ` (title: "${c.props.title}")` : c.props?.label ? ` (label: "${c.props.label}")` : "";
        return `${i + 1}. ${c.type}${extra}`;
      })
      .join("\n") || "(canvas is empty)";

    const response = await openai.chat.completions.create({
      model: "gpt-5.6-terra", // terra: refine needs the same reasoning quality as build-dapp
      max_completion_tokens: 2048, // updated layout is similar size to original; 2048 is sufficient
      messages: [
        {
          role: "system",
          content: `${MONAD_SYSTEM}

You refine an existing MonadBuilder+ dApp layout based on a user instruction.
Return ONLY valid JSON — no markdown, no explanation:
{
  "components": [
    {
      "type": "<component type>",
      "props": { <component-specific props with correct Monad values> }
    }
    // 4-8 components total, ordered logically for a dApp page
  ]
}

Rules:
- Preserve components from the current layout that still make sense after the instruction.
- Add, remove, or reorder components to fulfill the instruction. Be decisive.
- Always keep wallet-connect if already present.
- Do not duplicate component types unless the instruction explicitly calls for it.
- Set chainId: 143, rpcUrl: "https://rpc.monad.xyz", networkName: "Monad Mainnet" on all Web3 components.

Valid component types ONLY (use exactly these strings):
  wallet-connect, token-balance, nft-gallery, transaction-feed,
  token-swap, price-chart, dao-vote,
  hero-section, card, stats-row, divider,
  heading, paragraph, button, image

Common props:
- wallet-connect: { label: "Connect Wallet", chainId: 143, networkName: "Monad Mainnet" }
- token-swap: { fromToken: "MON", toToken: "USDC", chainId: 143, rpcUrl: "https://rpc.monad.xyz" }
- token-balance: { asset: "MON", chainId: 143, rpcUrl: "https://rpc.monad.xyz" }
- nft-gallery: { limit: 8, columns: 4, contractAddress: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A" }
- dao-vote: { title: "Governance", subtitle: "Vote on proposals", chainId: 143 }
- stats-row: { items: 3, chainId: 143 }
- price-chart: { token: "MON", chainId: 143 }
- transaction-feed: { limit: 5, explorerUrl: "https://monadvision.com" }
- hero-section: { title: "...", subtitle: "..." }
- button: { label: "...", variant: "primary" }
- paragraph: { text: "..." }`,
        },
        {
          role: "user",
          content: `dApp: "${projectName ?? "My Monad dApp"}"

Current components on canvas:
${currentSummary}

User instruction: "${refinementPrompt}"

Return an updated component list that incorporates this instruction.`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    if (!raw) {
      res.status(500).json({ ok: false, error: "AI returned an empty response — please try again." });
      return;
    }
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[refine-dapp] JSON parse failed. finish_reason:", response.choices[0]?.finish_reason, "raw:", raw.slice(0, 300));
      res.status(500).json({ ok: false, error: "AI response was not valid JSON. Try a simpler instruction." });
      return;
    }

    // Validate and remap component types against the palette
    const { components: validatedRaw, warnings } = validateComponents(parsed.components ?? []);

    if (validatedRaw.length === 0) {
      res.status(500).json({ ok: false, error: "AI returned no valid components. Try a different instruction.", warnings });
      return;
    }

    const components = validatedRaw.map((c, i) => ({
      id: `comp_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      type: c.type,
      props: (c.props as Record<string, any>) ?? {},
      order: i,
    }));

    res.json({ ok: true, components, warnings });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Script generator ─────────────────────────────────────────────────────
// Model: gpt-5.6-luna — scripts are short and straightforward; 2048 tokens is plenty
aiRouter.post("/script", async (req, res) => {
  const { prompt, lang = "python" } = req.body as {
    prompt: string;
    lang?: "python" | "js";
  };

  try {
    const langNote =
      lang === "python"
        ? "Generate Python 3 using only stdlib (urllib.request, json, sys). No pip installs."
        : "Generate Node.js using only built-in fetch (Node 18+). No npm installs.";

    const response = await openai.chat.completions.create({
      model: "gpt-5.6-luna",
      max_completion_tokens: 2048, // scripts are short; 2048 covers any reasonable Monad script
      messages: [
        {
          role: "system",
          content: `${MONAD_SYSTEM}

You generate scripts that interact with Monad blockchain. ${langNote}
Always use RPC URL: https://rpc.monad.xyz
Chain ID: 143
Return ONLY the script — no markdown fences, no explanation outside comments.`,
        },
        { role: "user", content: prompt },
      ],
    });

    const script = response.choices[0]?.message?.content ?? "";
    res.json({ ok: true, script: script.replace(/```(?:python|js|javascript)?\n?/g, "").replace(/```\n?/g, "").trim() });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
