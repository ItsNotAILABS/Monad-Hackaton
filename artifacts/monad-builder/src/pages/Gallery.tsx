/**
 * Gallery — public showcase of all published MonadBuilder+ dApps.
 * Shows live previews via iframe embeds and links to the production domain.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ExternalLink, Zap, Globe, Copy, Check, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { useListProjects } from "@workspace/api-client-react";
import { useSetAIContext } from "@/lib/aiPageContext";

const PROD_DOMAIN = "https://monados.medinatechlabs.net";

function LivePreviewCard({ project, index }: { project: any; index: number }) {
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const liveUrl = `${PROD_DOMAIN}/preview/${project.id}`;
  const previewPath = `/preview/${project.id}`;

  const copy = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-primary/30 transition-colors group"
    >
      {/* Live iframe preview */}
      <div className="relative w-full aspect-[16/9] bg-black/60 border-b border-white/10 overflow-hidden">
        {!iframeError ? (
          <iframe
            src={previewPath}
            className="w-full h-full scale-[0.6] origin-top-left pointer-events-none"
            style={{ width: "166.67%", height: "166.67%" }}
            title={project.name}
            onError={() => setIframeError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/20">
              <Globe className="w-10 h-10 mx-auto mb-2" />
              <p className="text-xs font-mono">Preview unavailable</p>
            </div>
          </div>
        )}
        {/* Overlay with live indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-bold text-green-400">LIVE</span>
        </div>
        {!!project.contractAddress && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
            <span className="text-[10px] font-mono text-primary">ON-CHAIN</span>
          </div>
        )}
        {/* Click overlay to open */}
        <Link href={previewPath} className="absolute inset-0" />
      </div>

      {/* Card info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white truncate">{project.name}</h3>
            {project.description && (
              <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{project.description}</p>
            )}
          </div>
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 shrink-0">Published</Badge>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[10px] font-mono text-white/25 truncate flex-1">{liveUrl}</span>
          <button onClick={copy} className="shrink-0 text-white/25 hover:text-primary transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {project.contractAddress && (
          <div className="mb-3 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
            <div className="text-[10px] text-primary/50 mb-0.5">Contract</div>
            <div className="font-mono text-[11px] text-primary/80 truncate">{project.contractAddress as string}</div>
          </div>
        )}

        <div className="flex gap-2">
          <Link href={previewPath} className="flex-1">
            <Button size="sm" className="w-full gap-1.5 text-xs" variant="outline">
              <Zap className="w-3.5 h-3.5" /> Open Preview
            </Button>
          </Link>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="px-2.5 text-white/30 hover:text-primary">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
          <Link href={`/builder/${project.id}`}>
            <Button size="sm" variant="ghost" className="px-2.5 text-white/30 hover:text-white text-xs">
              Edit
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Gallery() {
  const { data: allProjects, isLoading } = useListProjects();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "onchain">("all");

  const published = (allProjects ?? []).filter(p => p.status === "published");
  const filtered = published
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description ?? "").toLowerCase().includes(search.toLowerCase()))
    .filter(p => filter === "all" || (filter === "onchain" && p.contractAddress));

  useSetAIContext(`Gallery page — ${published.length} published dApps. Production domain: ${PROD_DOMAIN}`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-7xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">
                Live dApps
              </h1>
              <p className="text-white/50 mt-2">
                Every app here is published, live, and deployed on{" "}
                <a href={PROD_DOMAIN} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/70">
                  monados.medinatechlabs.net
                </a>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-white/50 font-mono">{published.length} apps live</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search apps…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              {(["all", "onchain"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f ? "bg-primary text-white" : "bg-white/5 text-white/40 hover:text-white border border-white/10"}`}
                >
                  {f === "all" ? "All Apps" : "On-Chain"}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="aspect-video rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-white/10 rounded-2xl">
            <Globe className="w-14 h-14 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {published.length === 0 ? "No published apps yet" : "No results"}
            </h3>
            <p className="text-white/40 mb-6 text-sm">
              {published.length === 0
                ? "Build and publish a dApp — it'll appear here live."
                : "Try a different search."}
            </p>
            {published.length === 0 && (
              <Link href="/dashboard?build=1">
                <Button className="gap-2">
                  <Zap className="w-4 h-4" /> Build Your First dApp
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((project, i) => (
              <LivePreviewCard key={project.id} project={project} index={i} />
            ))}
          </div>
        )}

        {/* Production domain callout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 p-6 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <div className="text-xs text-primary/60 font-bold uppercase tracking-widest mb-1">Production URL</div>
            <div className="font-mono text-white text-sm">{PROD_DOMAIN}</div>
            <div className="text-xs text-white/30 mt-1">All published dApps are accessible at this domain</div>
          </div>
          <a href={PROD_DOMAIN} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 border-primary/30 text-primary">
              <ExternalLink className="w-4 h-4" /> Open Production
            </Button>
          </a>
        </motion.div>
      </main>
    </div>
  );
}
