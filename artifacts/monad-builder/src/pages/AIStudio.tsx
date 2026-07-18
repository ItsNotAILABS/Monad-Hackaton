/**
 * AI Studio — dedicated AI workspace for MonadBuilder+
 * Tabs: Chat | dApp Generator | Analyzer | Script Writer | Gas Lab
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Send, Loader2, RotateCcw, Zap, Code,
  FlaskConical, Layers, ChevronRight, Copy, CheckCheck, FileCode,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { streamChat, streamAnalysis, generateScript, type ChatMessage } from "@/lib/ai";

// ─── Utility ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-white/25 hover:text-white/60 transition-colors"
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function StreamingOutput({ text, loading }: { text: string; loading: boolean }) {
  return (
    <div className="flex-1 overflow-y-auto rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 text-sm text-white/75 leading-relaxed whitespace-pre-wrap font-mono min-h-[200px] relative">
      {loading && !text && (
        <div className="flex items-center gap-2 text-white/30">
          <Loader2 className="w-4 h-4 animate-spin" /> Generating…
        </div>
      )}
      {text}
      {loading && text && <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 animate-pulse align-middle" />}
    </div>
  );
}

// ─── Chat tab ─────────────────────────────────────────────────────────────
const CHAT_STARTERS = [
  "Walk me through building a DAO voting dApp on Monad step by step",
  "How should I structure THESIS laws for a DeFi protocol?",
  "What's the difference between EcosystemLaw and LawBook in THESIS OS?",
  "Generate a MonadBuilder+ dApp spec for a yield aggregator",
  "Explain Monad's parallel EVM and how it affects smart contract design",
  "What components should I combine for an NFT marketplace on Monad?",
];

function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: t };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages((p) => [...p, { role: "assistant", content: "" }]);
    await streamChat(next, (chunk) => {
      setMessages((p) => {
        const a = [...p];
        const last = a[a.length - 1];
        if (last?.role === "assistant") last.content += chunk;
        return a;
      });
    }, () => setStreaming(false));
  }, [messages, streaming]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
            {CHAT_STARTERS.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="text-left p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 transition-all text-sm text-white/55 hover:text-white/80">
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-white/[0.05] text-white/80 rounded-bl-sm border border-white/[0.08]"
              }`}>
                {m.content}
                {streaming && i === messages.length - 1 && m.role === "assistant" && m.content === "" && (
                  <span className="flex items-center gap-1.5 text-white/30"><Loader2 className="w-3 h-3 animate-spin" />thinking…</span>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white/50">U</div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length > 0 && (
        <button onClick={() => setMessages([])} className="text-xs text-white/25 hover:text-white/50 flex items-center gap-1 self-start transition-colors">
          <RotateCcw className="w-3 h-3" /> New conversation
        </button>
      )}

      <div className="flex items-end gap-3 bg-white/[0.04] rounded-xl border border-white/[0.08] px-4 py-3">
        <textarea ref={inputRef} rows={1} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask anything about Monad, THESIS OS, or MonadBuilder+…"
          className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 resize-none outline-none max-h-32"
          style={{ height: Math.min(Math.max(input.split("\n").length, 1) * 22, 128) }}
          disabled={streaming} />
        <button onClick={() => send(input)} disabled={!input.trim() || streaming}
          className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center disabled:opacity-30 hover:bg-primary/80 transition-colors shrink-0">
          {streaming ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>
    </div>
  );
}

// ─── dApp Generator tab ───────────────────────────────────────────────────
const DAPP_EXAMPLES = [
  "A yield aggregator that auto-compounds MON staking rewards with a DAO governance module",
  "An NFT marketplace with royalty enforcement and creator DAO voting rights",
  "A multi-sig treasury management portal for a Monad protocol team",
];

function DAppGeneratorTab() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setOutput("");
    setLoading(true);
    await streamChat(
      [{ role: "user", content: `Generate a complete MonadBuilder+ dApp specification for: "${t}"\n\nInclude:\n1. **Overview** — what the dApp does\n2. **MonadBuilder+ Components** — list each component type to use and why\n3. **THESIS OS Integration** — which laws to configure, governance flow\n4. **Monad-specific notes** — gas, contract size, finality considerations\n5. **Launch checklist** — step-by-step to ship it` }],
      (chunk) => setOutput((p) => p + chunk),
      () => setLoading(false),
      "You are generating a dApp specification. Be detailed, structured with markdown headers, and Monad-specific."
    );
  }, [loading]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="space-y-2">
        <label className="text-xs text-white/40 uppercase tracking-widest">Describe your dApp</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
          placeholder="e.g. A perpetuals DEX with on-chain risk limits enforced by THESIS OS laws…"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 outline-none focus:border-primary/40 resize-none transition-colors" />
        <div className="flex gap-2 flex-wrap">
          {DAPP_EXAMPLES.map((e) => (
            <button key={e} onClick={() => setPrompt(e)}
              className="text-xs text-white/30 hover:text-white/60 px-2.5 py-1 rounded-lg border border-white/[0.07] hover:border-white/20 transition-all">
              {e.slice(0, 45)}…
            </button>
          ))}
        </div>
        <Button onClick={() => generate(prompt)} disabled={!prompt.trim() || loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Spec
        </Button>
      </div>
      {(output || loading) && (
        <div className="flex flex-col flex-1 gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30 uppercase tracking-widest">Specification</span>
            {output && <CopyBtn text={output} />}
          </div>
          <StreamingOutput text={output} loading={loading} />
        </div>
      )}
    </div>
  );
}

// ─── Analyzer tab ─────────────────────────────────────────────────────────
const ANALYSIS_TYPES = [
  { id: "contract", label: "Contract", desc: "Analyze a smart contract address or ABI", icon: FileCode },
  { id: "gas", label: "Gas",      desc: "Analyze a gas scenario or cost estimate",    icon: Zap },
  { id: "dapp",  label: "dApp",  desc: "Review a dApp concept or architecture",       icon: Layers },
  { id: "law",   label: "Law",   desc: "Analyze a THESIS OS law or governance rule",  icon: FlaskConical },
] as const;

function AnalyzerTab() {
  const [type, setType] = useState<"contract" | "gas" | "dapp" | "law">("contract");
  const [data, setData] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const placeholders: Record<string, string> = {
    contract: "Paste a contract address (0x…) or Solidity code snippet…",
    gas: "Describe the scenario: e.g. 'Deploying a 12KB contract with gasPrice 1.5 gwei, gasLimit 3,000,000 on Monad'",
    dapp: "Describe your dApp idea or paste an existing architecture description…",
    law: "Paste a THESIS law rule, e.g. 'REJECT any outflow > 10 MON without 2-of-3 approvals'",
  };

  const analyze = useCallback(async () => {
    if (!data.trim() || loading) return;
    setOutput("");
    setLoading(true);
    await streamAnalysis(type, data, (chunk) => setOutput((p) => p + chunk), () => setLoading(false));
  }, [type, data, loading]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-4 gap-2">
        {ANALYSIS_TYPES.map(({ id, label, desc, icon: Icon }) => (
          <button key={id} onClick={() => { setType(id); setOutput(""); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              type === id ? "border-primary/50 bg-primary/10 text-white" : "border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/15"
            }`}>
            <Icon className="w-4 h-4 mb-1.5" />
            <div className="text-xs font-semibold">{label}</div>
            <div className="text-[10px] text-white/30 leading-tight mt-0.5">{desc}</div>
          </button>
        ))}
      </div>
      <textarea value={data} onChange={(e) => setData(e.target.value)} rows={5}
        placeholder={placeholders[type]}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 outline-none focus:border-primary/40 resize-none transition-colors font-mono" />
      <Button onClick={analyze} disabled={!data.trim() || loading} className="gap-2 self-start">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
        Analyze
      </Button>
      {(output || loading) && (
        <div className="flex flex-col flex-1 gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30 uppercase tracking-widest">Analysis</span>
            {output && <CopyBtn text={output} />}
          </div>
          <StreamingOutput text={output} loading={loading} />
        </div>
      )}
    </div>
  );
}

// ─── Script Writer tab ────────────────────────────────────────────────────
const SCRIPT_EXAMPLES = [
  "Check the MON balance of an address",
  "Get the latest 5 block hashes",
  "Estimate gas for a WMON wrap transaction",
  "Read a contract's storage slot 0",
  "Batch check if 3 addresses have deployed contracts",
];

function ScriptWriterTab() {
  const [prompt, setPrompt] = useState("");
  const [lang, setLang] = useState<"python" | "js">("python");
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    if (!prompt.trim() || loading) return;
    setScript("");
    setLoading(true);
    try {
      const result = await generateScript(prompt, lang);
      setScript(result ?? "// Error generating script");
    } catch (err: any) {
      // Surface rate-limit and other errors directly in the editor
      setScript(`// ⚠ ${err.message ?? "Error generating script — try again."}`);
    }
    setLoading(false);
  }, [prompt, lang, loading]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-white/[0.08] overflow-hidden">
            {(["python", "js"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1.5 text-xs font-mono transition-colors ${lang === l ? "bg-primary text-white" : "text-white/40 hover:text-white/70"}`}>
                {l === "python" ? "Python 3" : "Node.js"}
              </button>
            ))}
          </div>
          <span className="text-xs text-white/25">stdlib only — runs in Workspace terminal</span>
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
          placeholder="Describe what you want the script to do on Monad…"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 outline-none focus:border-primary/40 resize-none transition-colors" />
        <div className="flex gap-2 flex-wrap">
          {SCRIPT_EXAMPLES.map((e) => (
            <button key={e} onClick={() => setPrompt(e)}
              className="text-xs text-white/30 hover:text-white/60 px-2.5 py-1 rounded-lg border border-white/[0.07] hover:border-white/20 transition-all">
              {e}
            </button>
          ))}
        </div>
        <Button onClick={generate} disabled={!prompt.trim() || loading} className="gap-2 self-start">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code className="w-4 h-4" />}
          Generate Script
        </Button>
      </div>
      {(script || loading) && (
        <div className="flex flex-col flex-1 gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30 uppercase tracking-widest">Generated Script</span>
            <div className="flex items-center gap-3">
              {script && <CopyBtn text={script} />}
              {script && (
                <a href="/workspace" className="text-xs text-primary hover:text-primary/70 transition-colors flex items-center gap-1">
                  Open in Workspace <ChevronRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
          <StreamingOutput text={script} loading={loading} />
        </div>
      )}
    </div>
  );
}

// ─── Gas Lab tab ──────────────────────────────────────────────────────────
function GasLabTab() {
  const [gasLimit, setGasLimit] = useState("100000");
  const [gasPrice, setGasPrice] = useState("1.5");
  const [monPrice, setMonPrice] = useState("2.50");

  const limitNum  = parseFloat(gasLimit)  || 0;
  const priceGwei = parseFloat(gasPrice)  || 0;
  const monUsd    = parseFloat(monPrice)  || 0;

  const costMon = (limitNum * priceGwei * 1e-9).toFixed(8);
  const costUsd = (parseFloat(costMon) * monUsd).toFixed(6);
  const costWei = (limitNum * priceGwei * 1e9).toLocaleString();

  const [analysis, setAnalysis] = useState("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const analyzeGas = useCallback(async () => {
    setAnalysis("");
    setLoadingAnalysis(true);
    await streamAnalysis("gas",
      `Gas limit: ${gasLimit}, Gas price: ${gasPrice} gwei, MON/USD: $${monPrice}\nCost: ${costMon} MON ($${costUsd} USD)\n\nAdvise on: whether this limit is appropriate, gas optimizations, Monad-specific considerations, comparison with typical costs.`,
      (chunk) => setAnalysis((p) => p + chunk),
      () => setLoadingAnalysis(false)
    );
  }, [gasLimit, gasPrice, monPrice, costMon, costUsd]);

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Gas Limit", value: gasLimit, set: setGasLimit, hint: "Units of gas" },
          { label: "Gas Price (gwei)", value: gasPrice, set: setGasPrice, hint: "Price per unit" },
          { label: "MON Price (USD)", value: monPrice, set: setMonPrice, hint: "For USD estimate" },
        ].map(({ label, value, set, hint }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-widest">{label}</label>
            <input type="number" value={value} onChange={(e) => set(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 font-mono outline-none focus:border-primary/40 transition-colors" />
            <p className="text-[11px] text-white/25">{hint}</p>
          </div>
        ))}
      </div>

      {/* ⚠ Monad gas model callout */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-sm text-amber-400/80">
        <span className="font-bold">Monad gas model:</span> You pay <code className="font-mono">gas_limit × gas_price</code> — not gas_used like Ethereum.
        Set tight limits. Under-estimate and you get reverted; over-estimate and you overpay the full amount.
      </div>

      {/* Cost breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Cost (MON)",  value: costMon, color: "text-primary" },
          { label: "Cost (USD)",  value: `$${costUsd}`, color: "text-secondary" },
          { label: "Cost (wei)",  value: costWei, color: "text-white/60" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] text-center">
            <div className="text-xs text-white/30 uppercase tracking-widest mb-2">{label}</div>
            <div className={`font-mono font-bold text-lg ${color} break-all`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Common operations reference */}
      <div className="rounded-xl border border-white/[0.07] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.07] bg-white/[0.02]">
          <span className="text-xs text-white/40 uppercase tracking-widest">Common gas limits on Monad</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {[
            { op: "Native MON transfer", limit: "21,000", note: "Fixed on EVM" },
            { op: "ERC-20 transfer",     limit: "~65,000", note: "Varies by token" },
            { op: "ERC-20 approve",      limit: "~46,000", note: "Standard approval" },
            { op: "Uniswap v2 swap",     limit: "~150,000", note: "Single hop" },
            { op: "NFT mint (simple)",   limit: "~80,000", note: "No metadata" },
            { op: "Contract deploy 5KB", limit: "~500,000", note: "Scales with bytecode" },
          ].map(({ op, limit, note }) => (
            <div key={op} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-white/60">{op}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-white/80">{limit}</span>
                <span className="text-xs text-white/25">{note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={analyzeGas} disabled={loadingAnalysis} variant="outline" className="gap-2 self-start">
        {loadingAnalysis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        AI Gas Advice
      </Button>
      {(analysis || loadingAnalysis) && <StreamingOutput text={analysis} loading={loadingAnalysis} />}
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────
const TABS = [
  { id: "chat",      label: "Chat",          icon: Sparkles,    component: ChatTab },
  { id: "dapp",      label: "dApp Generator",icon: Layers,      component: DAppGeneratorTab },
  { id: "analyzer",  label: "Analyzer",      icon: FlaskConical,component: AnalyzerTab },
  { id: "scripts",   label: "Script Writer", icon: Code,        component: ScriptWriterTab },
  { id: "gas",       label: "Gas Lab",       icon: Zap,         component: GasLabTab },
] as const;

type TabId = typeof TABS[number]["id"];

export default function AIStudio() {
  const [tab, setTab] = useState<TabId>("chat");
  const ActiveComponent = TABS.find((t) => t.id === tab)!.component;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 flex flex-col container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Studio</h1>
              <p className="text-white/40 text-sm">MonadBuilder<span className="text-primary">+</span> intelligence — chat, generate, analyze, calculate</p>
            </div>
            <div className="ml-auto hidden md:flex items-center gap-1.5 text-xs text-white/25 font-mono border border-white/[0.07] rounded-lg px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              gpt-5.6-luna · Monad-aware
            </div>
          </div>
        </motion.div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 border border-white/[0.07]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                tab === id ? "bg-primary text-white shadow-sm" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col min-h-0" style={{ minHeight: 500 }}>
          <ActiveComponent />
        </motion.div>
      </main>
    </div>
  );
}
