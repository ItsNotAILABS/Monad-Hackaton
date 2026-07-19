import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
  useGetProject,
  useUpdateProject,
  getGetProjectQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, Play, ChevronLeft, Layout, Webhook, FileText, Globe, Share2, Check, Copy, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { COMPONENT_PALETTE } from "@/components/builder/palette";
import { ComponentPreview } from "@/components/builder/ComponentPreview";
import { ComponentData, ComponentDataType } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { AIComponentPrompt } from "@/components/ai/AIComponentPrompt";
import { AIRefinePanel } from "@/components/ai/AIRefinePanel";
import { useSetAIContext } from "@/lib/aiPageContext";
import { deployToMonadTestnet } from "@/lib/monadDeploy";

// Props that are Monad network config — shown read-only in a separate section
const NETWORK_CONFIG_KEYS = new Set([
  "chainId", "rpcUrl", "networkName", "contractAddress",
  "explorerUrl", "interval",
]);

// Human-readable labels for prop keys
const PROP_LABELS: Record<string, string> = {
  label: "Button Label",
  title: "Title",
  subtitle: "Subtitle",
  text: "Content Text",
  token: "Token Symbol",
  columns: "Grid Columns",
  limit: "Max Items",
  fromToken: "From Token",
  toToken: "To Token",
  defaultFrom: "From Token",
  defaultTo: "To Token",
  asset: "Asset Symbol",
  level: "Heading Level (h1–h4)",
  url: "Image URL",
  alt: "Alt Text",
  variant: "Style Variant",
  items: "Number of Stats",
};

