import { useRoute, Link } from "wouter";
import { useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { Zap, ArrowLeft, ExternalLink } from "lucide-react";
import { LiveWidget } from "@/components/builder/LiveWidget";

export default function Preview() {
  const [, params] = useRoute("/preview/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const { data: project, isLoading } = useGetProject(id, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) }
  });

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

      {/* Preview badge — top right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
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

        <footer className="mt-16 py-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <Zap className="w-3.5 h-3.5 text-primary/50" />
            <span>Built with <span className="text-white/50 font-medium">MonadBuilder+</span></span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/25">
            <a href="https://monadvision.com" target="_blank" rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors flex items-center gap-1">
              MonadVision <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://monadscan.com" target="_blank" rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors flex items-center gap-1">
              Monadscan <ExternalLink className="w-3 h-3" />
            </a>
            <span className="font-mono">Chain 143</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
