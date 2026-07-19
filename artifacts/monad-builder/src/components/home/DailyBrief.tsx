/**
 * DailyBrief — AI-powered morning brief from THESIS OS engine.
 * Falls back to curated static tips when engine is offline.
 */
import { useState, useEffect, useCallback } from "react";
import { enginePost } from "@/lib/engine";
import { Zap, RefreshCw, Loader2, BookOpen, TrendingUp, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Brief {
  summary?: string;
  focus?: string;
  gas_tip?: string;
  law_watch?: string;
  market_note?: string;
  agent_note?: string;
  timestamp?: string;
  // fallback flat string fields
  [key: string]: unknown;
}

const STATIC_BRIEFS: Brief[] = [
  {
    focus: "Monad runs 10,000 TPS at 400ms block time — build for speed, not just correctness.",
    gas_tip: "On Monad you pay gas_limit × price, not gas_used. Always set a tight limit.",
    law_watch: "Agents that propose without owner sign-off are rejected by design — REJECT is a feature.",
    market_note: "Chain ID 10143 · Monad Testnet · WMON: 0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
    agent_note: "Connect THESIS OS engine to unlock live briefs, risk scoring, and agent proposals.",
  },
  {
    focus: "Every published dApp on MonadBuilder+ inherits Monad's finality — 800ms. Use it.",
    gas_tip: "Native transfers cost exactly 21,000 gas on Monad. Hardcode it for ETH sends.",
    law_watch: "Dual law stacks: ecosystem laws (immutable) + your LawBook (owner-tunable).",
    market_note: "Four public RPCs available — primary: testnet-testnet-rpc.monad.xyz · Chain 10143.",
    agent_note: "Run ▶ WIN PATH on the Platform page to see THESIS OS in action.",
  },
  {
    focus: "Ship the dApp UI first with the Builder. Govern what it does with THESIS OS.",
    gas_tip: "Add ~7.5% margin to every gas estimate — the THESIS gas engine does this automatically.",
    law_watch: "SovereignVault executes only what PolicyKernel clears. Onchain law enforcement.",
    market_note: "Monad Explorer + Monad Explorer both index Chain 10143 — link from your Preview footer.",
    agent_note: "Upload a .zip of your project files to Workspace and run them with real Monad RPC.",
  },
];

function pickStaticBrief(): Brief {
  const day = Math.floor(Date.now() / 86_400_000);
  return STATIC_BRIEFS[day % STATIC_BRIEFS.length];
}

export function DailyBrief() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastFetch, setLastFetch] = useState<string>("");

  const load = useCallback(async (force = false) => {
    // Cache in sessionStorage — one live fetch per session unless forced
    const cacheKey = "mb_brief_" + new Date().toDateString();
    if (!force) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try { setBrief(JSON.parse(cached)); setIsLive(true); return; } catch {}
      }
    }

    setLoading(true);
    const r = await enginePost<Brief>("/company/morning-brief", {});
    setLoading(false);

    // Only treat as live if engine explicitly returned ok:true with real fields
    const hasRealData = !r.offline && (r as any).ok !== false &&
      typeof r === "object" && Object.keys(r).filter(k => k !== "ok").length >= 1 &&
      Object.values(r as any).some(v => typeof v === "string" && v.length > 5);
    if (hasRealData) {
      setBrief(r as Brief);
      setIsLive(true);
      setLastFetch(new Date().toLocaleTimeString());
      sessionStorage.setItem(cacheKey, JSON.stringify(r));
    } else {
      setBrief(pickStaticBrief());
      setIsLive(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const b = brief ?? pickStaticBrief();

  const rows = [
    { icon: TrendingUp, label: "Today's Focus",  value: b.focus  ?? b.summary ?? b.objective },
    { icon: Zap,        label: "Gas Tip",         value: b.gas_tip ?? b.doctrine },
    { icon: Shield,     label: "Law Watch",       value: b.law_watch ?? b.risk ?? b.warning },
    { icon: BookOpen,   label: "Market Note",     value: b.market_note ?? b.market ?? b.chain },
  ].filter(r => r.value);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary/70" />
          <span className="text-sm font-semibold text-white/80">Daily Brief</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono border ${
            isLive
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-white/5 text-white/25 border-white/10"
          }`}>
            {isLive ? `LIVE${lastFetch ? " · " + lastFetch : ""}` : "THESIS OS offline · static brief"}
          </span>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="text-white/20 hover:text-white/60 transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Brief rows */}
      <div className="divide-y divide-white/[0.04]">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex gap-3 px-5 py-3.5">
            <Icon className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">{label}</div>
              <div className="text-sm text-white/70 leading-relaxed">{String(value)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent note */}
      {(b.agent_note || !isLive) && (
        <div className="px-5 py-3 border-t border-white/5 flex items-start gap-2 bg-primary/[0.03]">
          <AlertCircle className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-0.5" />
          <p className="text-xs text-white/35 leading-relaxed">
            {b.agent_note
              ? String(b.agent_note)
              : "Start the THESIS OS engine to get live briefs, agent proposals, and risk scoring."}
          </p>
        </div>
      )}
    </div>
  );
}
