import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Zap, Layout, Blocks, Rocket, ArrowRight, ExternalLink,
  Cpu, Clock, Shield, Copy, CheckCheck, Layers, Terminal,
  Sparkles, Loader2,
} from "lucide-react";
import { useGetDashboardStats, useCreateProject, useUpdateProject, getListProjectsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { DailyBrief } from "@/components/home/DailyBrief";
import { useState, useRef } from "react";
import { buildDapp } from "@/lib/ai";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSetAIContext } from "@/lib/aiPageContext";

// Monad Testnet data — source: docs.monad.xyz
const MONAD_NETWORK = {
  name: "Monad Testnet",
  chainId: 10143,
  currency: "MON",
  tps: "10,000",
  blockTime: "400ms",
  finality: "800ms",
  rpcUrls: [
    { url: "https://testnet-rpc.monad.xyz", provider: "Official" },
  ],
  explorers: [
    { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  ],
  wrappedMON: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
  version: "v0.14.5 / MONAD_NINE",
  maxContractSize: "128 KB",
};

const BUILD_STEPS = [
  "✨ Expanding your idea into an expert spec…",
  "🏗️ Choosing the right components…",
  "⚡ Configuring Monad Testnet values…",
  "🎨 Assembling your canvas…",
  "🚀 Almost ready…",
];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-2 text-white/30 hover:text-primary transition-colors"
    >
      {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function Home() {
  const { data: stats } = useGetDashboardStats();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const [idea, setIdea] = useState("");
  const [building, setBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(0);
  const [buildError, setBuildError] = useState("");
  const [enrichedPrompt, setEnrichedPrompt] = useState("");
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useSetAIContext("Current page: Home — user is exploring MonadBuilder+. Help them understand the platform, suggest what kind of dApp to build, and explain Monad/THESIS features.");

  const startStepCycle = () => {
    let step = 0;
    setBuildStep(0);
    stepTimerRef.current = setInterval(() => {
      step = (step + 1) % BUILD_STEPS.length;
      setBuildStep(step);
    }, 1400);
  };

  const stopStepCycle = () => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  };

  const handleBuildDapp = async () => {
    const trimmed = idea.trim();
    if (!trimmed || building) return;

    setBuildError("");
    setEnrichedPrompt("");
    setBuilding(true);
    startStepCycle();

    try {
      const result = await buildDapp(trimmed);
      if (!result) throw new Error("AI could not generate a dApp — try rephrasing.");

      // Show enriched prompt briefly before navigating
      if (result.enrichedPrompt && result.enrichedPrompt !== trimmed) {
        setEnrichedPrompt(result.enrichedPrompt);
      }

      // Surface any type remapping/drop warnings from the AI validator
      if (result.warnings.length > 0) {
        for (const w of result.warnings) {
          toast.warning("AI adjusted a component", { description: w, duration: 6000 });
        }
      }

      // Create the project
      const project = await new Promise<any>((resolve, reject) => {
        createProject.mutate(
          { data: { name: result.projectName, description: `Built from: "${trimmed}"` } },
          {
            onSuccess: resolve,
            onError: reject,
          }
        );
      });

      // Update it with the AI-generated components
      await new Promise<void>((resolve, reject) => {
        updateProject.mutate(
          { id: project.id, data: { components: result.components as any } },
          {
            onSuccess: () => resolve(),
            onError: reject,
          }
        );
      });

      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });

      stopStepCycle();
      setBuilding(false);
      setLocation(`/builder/${project.id}`);
    } catch (err: any) {
      stopStepCycle();
      setBuilding(false);
      setBuildError(err?.message ?? "Something went wrong. Please try again.");
    }
  };

  const handleIdeaKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleBuildDapp();
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-32 px-4 relative z-10">

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span>Build it. Govern it. Ship it on Monad — Chain ID {MONAD_NETWORK.chainId}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight">
            MonadBuilder<span className="text-primary">+</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 mb-4 max-w-3xl mx-auto font-light leading-relaxed">
            No-code dApp builder. THESIS OS governance. Merkl rewards.
            <br className="hidden md:block" />
            <span className="text-white/40">Describe it. AI builds it. Deploy it on-chain. In minutes.</span>
          </p>

          <p className="text-base text-white/35 mb-10 max-w-2xl mx-auto leading-relaxed">
            Type any idea → AI expands it into a full spec → builds the dApp → MetaMask deploys your own smart contract on Monad Testnet.
            <span className="text-primary/50"> This app was built with itself.</span>
          </p>

          {/* ── "Idea to dApp" input ── */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 to-violet-500/40 rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-black/80 border border-white/10 rounded-xl overflow-hidden">
                <Sparkles className="w-5 h-5 text-primary/60 ml-4 shrink-0" />
                <input
                  type="text"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  onKeyDown={handleIdeaKey}
                  placeholder="Describe your dApp idea and AI will build it…"
                  className="flex-1 bg-transparent text-white placeholder-white/25 px-3 py-4 text-base outline-none"
                  disabled={building}
                />
                <button
                  onClick={handleBuildDapp}
                  disabled={!idea.trim() || building}
                  className="m-2 px-5 py-2.5 bg-primary hover:bg-primary/80 disabled:opacity-40 text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-2 shrink-0"
                >
                  {building ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Building…</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Build dApp</>
                  )}
                </button>
              </div>
            </div>

            {/* Building step indicator */}
            {building && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-primary/70 text-center font-mono flex items-center justify-center gap-2"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {BUILD_STEPS[buildStep]}
              </motion.div>
            )}

            {/* Enriched prompt callout — shown once expanded spec is ready */}
            {enrichedPrompt && !buildError && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[11px] font-bold text-primary uppercase tracking-widest">AI expanded your idea</span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{enrichedPrompt}</p>
              </motion.div>
            )}

            {buildError && (
              <p className="mt-3 text-sm text-red-400 text-center">{buildError}</p>
            )}

            <p className="mt-3 text-xs text-white/20 text-center">
              Try: "token swap for MON/USDC" · "DAO voting dashboard" · "NFT gallery with staking rewards"
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/dashboard" className="inline-flex items-center justify-center h-12 px-7 rounded-md text-sm font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all gap-2">
              My Projects <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/platform" className="inline-flex items-center justify-center h-12 px-7 rounded-md text-sm font-bold border border-primary/20 text-primary/70 hover:bg-primary/10 transition-all gap-2">
              <Layers className="w-4 h-4" /> THESIS Platform
            </Link>
            <Link href="/templates" className="inline-flex items-center justify-center h-12 px-7 rounded-md text-sm font-bold border border-white/10 text-white/50 hover:bg-white/5 transition-all">
              Templates
            </Link>
          </div>

          {/* ── Recursive Demo Banner ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <Link href="/preview/7">
              <div className="group relative flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <Rocket className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-bold text-white">MonadBuilder+ Protocol — Live Demo</div>
                  <div className="text-xs text-white/40 mt-0.5">
                    This app, built with this app, deployed on Monad. The recursive proof.
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-primary/60 group-hover:text-primary transition-colors shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-mono">published</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Monad network stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-16 grid grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          {[
            { icon: Cpu,   label: "Throughput", value: MONAD_NETWORK.tps + " TPS", color: "text-primary" },
            { icon: Clock, label: "Block Time",  value: MONAD_NETWORK.blockTime,    color: "text-secondary" },
            { icon: Shield,label: "Finality",    value: MONAD_NETWORK.finality,     color: "text-primary" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="text-center p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
              <div className={`text-2xl font-mono font-bold ${color} mb-1`}>{value}</div>
              <div className="text-xs text-white/40 uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Community stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border border-white/10 bg-black/40 backdrop-blur-xl p-8 rounded-2xl"
          >
            {[
              { value: stats.totalProjects,           label: "Total Projects",  color: "text-white" },
              { value: stats.publishedProjects,        label: "Published",       color: "text-primary" },
              { value: stats.totalTemplates,           label: "Templates",       color: "text-secondary" },
              { value: stats.recentProjects?.length,   label: "Active Builders", color: "text-white" },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center">
                <div className={`text-4xl font-mono font-bold ${color} mb-2`}>{value ?? 0}</div>
                <div className="text-sm text-white/50 font-medium uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── What is MonadBuilder+ ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-32 max-w-5xl mx-auto w-full"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Two systems. One platform.
            </h2>
            <p className="text-white/45 max-w-xl mx-auto">
              MonadBuilder<span className="text-primary">+</span> ships the dApp UI. 
              THESIS OS governs how it runs. Together on Monad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Builder side */}
            <div className="p-7 rounded-2xl border border-primary/20 bg-primary/[0.04]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Layout className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-white">MonadBuilder+</div>
                  <div className="text-xs text-white/40">No-code dApp builder</div>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm text-white/60">
                {[
                  "Drag-and-drop Web3 components onto a visual canvas",
                  "Wallet connect, token swap, NFT gallery, DAO vote — pre-wired for Monad",
                  "One-click publish with live preview URL",
                  "5 DeFi / NFT / DAO / Token templates to start from",
                ].map(t => (
                  <li key={t} className="flex gap-2">
                    <span className="text-primary mt-0.5 shrink-0">▸</span> {t}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary/70 transition-colors">
                Open Builder <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* THESIS side */}
            <div className="p-7 rounded-2xl border border-violet-500/20 bg-violet-500/[0.04]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <div className="font-bold text-white">THESIS OS</div>
                  <div className="text-xs text-white/40">DeFi governance engine</div>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm text-white/60">
                {[
                  "Multi-agent proposals — agents suggest, laws filter, owner approves",
                  "Gas coach: pay limit × price on Monad — ~7.5% margin enforced",
                  "Onchain law enforcement: SovereignVault + PolicyKernel + ReceiptChain",
                  "16 MCP tools usable by you, your AI, or any external agent",
                ].map(t => (
                  <li key={t} className="flex gap-2">
                    <span className="text-violet-400 mt-0.5 shrink-0">▸</span> {t}
                  </li>
                ))}
              </ul>
              <Link href="/platform" className="mt-5 inline-flex items-center gap-1.5 text-sm text-violet-400 font-medium hover:text-violet-300 transition-colors">
                Open Platform <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Feature grid ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <Blocks className="w-10 h-10 text-secondary mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Monad Primitives</h3>
            <p className="text-white/60">14 components across Web3, Layout, and Content — every one pre-wired to Monad Mainnet, Chain ID 143.</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <Terminal className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Workspace Terminal</h3>
            <p className="text-white/60">Upload files and ZIPs, run Python against Monad RPC, check balances and blocks — all from the browser.</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <Rocket className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Instant Deploy</h3>
            <p className="text-white/60">Push to production in seconds. Live preview URLs automatically generated and publicly shareable.</p>
          </div>
        </motion.div>

        {/* ── Daily Brief ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-24 max-w-2xl mx-auto w-full"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Today's Brief</h2>
            <p className="text-white/35 text-sm">AI-delivered by THESIS OS · resets daily</p>
          </div>
          <DailyBrief />
        </motion.div>

        {/* ── Monad Network Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="mt-24 max-w-4xl mx-auto w-full"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h2 className="text-lg font-mono font-bold text-white/80">{MONAD_NETWORK.name}</h2>
            <span className="text-xs text-white/30 font-mono ml-auto">{MONAD_NETWORK.version}</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden divide-y divide-white/5">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
              {[
                { label: "Chain ID",       value: String(MONAD_NETWORK.chainId) },
                { label: "Currency",       value: MONAD_NETWORK.currency },
                { label: "Max Contract",   value: MONAD_NETWORK.maxContractSize },
                { label: "EVM Compatible", value: "Fusaka fork" },
              ].map(({ label, value }) => (
                <div key={label} className="p-5">
                  <div className="text-xs text-white/30 uppercase tracking-widest mb-1">{label}</div>
                  <div className="font-mono font-bold text-white text-sm">{value}</div>
                </div>
              ))}
            </div>

            <div className="p-5">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-3">Public RPC Endpoints</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MONAD_NETWORK.rpcUrls.map(({ url, provider }) => (
                  <div key={url} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                    <span className="text-xs text-white/40 w-20 shrink-0">{provider}</span>
                    <span className="font-mono text-xs text-white/70 truncate flex-1">{url}</span>
                    <CopyButton value={url} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
              <div className="p-5">
                <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Wrapped MON (WMON)</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-white/60 truncate">{MONAD_NETWORK.wrappedMON}</span>
                  <CopyButton value={MONAD_NETWORK.wrappedMON} />
                </div>
              </div>
              <div className="p-5">
                <div className="text-xs text-white/30 uppercase tracking-widest mb-3">Block Explorers</div>
                <div className="flex gap-3 flex-wrap">
                  {MONAD_NETWORK.explorers.map(({ name, url }) => (
                    <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                      {name} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                  <a href="https://docs.monad.xyz" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors ml-auto">
                    docs.monad.xyz <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
