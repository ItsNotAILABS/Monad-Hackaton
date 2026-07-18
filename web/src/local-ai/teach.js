/**
 * Teach-as-you-use curriculum for the browser environment + security.
 * Progress stored locally (localStorage). Never requires network.
 */

const PROGRESS_KEY = "thesis.local_ai.teach.v1";

export const LESSONS = [
  {
    id: "env.overview",
    track: "environment",
    title: "What lives in your browser",
    minutes: 2,
    teach: (
      "This tab is a full browser environment: inference (Transformers.js), durable storage (IndexedDB), " +
      "agents (Scout/Risk/Synthesizer), document generation (Markdown/PDF/Excel), security scanning, " +
      "and a packaged extension download. None of this needs a cloud LLM."
    ),
    do: "Open each capability card on LOCAL AI and note which are online vs need Load model.",
    security: "Secrets never leave the device. Prefer this surface over pasting keys into any chat.",
    quiz: {
      q: "Where does Transformers.js inference run?",
      options: ["Cloud GPU", "Your browser", "Monad RPC", "Excel only"],
      answer: 1,
    },
  },
  {
    id: "sec.keys",
    track: "security",
    title: "Never paste keys or seeds",
    minutes: 2,
    teach: (
      "The security gate scans for 64-hex private keys, seed phrases, API keys, and Bearer tokens. " +
      "Critical findings block Remember and Research before data is stored."
    ),
    do: "Try pasting a fake seed phrase into Memory — the gate should refuse. Then paste a normal note.",
    security: "sys.no-real-keys · wallets are public address only · AI twins never export keys.",
    quiz: {
      q: "What happens if you paste a mnemonic into Local AI memory?",
      options: ["It trains the model", "Security gate blocks it", "It deploys a vault", "It is emailed to you"],
      answer: 1,
    },
  },
  {
    id: "sec.approve",
    track: "security",
    title: "Unlimited approvals & silent broadcast",
    minutes: 3,
    teach: (
      "Risk patterns flag unlimited approvals, auto-broadcast without signature, key export language, " +
      "fat gas limits (Monad bills the limit), blob txs, and force_live on non-live adapters."
    ),
    do: "Run Security audit after researching 'unlimited approve and auto-broadcast'. Read findings.",
    security: "proto.exact-approval · exec.no-silent-broadcast · monad.gas-bills-limit",
    quiz: {
      q: "On Monad, users pay for which gas quantity?",
      options: ["gas used only", "gas_limit × price", "zero if failed", "blob data only"],
      answer: 1,
    },
  },
  {
    id: "env.inference",
    track: "environment",
    title: "Load local inference",
    minutes: 2,
    teach: (
      "Click Load local model to pull MiniLM into the browser cache (first time only). " +
      "Embeddings power memory recall and research ranking. If the model fails, a bag-of-words fallback still works."
    ),
    do: "Press Load local model and wait until state = ready.",
    security: "Model files are public weights — still never feed them private keys.",
    quiz: {
      q: "What is the default local embedding model?",
      options: ["GPT-4", "Xenova/all-MiniLM-L6-v2", "Claude", "onchain LLM"],
      answer: 1,
    },
  },
  {
    id: "env.memory",
    track: "environment",
    title: "Local storage & recall",
    minutes: 2,
    teach: (
      "Notes, events, docs, and research runs live in IndexedDB (thesis-local-memory). " +
      "Remember attaches an embedding when the model is ready so Research can recall prior notes."
    ),
    do: "Save a short note about gas_limit margin ~7.5%. Confirm it appears under Recent notes.",
    security: "Storage is browser-profile local. Clearing site data wipes memory — not the chain.",
    quiz: {
      q: "Where are Local AI notes stored?",
      options: ["GitHub", "Monad mainnet", "IndexedDB in your browser", "Google Sheets"],
      answer: 2,
    },
  },
  {
    id: "env.agents",
    track: "environment",
    title: "Run research agents safely",
    minutes: 3,
    teach: (
      "Scout maps memory + knowledge graph + platform pulse. Risk scans patterns. " +
      "Synthesizer ranks insights and next actions. Platform pulse is public state only (laws count, equity, venues)."
    ),
    do: "Run research on Monad gas + vault signature gate. Open the generated report.",
    security: "Agents never get wallet private keys. Promote-to-chain still requires your signature elsewhere.",
    quiz: {
      q: "Which agent flags custody and gas risks?",
      options: ["Scout", "Risk", "Excel", "Forge"],
      answer: 1,
    },
  },
  {
    id: "env.exports",
    track: "environment",
    title: "PDF, Excel, Markdown exports",
    minutes: 2,
    teach: (
      "Generate ops and security briefs as Markdown (IndexedDB), PDF (jsPDF), or Excel (SheetJS). " +
      "Downloads stay on your machine — use them for audits, desks, and submissions."
    ),
    do: "Export Security brief PDF and a Platform inventory Excel workbook.",
    security: "Exports are scanned before write. Critical secrets in source text abort the export.",
    quiz: {
      q: "Do PDF/Excel exports upload to THESIS servers?",
      options: ["Yes always", "No — generated and downloaded in-browser", "Only Excel", "Only if vault is live"],
      answer: 1,
    },
  },
  {
    id: "env.extension",
    track: "environment",
    title: "Packaged extension download",
    minutes: 3,
    teach: (
      "Download a packaged Chrome/Edge extension (ZIP) that mirrors the security scanner and platform quick-links. " +
      "Load unpacked via chrome://extensions → Developer mode. It does not request wallet keys."
    ),
    do: "Download the extension ZIP, unzip, Load unpacked, pin the popup, run a page security scan.",
    security: (
      "Review manifest permissions (activeTab + storage only). Never install extensions that ask for " +
      "'all sites' + clipboard without need."
    ),
    quiz: {
      q: "How should you install the THESIS security extension?",
      options: [
        "From a random Telegram zip with 'enable all sites'",
        "Load unpacked after reviewing manifest (activeTab + storage)",
        "Paste seed into the extension",
        "Disable browser security",
      ],
      answer: 1,
    },
  },
  {
    id: "sec.platform",
    track: "security",
    title: "How security ties to the platform",
    minutes: 3,
    teach: (
      "Platform primitives (identity, law, capital, market, intel, local_ai) share one doctrine: " +
      "agents propose, laws decide, owner signs, receipts remember. Local AI is the browser-side seatbelt."
    ),
    do: "From LOCAL AI open Platform shell, then Desk, and note NOMOS reject is a feature.",
    security: "sys.nomos-veto · sys.owner-sovereign · sys.sandbox-first",
    quiz: {
      q: "Who remains sovereign for chain broadcasts?",
      options: ["The research agent", "The wallet owner who signs", "MiniLM", "Excel export"],
      answer: 1,
    },
  },
];

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveProgress(p) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export function markLesson(id, { quizOk } = {}) {
  const p = loadProgress();
  p[id] = {
    done: true,
    quizOk: !!quizOk,
    at: Date.now(),
  };
  saveProgress(p);
  return p;
}

