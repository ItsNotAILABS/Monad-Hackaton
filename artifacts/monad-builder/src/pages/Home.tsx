import { motion } from "framer-motion";
import { Link } from "wouter";
import { Zap, Layout, Blocks, Rocket, ArrowRight, ExternalLink, Cpu, Clock, Shield, Copy, CheckCheck } from "lucide-react";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { useState } from "react";

// Real Monad Mainnet data — source: docs.monad.xyz
const MONAD_NETWORK = {
  name: "Monad Mainnet",
  chainId: 143,
  currency: "MON",
  tps: "10,000",
  blockTime: "400ms",
  finality: "800ms",
  rpcUrls: [
    { url: "https://rpc.monad.xyz", provider: "QuickNode" },
    { url: "https://rpc1.monad.xyz", provider: "Alchemy" },
    { url: "https://rpc2.monad.xyz", provider: "Goldsky" },
    { url: "https://rpc3.monad.xyz", provider: "Ankr" },
  ],
  explorers: [
    { name: "MonadVision", url: "https://monadvision.com" },
    { name: "Monadscan", url: "https://monadscan.com" },
  ],
  wrappedMON: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A",
  version: "v0.14.5 / MONAD_NINE",
  maxContractSize: "128 KB",
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-2 text-white/30 hover:text-primary transition-colors"
    >
      {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function Home() {
  const { data: stats } = useGetDashboardStats();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-32 px-4 relative z-10">

        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span>The fastest way to build on Monad — Chain ID {MONAD_NETWORK.chainId}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-white leading-tight">
            Build unhinged dApps <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">at the speed of thought.</span>
          </h1>

          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            No limits. No corporate guardrails. Just a hyper-optimized drag-and-drop workspace
            designed for the Monad ecosystem. Drag. Drop. Deploy.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard" className="inline-flex items-center justify-center h-14 px-8 rounded-md text-base font-bold bg-primary text-primary-foreground shadow-[0_0_20px_rgba(131,110,249,0.5)] hover:shadow-[0_0_40px_rgba(131,110,249,0.8)] hover:bg-primary/90 transition-all gap-2">
              Start Building <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/templates" className="inline-flex items-center justify-center h-14 px-8 rounded-md text-base font-bold border border-white/20 text-white hover:bg-white/5 transition-all">
              Browse Templates
            </Link>
          </div>
        </motion.div>

        {/* Monad Network Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-16 grid grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          {[
            { icon: Cpu, label: "Throughput", value: MONAD_NETWORK.tps + " TPS", color: "text-primary" },
            { icon: Clock, label: "Block Time", value: MONAD_NETWORK.blockTime, color: "text-secondary" },
            { icon: Shield, label: "Finality", value: MONAD_NETWORK.finality, color: "text-primary" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="text-center p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
              <div className={`text-2xl font-mono font-bold ${color} mb-1`}>{value}</div>
              <div className="text-xs text-white/40 uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Community Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border border-white/10 bg-black/40 backdrop-blur-xl p-8 rounded-2xl"
          >
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-white mb-2">{stats.totalProjects}</div>
              <div className="text-sm text-white/50 font-medium uppercase tracking-wider">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-primary mb-2">{stats.publishedProjects}</div>
              <div className="text-sm text-white/50 font-medium uppercase tracking-wider">Published</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-secondary mb-2">{stats.totalTemplates}</div>
              <div className="text-sm text-white/50 font-medium uppercase tracking-wider">Templates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-white mb-2">{stats.recentProjects.length}</div>
              <div className="text-sm text-white/50 font-medium uppercase tracking-wider">Active Builders</div>
            </div>
          </motion.div>
        )}

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <Layout className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Visual Canvas</h3>
            <p className="text-white/60">Drag and drop Web3 primitives onto a pixel-perfect canvas. No code required.</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <Blocks className="w-10 h-10 text-secondary mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Monad Primitives</h3>
            <p className="text-white/60">Built-in components for token swaps, NFT galleries, DAO votes, and wallet connections — all pre-wired for Monad Mainnet.</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <Rocket className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Instant Deploy</h3>
            <p className="text-white/60">Push to production in seconds. Live preview URLs automatically generated.</p>
          </div>
        </motion.div>

        {/* Network Info Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-32 max-w-4xl mx-auto w-full"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h2 className="text-lg font-mono font-bold text-white/80">{MONAD_NETWORK.name}</h2>
            <span className="text-xs text-white/30 font-mono ml-auto">{MONAD_NETWORK.version}</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden divide-y divide-white/5">
            {/* Chain info row */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
              {[
                { label: "Chain ID", value: String(MONAD_NETWORK.chainId) },
                { label: "Currency", value: MONAD_NETWORK.currency },
                { label: "Max Contract", value: MONAD_NETWORK.maxContractSize },
                { label: "EVM Compatible", value: "Fusaka fork" },
              ].map(({ label, value }) => (
                <div key={label} className="p-5">
                  <div className="text-xs text-white/30 uppercase tracking-widest mb-1">{label}</div>
                  <div className="font-mono font-bold text-white text-sm">{value}</div>
                </div>
              ))}
            </div>

            {/* RPC endpoints */}
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

            {/* Wrapped MON + Explorers */}
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
                <div className="flex gap-3">
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