export default function Builder() {
  const [match, params] = useRoute("/builder/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();

  const queryClient = useQueryClient();
  const { data: project, isLoading } = useGetProject(id, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) }
  });

  const updateProject = useUpdateProject();

  const [components, setComponents] = useState<ComponentData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const initializedForId = useRef<number | null>(null);

  // Context-aware AI: pass current canvas state to the assistant
  const builderContext = project
    ? `Current page: Builder — editing project "${project.name}" (${project.status}). Components on canvas: ${components.length > 0 ? components.map(c => c.type).join(", ") : "none yet"}. Help the user add or improve dApp components, explain Monad network settings, or suggest what to build next.`
    : `Current page: Builder — loading project.`;
  useSetAIContext(builderContext);

  useEffect(() => {
    if (project && initializedForId.current !== project.id) {
      initializedForId.current = project.id;
      setComponents(project.components || []);
    }
  }, [project]);

  const handleAddComponent = (type: string, defaultProps: Record<string, any>) => {
    const newComp: ComponentData = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: type as ComponentDataType,
      props: { ...defaultProps },
      order: components.length
    };
    const updated = [...components, newComp];
    setComponents(updated);
    setSelectedId(newComp.id);
    saveChanges(updated);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= components.length) return;
    const updated = [...components];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    updated.forEach((c, i) => (c.order = i));
    setComponents(updated);
    saveChanges(updated);
  };

  const handleDelete = (idToDelete: string) => {
    const updated = components.filter(c => c.id !== idToDelete);
    updated.forEach((c, i) => (c.order = i));
    setComponents(updated);
    if (selectedId === idToDelete) setSelectedId(null);
    saveChanges(updated);
  };

  const handleUpdateProp = (key: string, value: string) => {
    if (!selectedId) return;
    // Coerce numbers back to number type
    const coerced = value !== "" && !isNaN(Number(value)) ? Number(value) : value;
    const updated = components.map(c =>
      c.id === selectedId ? { ...c, props: { ...c.props, [key]: coerced } } : c
    );
    setComponents(updated);
    saveChanges(updated);
  };

  const saveChanges = useCallback((comps: ComponentData[]) => {
    updateProject.mutate(
      { id, data: { components: comps } },
      {
        onSuccess: () => {
          queryClient.setQueryData(getGetProjectQueryKey(id), (old: any) =>
            old ? { ...old, components: comps } : old
          );
        }
      }
    );
  }, [id, updateProject, queryClient]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Link copied!", {
        description: "Share this link to let anyone open this canvas.",
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Could not copy link", {
        description: "Please copy the URL from your browser's address bar.",
      });
    });
  }, []);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ contractAddress: string; txHash: string; explorerUrl: string } | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const handlePublish = async () => {
    if (isDeploying) return;
    setIsDeploying(true);

    let contractAddress: string | undefined;
    let deployTxHash: string | undefined;

    // Try on-chain deployment via MetaMask/wallet
    const hasWallet = !!(window as any).ethereum;
    if (hasWallet) {
      const deployToast = toast.loading("⛓️ Deploying contract to Monad Testnet…", {
        description: "Check your wallet to confirm the transaction.",
        duration: 120_000,
      });
      try {
        const slug = project?.publishedSlug ?? `app-${id}-${Date.now()}`;
        const result = await deployToMonadTestnet(project?.name ?? "MonadDApp", slug);
        contractAddress = result.contractAddress;
        deployTxHash = result.txHash;
        toast.dismiss(deployToast);
        setDeployResult({ contractAddress: result.contractAddress, txHash: result.txHash, explorerUrl: result.explorerUrl });
      } catch (err: any) {
        toast.dismiss(deployToast);
        toast.warning("⚠️ Contract deploy skipped", {
          description: err?.message ?? "Wallet rejected or unavailable. Saving to DB only.",
          duration: 5000,
        });
      }
    } else {
      toast.info("💡 Install MetaMask to deploy on-chain", {
        description: "Saving your dApp without a contract address for now.",
        duration: 4000,
      });
    }

    // Always record in DB
    try {
      const res = await fetch(`/api/projects/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAddress, deployTxHash }),
      });
      if (!res.ok) throw new Error("DB publish failed");
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id) });
      const liveUrl = `${window.location.origin}/preview/${id}`;
      if (!contractAddress) {
        // No wallet — just show success toast and navigate
        toast.success("🚀 Live on Monad Testnet!", {
          description: liveUrl,
          duration: 8000,
          action: { label: "Open", onClick: () => setLocation(`/preview/${id}`) },
        });
        setTimeout(() => setLocation(`/preview/${id}`), 1800);
      }
      // If contract deployed, the modal is already showing — navigate happens on modal dismiss
    } catch {
      toast.error("Deploy failed", { description: "Could not save your dApp. Please try again." });
    } finally {
      setIsDeploying(false);
    }
  };

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

  const selectedComp = components.find(c => c.id === selectedId);

  // Split props into user-editable and network config
  const editableProps = selectedComp
    ? Object.entries(selectedComp.props).filter(([k, v]) =>
        !NETWORK_CONFIG_KEYS.has(k) && (typeof v === "string" || typeof v === "number")
      )
    : [];
  const networkProps = selectedComp
    ? Object.entries(selectedComp.props).filter(([k]) => NETWORK_CONFIG_KEYS.has(k))
    : [];

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">

      {/* ── Deploy Success Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {deployResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#0d0d14] border border-green-500/30 rounded-2xl p-8 shadow-[0_0_80px_rgba(34,197,94,0.15)]"
            >
              {/* Close */}
              <button onClick={() => { setDeployResult(null); setLocation(`/preview/${id}`); }}
                className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors">
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-1">On-Chain. Forever.</h2>
                <p className="text-white/50 text-sm">Your dApp is immortalized on Monad Testnet</p>
              </div>

              {/* Contract address */}
              <div className="mb-4">
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Contract Address</div>
                <div className="flex items-center gap-2 bg-black/60 border border-green-500/20 rounded-xl p-3">
                  <span className="font-mono text-green-400 text-sm flex-1 break-all">{deployResult.contractAddress}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(deployResult.contractAddress); setCopiedAddr(true); setTimeout(() => setCopiedAddr(false), 2000); }}
                    className="shrink-0 text-white/30 hover:text-green-400 transition-colors"
                  >
                    {copiedAddr ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Tx hash */}
              <div className="mb-6">
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Tx Hash</div>
                <div className="font-mono text-white/40 text-xs bg-black/40 border border-white/10 rounded-xl p-3 break-all">
                  {deployResult.txHash}
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-3">
                <a
                  href={deployResult.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-green-500/30 text-green-400 font-bold text-sm hover:bg-green-500/10 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> View on Explorer
                </a>
                <button
                  onClick={() => { setDeployResult(null); setLocation(`/preview/${id}`); }}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/80 transition-colors"
                >
                  See Live Preview →
                </button>
              </div>

              <p className="text-center text-[11px] text-white/20 mt-4 font-mono">
                Monad Testnet · Chain 10143
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topbar */}
      <header className="h-14 border-b border-white/10 bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-white/50 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <h1 className="font-bold text-sm truncate max-w-[200px]">{project.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            project.status === "published"
              ? "bg-green-500/20 text-green-400"
              : "bg-white/10 text-white/50"
          }`}>
            {project.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30 font-mono hidden md:block">
            {updateProject.isPending ? "saving..." : `${components.length} components`}
          </span>
          <Button variant="secondary" size="sm" className="gap-2" asChild>
            <Link href={`/preview/${id}`}><Play className="w-4 h-4" /> Preview</Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={handleShare}
            title="Copy shareable link to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copied!" : "Share"}
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={isDeploying} className="gap-2 bg-primary hover:bg-primary/90">
            <Globe className="w-4 h-4" />
            {isDeploying ? "Deploying…" : project.status === "published" ? "Redeploy" : "Deploy to Monad"}
          </Button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel: Component Library */}
        <div className="w-64 border-r border-white/10 bg-[#0A0A0F] overflow-y-auto shrink-0 flex flex-col">
          <div className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest border-b border-white/5">
            Component Library
          </div>

          <div className="p-2 space-y-6">
            {Object.entries(COMPONENT_PALETTE).map(([category, items]) => (
              <div key={category}>
                <div className="px-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  {category === "Web3" && <Webhook className="w-3 h-3" />}
                  {category === "Layout" && <Layout className="w-3 h-3" />}
                  {category === "Content" && <FileText className="w-3 h-3" />}
                  {category}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {items.map(item => (
                    <button
                      key={item.type}
                      onClick={() => handleAddComponent(item.type, item.props as Record<string, any>)}
                      className="p-2.5 border border-white/5 bg-white/[0.02] hover:bg-primary/10 hover:border-primary/30 rounded-lg flex flex-col items-center gap-2 transition-colors group"
                    >
                      <item.icon className="w-5 h-5 text-white/30 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] text-center text-white/50 group-hover:text-white/80 leading-tight transition-colors">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* AI component generator */}
          <div className="p-3 border-t border-white/5 space-y-3">
            <AIComponentPrompt
              existingTypes={components.map((c) => c.type)}
              onAdd={handleAddComponent}
            />
            <AIRefinePanel
              projectName={project?.name ?? "My Monad dApp"}
              currentComponents={components}
              onRefined={(newComps) => {
                setComponents(newComps);
                setSelectedId(null);
                saveChanges(newComps);
              }}
            />
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-[#060608] relative overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto min-h-[800px] border border-white/10 border-dashed rounded-xl bg-card p-6 shadow-2xl relative">
            {components.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                <Zap className="w-12 h-12 mb-4 opacity-40" />
                <p className="text-base font-medium">Canvas is empty</p>
                <p className="text-sm mt-1 opacity-60">Click any component on the left to add it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...components].sort((a, b) => a.order - b.order).map((comp, i) => (
                  <ComponentPreview
                    key={comp.id}
                    component={comp}
                    isSelected={selectedId === comp.id}
                    onSelect={() => setSelectedId(comp.id)}
                    onMoveUp={(e) => { e.stopPropagation(); handleMove(i, -1); }}
                    onMoveDown={(e) => { e.stopPropagation(); handleMove(i, 1); }}
                    onDelete={(e) => { e.stopPropagation(); handleDelete(comp.id); }}
                    isFirst={i === 0}
                    isLast={i === components.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Inspector */}
        <div className="w-72 border-l border-white/10 bg-[#0A0A0F] overflow-y-auto shrink-0 flex flex-col">
          <div className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest border-b border-white/5">
            Inspector
          </div>

          <div className="p-4">
            {!selectedComp ? (
              <div className="text-center text-white/30 text-sm mt-16 space-y-2">
                <Zap className="w-6 h-6 mx-auto opacity-30" />
                <p>Select a component<br />to edit its properties.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Component identity */}
                <div>
                  <div className="text-sm font-bold text-white capitalize">
                    {selectedComp.type.replace(/-/g, " ")}
                  </div>
                  <div className="text-[10px] text-white/30 font-mono mt-0.5">{selectedComp.id}</div>
                </div>

                {/* User-editable props */}
                {editableProps.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Properties</div>
                    {editableProps.map(([key, value]) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-medium text-white/60">
                          {PROP_LABELS[key] || key.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                        <Input
                          value={String(value)}
                          onChange={(e) => handleUpdateProp(key, e.target.value)}
                          className="h-8 text-xs font-mono bg-black/50 border-white/10 focus-visible:border-primary/50"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {editableProps.length === 0 && networkProps.length === 0 && (
                  <p className="text-xs text-white/30 italic">No configurable properties.</p>
                )}

                {/* Monad network config — read-only */}
                {networkProps.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-primary/50" />
                      <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Monad Network Config</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-lg divide-y divide-white/5 overflow-hidden">
                      {networkProps.map(([key, value]) => (
                        <div key={key} className="px-3 py-2">
                          <div className="text-[10px] text-white/30 mb-0.5 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </div>
                          <div className="text-[11px] font-mono text-primary/70 truncate" title={String(value)}>
                            {String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-white/20 leading-relaxed">
                      Network config is pre-set to Monad Testnet (Chain ID 10143) and cannot be changed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