export function teachStats() {
  const p = loadProgress();
  const total = LESSONS.length;
  const done = LESSONS.filter((l) => p[l.id]?.done).length;
  const quizOk = LESSONS.filter((l) => p[l.id]?.quizOk).length;
  return {
    total,
    done,
    quizOk,
    pct: Math.round((100 * done) / Math.max(total, 1)),
    next: LESSONS.find((l) => !p[l.id]?.done) || null,
  };
}

export function getLesson(id) {
  return LESSONS.find((l) => l.id === id) || LESSONS[0];
}

/** Context tips shown while using each tool */
export const TOOL_TIPS = {
  inference: {
    title: "Inference",
    body: "Load MiniLM once. Embeddings rank memory and research. Fallback vectorizer works offline if WASM fails.",
    security: "Public model weights only — never type secrets into the embed box.",
  },
  memory: {
    title: "Storage",
    body: "IndexedDB holds notes, events, docs, runs. Remember + Research attach embeddings for recall.",
    security: "Gate blocks keys/seeds before write. Clearing site data wipes local memory.",
  },
  agents: {
    title: "Agents",
    body: "Scout maps graph/memory. Risk flags patterns. Synthesizer writes next actions + report.",
    security: "Uses public platform pulse only. No private key access.",
  },
  security: {
    title: "Security scanning",
    body: "Scan text, audit memory, export briefs. Critical = block. High/medium = teach + log.",
    security: "Findings store labels/samples truncated — not full secrets.",
  },
  pdf: {
    title: "PDF generation",
    body: "jsPDF builds multi-page reports in-browser from security, research, or ops snapshots.",
    security: "Source text is scanned; critical patterns abort export.",
  },
  excel: {
    title: "Excel generation",
    body: "SheetJS builds .xlsx workbooks (inventory, findings, notes). Opens in Excel/Sheets.",
    security: "Same security gate as PDF. Prefer redacted findings for sharing.",
  },
  extension: {
    title: "Extension package",
    body: "ZIP of a Chrome/Edge extension: popup scanner + THESIS links. Load unpacked after review.",
    security: "Permissions: activeTab, storage. Refuse builds that demand <all_urls> without reason.",
  },
  graph: {
    title: "Knowledge graph",
    body: "Hydrate from platform venues/laws/apps. Ingest text for pairs, addresses, topics.",
    security: "Addresses stored truncated in nodes; never store keys as node props.",
  },
};

export function securityPlaybook() {
  return [
    {
      rule: "No real keys in browser AI",
      how: "Use wallet extension connect (public address). Local AI gate rejects seeds/hex keys.",
      law: "sys.no-real-keys",
    },
    {
      rule: "Exact approvals only",
      how: "Security scan flags unlimited approve language; desk/NOMOS enforce exact amounts.",
      law: "proto.exact-approval",
    },
    {
      rule: "No silent broadcast",
      how: "Agents propose; vault route is simulation; you sign in wallet UI.",
      law: "exec.no-silent-broadcast",
    },
    {
      rule: "Monad gas = limit",
      how: "Avoid 2× buffers. Use ~7.5% margin; hardcode 21k for native transfers.",
      law: "monad.gas-bills-limit",
    },
    {
      rule: "Sandbox first for AI",
      how: "Server AI mutates twins only. Local AI never claims live capital control.",
      law: "sys.sandbox-first",
    },
    {
      rule: "Review extension permissions",
      how: "Load unpacked only after reading manifest.json. activeTab + storage is enough here.",
      law: "sys.owner-sovereign",
    },
  ];
}
