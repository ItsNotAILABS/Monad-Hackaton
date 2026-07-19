import { useRoute, Link } from "wouter";
import { useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { Zap, ArrowLeft, ExternalLink, Sparkles, X, Loader2 } from "lucide-react";
import { LiveWidget } from "@/components/builder/LiveWidget";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { streamAuditDapp } from "@/lib/ai";
import { useSetAIContext } from "@/lib/aiPageContext";

/** Render markdown-like section headers in the audit output */
function AuditContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="text-sm font-bold text-primary mt-4 mb-1 first:mt-0">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h4 key={i} className="text-xs font-bold text-white/70 mt-3 mb-0.5">
              {line.slice(4)}
            </h4>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <p key={i} className="text-xs text-white/65 leading-relaxed pl-3">
              <span className="text-primary/60 mr-1">▸</span>{line.slice(2)}
            </p>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-xs text-white/65 leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export default function Preview() {
  const [, params] = useRoute("/preview/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: project, isLoading } = useGetProject(id, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) }
  });

  const [auditOpen, setAuditOpen] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditText, setAuditText] = useState("");

  // Context-aware AI
  const context = project
    ? `Current page: Preview — user is previewing "${project.name}" (${project.status}). Components: ${project.components.map(c => c.type).join(", ")}. Help them understand how the dApp looks, suggest improvements, or explain Monad deployment.`
    : "Current page: Preview — loading project.";
  useSetAIContext(context);

  const runAudit = useCallback(async () => {
    if (!project || auditing) return;
    setAuditText("");
    setAuditing(true);
    setAuditOpen(true);

    await streamAuditDapp(
      project.name,
      project.components.map(c => ({ type: c.type, props: c.props })),
      (chunk) => setAuditText((prev) => prev + chunk),
      () => setAuditing(false)
    );
  }, [project, auditing]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Zap className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Zap className="w-10 h-10 text-white/20" />
        <p className="text-white/60">Project not found.</p>
        <Link href="/dashboard" className="text-primary hover:underline text-sm">← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">

      {/* Preview toolbar — top left */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <Link
          href={`/builder/${id}`}
          className="h-9 w-9 bg-black/70 backdrop-blur border border-white/15 text-white rounded-full hover:bg-black/90 transition-colors flex items-center justify-center shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="bg-black/70 backdrop-blur border border-white/15 text-white/70 text-xs px-3 py-2 rounded-full font-mono shadow-lg hidden md:flex items-center gap-2">
          <span className="font-bold text-white truncate max-w-[160px]">{project.name}</span>
          <span className="text-white/30">·</span>
          <span className={project.status === "published" ? "text-green-400" : "text-amber-400"}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Preview badge + AI Audit button — top right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* AI Audit button */}
        <button
          onClick={runAudit}
          disabled={auditing || project.components.length === 0}
          className="bg-black/70 backdrop-blur border border-violet-500/40 text-violet-300 text-xs px-3 py-2 rounded-full font-medium shadow-[0_0_12px_rgba(139,92,246,0.2)] flex items-center gap-1.5 hover:bg-violet-500/10 hover:border-violet-500/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {auditing ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Auditing…</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> AI Audit</>
          )}
        </button>

        <div className="bg-black/70 backdrop-blur border border-primary/40 text-primary text-xs px-3 py-2 rounded-full font-mono font-bold shadow-[0_0_12px_rgba(131,110,249,0.25)] flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          LIVE PREVIEW
        </div>
      </div>

      {/* Rendered App */}
      <main className="container mx-auto px-4 pt-20 pb-16 max-w-4xl min-h-screen flex flex-col">
        {project.components.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Zap className="w-12 h-12 text-white/20 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">This app is empty</h2>
            <p className="text-white/50 mb-6">Go back to the builder to add components.</p>
            <Link href={`/builder/${id}`} className="text-primary hover:underline font-medium">
              Return to Builder →
            </Link>
          </div>
        ) : (
          <div className="flex-1 animate-in fade-in duration-500">
            {[...project.components]
              .sort((a, b) => a.order - b.order)
              .map((comp) => (
                <LiveWidget key={comp.id} component={comp} />
              ))}
          </div>
        )}

        {/* On-chain contract badge */}
        {(project as any).contractAddress && (
          <div className="mt-6 p-4 rounded-xl border border-green-500/20 bg-green-500/5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-green-400 uppercase tracking-widest">On-Chain · Monad Testnet</span>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 w-16 shrink-0">Contract</span>
                <a
                  href={`https://testnet.monadexplorer.com/address/${(project as any).contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-green-400/80 hover:text-green-400 transition-colors flex items-center gap-1 truncate"
                >
                  {(project as any).contractAddress}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
              {(project as any).deployTxHash && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 w-16 shrink-0">Tx Hash</span>
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${(project as any).deployTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 truncate"
                  >
                    {(project as any).deployTxHash}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="mt-8 py-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <Zap className="w-3.5 h-3.5 text-primary/50" />
            <span>Built with <span className="text-white/50 font-medium">MonadBuilder+</span></span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/25">
            <a href="https://testnet.monadexplorer.com" target="_blank" rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors flex items-center gap-1">
              Monad Explorer <ExternalLink className="w-3 h-3" />
            </a>
            <span className="font-mono">Chain 10143</span>
          </div>
        </footer>
      </main>

      {/* AI Audit slide-in panel */}
      <AnimatePresence>
        {auditOpen && (
          <motion.div
            key="audit-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] z-40 flex flex-col bg-[#0d0d14]/97 backdrop-blur-2xl border-l border-white/10 shadow-2xl"
          >
            {/* Panel header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07] shrink-0">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">AI dApp Audit</div>
                <div className="text-[10px] text-white/35 mt-0.5 truncate">
                  {project.name} · {project.components.length} components
                </div>
              </div>
              {auditing && (
                <div className="flex items-center gap-1.5 text-[10px] text-violet-400/70 font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" /> streaming
                </div>
              )}
              <button
                onClick={() => setAuditOpen(false)}
                className="text-white/20 hover:text-white/60 transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audit content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
              {auditText ? (
                <AuditContent text={auditText} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400/40" />
                  <p className="text-xs">Analyzing your dApp…</p>
                </div>
              )}
            </div>

            {/* Re-run button */}
            {!auditing && auditText && (
              <div className="px-5 py-4 border-t border-white/[0.07] shrink-0">
                <button
                  onClick={runAudit}
                  className="w-full py-2.5 rounded-lg border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Re-run Audit
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
