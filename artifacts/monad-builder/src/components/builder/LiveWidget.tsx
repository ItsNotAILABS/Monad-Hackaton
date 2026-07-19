import * as React from "react";
import { Wallet, Coins, Image as ImageIcon, List, RefreshCw, LineChart, Vote, ExternalLink, Gift, TrendingUp, Clock, Zap } from "lucide-react";
import { ComponentData } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Monad Testnet network configuration — source: docs.monad.xyz
const MONAD_CHAIN = {
  chainId: 10143,
  name: "Monad Testnet",
  currency: "MON",
  rpcUrl: "https://testnet-rpc.monad.xyz",
  explorerUrl: "https://testnet.monadexplorer.com",
  explorerName: "Monad Explorer",
  wrappedMON: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
};

// Fake transaction hashes that look realistic
const FAKE_TXS = [
  { hash: "0xa3f7...d291", type: "Swap", val: "+420 MON", status: "Success", time: "2 mins ago", block: 8_142_301 },
  { hash: "0x6b2e...f804", type: "Send", val: "-50 USDC", status: "Success", time: "1 hr ago", block: 8_141_905 },
  { hash: "0x9c1a...7e43", type: "Mint", val: "1 NFT", status: "Pending", time: "Just now", block: 8_142_450 },
];

export function LiveWidget({ component }: { component: ComponentData }) {
  const { type } = component;
  const props = component.props as Record<string, any>;

  switch (type) {
    case "wallet-connect":
      return (
        <div className="my-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-xs text-white/40 font-mono">Chain ID {MONAD_CHAIN.chainId}</div>
              <div className="text-xs text-white/60 font-mono">{MONAD_CHAIN.name}</div>
            </div>
          </div>
          <Button className="gap-2 rounded-full font-mono shadow-[0_0_15px_rgba(131,110,249,0.4)]">
            <Wallet className="w-4 h-4" /> {props.label || "Connect Wallet"}
          </Button>
        </div>
      );

    case "token-balance":
      return (
        <Card className="my-4 bg-gradient-to-br from-black/80 to-[#1a1a2e] border-primary/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-sm text-white/60 font-medium">{props.token || "MON"} Balance</div>
                <div className="text-xs font-mono text-white/30 mt-0.5">
                  {props.token === "MON" || !props.token
                    ? `WMON: ${MONAD_CHAIN.wrappedMON.slice(0, 8)}...${MONAD_CHAIN.wrappedMON.slice(-6)}`
                    : MONAD_CHAIN.name}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                1,337.42
              </div>
              <div className="text-sm text-primary font-mono">~$4,206.90</div>
            </div>
          </CardContent>
        </Card>
      );

    case "nft-gallery": {
      const cols = Number(props.columns) || 3;
      return (
        <div className="my-8">
          <h3 className="text-xl font-bold mb-4 font-mono">{props.title || "My Collection"}</h3>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${cols} gap-4`}>
            {[1, 2, 3, 4, 5, 6].slice(0, cols * 2).map((i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-black/40 group">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-white/20" />
                </div>
                <div className="p-4 border-t border-white/10 bg-black/60 relative z-10">
                  <div className="text-xs text-white/50 mb-1">Monad Punks</div>
                  <div className="font-bold font-mono flex items-center justify-between">
                    <span>#{String(i).padStart(4, "0")}</span>
                    <a
                      href={`${MONAD_CHAIN.explorerUrl}/token/${MONAD_CHAIN.wrappedMON}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/20 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "transaction-feed":
      return (
        <Card className="my-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <List className="w-5 h-5 text-primary" /> {props.title || "Recent Activity"}
            </CardTitle>
            <div className="text-xs text-white/30 font-mono">
              {MONAD_CHAIN.name} · {MONAD_CHAIN.rpcUrl}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {FAKE_TXS.map((tx, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-mono">
                      {tx.type[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{tx.type}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-white/40 font-mono">{tx.hash}</span>
                        <a
                          href={`${MONAD_CHAIN.explorerUrl}/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/20 hover:text-primary"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold">{tx.val}</div>
                    <div className={`text-xs ${tx.status === "Success" ? "text-green-400" : "text-amber-400"}`}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-white/20 font-mono">
                Block ~{(8_142_450).toLocaleString()} · 400ms avg
              </span>
              <a
                href={MONAD_CHAIN.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
              >
                {MONAD_CHAIN.explorerName} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      );

    case "token-swap":
      return (
        <Card className="my-8 max-w-md mx-auto border-primary/30 shadow-[0_0_30px_rgba(131,110,249,0.1)]">
          <CardHeader>
            <CardTitle className="text-center font-bold">Swap</CardTitle>
            <div className="text-xs text-center text-white/30 font-mono">
              {MONAD_CHAIN.name} · Chain {MONAD_CHAIN.chainId}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="bg-black/60 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-white/50 mb-2">You pay</div>
              <div className="flex items-center justify-between">
                <Input
                  type="number"
                  defaultValue="100"
                  className="text-2xl font-mono bg-transparent border-0 h-12 p-0 focus-visible:ring-0 w-1/2"
                />
                <Button variant="secondary" size="sm" className="rounded-full">
                  {props.fromToken || props.defaultFrom || "USDC"}
                </Button>
              </div>
            </div>

            <div className="flex justify-center -my-4 relative z-10">
              <Button variant="outline" size="icon" className="rounded-full bg-card border-white/20 h-10 w-10">
                <RefreshCw className="w-4 h-4 text-primary" />
              </Button>
            </div>

            <div className="bg-black/60 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-white/50 mb-2">You receive</div>
              <div className="flex items-center justify-between">
                <Input
                  type="number"
                  defaultValue="84.2"
                  readOnly
                  className="text-2xl font-mono bg-transparent border-0 h-12 p-0 focus-visible:ring-0 w-1/2"
                />
                <Button variant="secondary" size="sm" className="rounded-full">
                  {props.toToken || props.defaultTo || "MON"}
                </Button>
              </div>
            </div>

            <Button className="w-full h-14 text-lg font-bold mt-4 shadow-[0_0_15px_rgba(131,110,249,0.4)]">
              Confirm Swap
            </Button>
            <p className="text-xs text-center text-white/20 font-mono mt-2">
              WMON: {MONAD_CHAIN.wrappedMON.slice(0, 10)}...
            </p>
          </CardContent>
        </Card>
      );

    case "price-chart":
      return (
        <Card className="my-4 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-end">
              <div>
                <CardTitle className="text-white/60 text-sm font-normal">
                  {props.asset || props.token || "MON"} / USD · {MONAD_CHAIN.name}
                </CardTitle>
                <div className="text-3xl font-mono font-bold mt-1">$4.20</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-mono text-sm bg-green-500/10 px-2 py-1 rounded mb-1">+12.4%</div>
                <div className="text-xs text-white/30 font-mono">Chain {MONAD_CHAIN.chainId}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-32 relative">
            <svg
              viewBox="0 0 400 100"
              className="absolute bottom-0 w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(249, 91%, 70%)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="hsl(249, 91%, 70%)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,100 L0,50 Q40,40 80,60 T160,30 T240,50 T320,20 T400,10 L400,100 Z"
                fill="url(#chartGrad)"
              />
              <path
                d="M0,50 Q40,40 80,60 T160,30 T240,50 T320,20 T400,10"
                fill="none"
                stroke="hsl(249, 91%, 70%)"
                strokeWidth="2"
              />
            </svg>
          </CardContent>
        </Card>
      );

    case "dao-vote":
      return (
        <Card className="my-4">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>{props.title || "Proposal"}</CardTitle>
              <div className="bg-primary/20 text-primary text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">
                Active
              </div>
            </div>
            <div className="text-sm text-white/60">Should we increase the community pool allocation?</div>
            <div className="text-xs text-white/25 font-mono mt-1">{MONAD_CHAIN.name} · 10,000 TPS</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-bold">For</span>
                <span className="font-mono">74%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[74%]" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-white/60">Against</span>
                <span className="font-mono text-white/60">26%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-destructive w-[26%]" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 border-green-500/50 hover:bg-green-500/20 hover:text-green-400">
                Vote For
              </Button>
              <Button variant="outline" className="flex-1 border-destructive/50 hover:bg-destructive/20 hover:text-destructive">
                Vote Against
              </Button>
            </div>
          </CardContent>
        </Card>
      );

    case "merkl-rewards":
      return <MerklRewardsWidget props={props} />;

    // Standard Layout/Content
    case "hero-section":
      return (
        <div className="py-20 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
            {props.title || "Welcome"}
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            {props.subtitle || "To my dApp built on Monad."}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {MONAD_CHAIN.name} · Chain {MONAD_CHAIN.chainId} · {MONAD_CHAIN.rpcUrl}
          </div>
        </div>
      );

    case "heading": {
      const Tag = ((props.level as string) || "h2") as React.ElementType;
      return (
        <Tag className="text-3xl font-bold my-4 text-white">{props.text || "Heading"}</Tag>
      );
    }

    case "paragraph":
      return <p className="text-white/70 my-2 leading-relaxed">{props.text || "Text block"}</p>;

    case "button":
      return <Button className="my-2">{props.label || "Click Me"}</Button>;

    case "divider":
      return <hr className="my-8 border-white/10" />;

    case "image":
      return (
        <img
          src={props.url || "https://placehold.co/600x400/1D1D2B/836EF9?text=Image"}
          alt={props.alt || "img"}
          className="w-full rounded-xl my-4 border border-white/10"
        />
      );

    case "card":
      return (
        <Card className="my-4">
          <CardHeader>
            <CardTitle>{props.title || "Card"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/60">Card content goes here.</p>
          </CardContent>
        </Card>
      );

    case "stats-row": {
      // Real Monad network stats as defaults when no custom items configured
      const monadStats = [
        { label: "TPS", value: "10,000" },
        { label: "Block Time", value: "400ms" },
        { label: "Finality", value: "800ms" },
      ];
      const count = Number(props.items) || 3;
      return (
        <div className={`grid grid-cols-1 md:grid-cols-${count} gap-4 my-6`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <div className="text-white/50 text-sm mb-1">{monadStats[i]?.label || `Stat ${i + 1}`}</div>
              <div className="text-2xl font-mono font-bold">{monadStats[i]?.value || "—"}</div>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

// ─── Merkl Rewards Widget ────────────────────────────────────────────────────
// Fetches live incentive opportunities from Merkl API for the configured chain.
// Falls back to a "coming soon" preview when no opportunities exist yet.

interface MerklOpportunity {
  id: string;
  name: string;
  apr: number;
  dailyRewards: number;
  rewardToken: string;
  protocol: string;
  action: string;
  tvl?: number;
}

// Curated preview data shown when Monad testnet has no live Merkl campaigns yet
const PREVIEW_OPPORTUNITIES: MerklOpportunity[] = [
  { id: "1", name: "MON/USDC Liquidity",  apr: 48.2,  dailyRewards: 1200, rewardToken: "MON",  protocol: "MonadDEX",   action: "Provide liquidity" },
  { id: "2", name: "Hold MON",            apr: 12.5,  dailyRewards: 320,  rewardToken: "MON",  protocol: "Merkl",      action: "Hold token" },
  { id: "3", name: "MON Lending",         apr: 8.9,   dailyRewards: 180,  rewardToken: "USDC", protocol: "MonadLend",  action: "Lending/Borrowing" },
];

function MerklRewardsWidget({ props }: { props: Record<string, any> }) {
  const [opportunities, setOpportunities] = React.useState<MerklOpportunity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isLive, setIsLive] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const chainId = props.chainId || 10143;
    fetch(`/api/proxy/merkl?chainId=${chainId}&status=LIVE`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setOpportunities(data.slice(0, 4).map((o: any) => ({
            id: o.id || o.chainId,
            name: o.name || o.identifier || "Opportunity",
            apr: o.apr ?? 0,
            dailyRewards: o.dailyRewards ?? 0,
            rewardToken: o.rewardToken?.symbol || "TOKEN",
            protocol: o.protocol?.name || "Protocol",
            action: o.type || "Earn",
            tvl: o.tvl,
          })));
          setIsLive(true);
        } else {
          setOpportunities(PREVIEW_OPPORTUNITIES);
          setIsLive(false);
        }
      })
      .catch(() => {
        if (!cancelled) setOpportunities(PREVIEW_OPPORTUNITIES);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [props.chainId]);

  return (
    <Card className="my-4 border-amber-500/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Gift className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-base">{props.title || "Earn Rewards"}</CardTitle>
              <div className="text-xs text-white/30 font-mono flex items-center gap-1.5 mt-0.5">
                <span>Powered by</span>
                <a
                  href="https://app.merkl.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400/70 hover:text-amber-400 transition-colors flex items-center gap-0.5"
                >
                  Merkl <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span className="text-white/20">·</span>
                <span>{MONAD_CHAIN.name}</span>
              </div>
            </div>
          </div>
          {!isLive && !loading && (
            <span className="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest border border-amber-400/20 px-2 py-0.5 rounded-full">
              Preview
            </span>
          )}
          {isLive && (
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest border border-green-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-24 text-white/30 text-sm font-mono gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Fetching opportunities…
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {opportunities.map((opp) => (
              <div key={opp.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white truncate">{opp.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/30 font-mono">{opp.protocol}</span>
                    <span className="text-[10px] text-amber-400/50 bg-amber-400/10 px-1.5 py-0.5 rounded">{opp.action}</span>
                  </div>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 font-mono font-bold text-sm">{opp.apr.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <Zap className="w-2.5 h-2.5 text-amber-400/60" />
                    <span className="text-[11px] text-white/40 font-mono">${opp.dailyRewards.toLocaleString()}/day</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
          {!isLive && !loading && (
            <span className="text-[11px] text-white/25 font-mono">Monad campaigns launching soon</span>
          )}
          {isLive && (
            <span className="text-[11px] text-white/25 font-mono">{opportunities.length} live opportunities</span>
          )}
          <a
            href={props.merklUrl || "https://app.merkl.xyz"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400/60 hover:text-amber-400 transition-colors flex items-center gap-1 font-mono ml-auto"
          >
            View all on Merkl <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
