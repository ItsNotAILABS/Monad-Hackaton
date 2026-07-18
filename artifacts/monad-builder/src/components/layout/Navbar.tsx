import { Link, useLocation } from "wouter";
import { Zap, Terminal, Layers } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Zap className="w-5 h-5 fill-primary" />
          <span className="font-bold text-base tracking-tight">MonadBuilder</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/templates"
            className={`text-sm font-medium transition-colors ${location === "/templates" ? "text-white" : "text-white/55 hover:text-white"}`}
          >
            Templates
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${location === "/dashboard" ? "text-white" : "text-white/55 hover:text-white"}`}
          >
            Dashboard
          </Link>
          <Link
            href="/workspace"
            className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${location === "/workspace" ? "text-white" : "text-white/55 hover:text-white"}`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Workspace
          </Link>
          <Link
            href="/platform"
            className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${location === "/platform" ? "text-white" : "text-white/55 hover:text-white"}`}
          >
            <Layers className="w-3.5 h-3.5" />
            Platform
          </Link>
          <Link
            href="/dashboard"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold shadow-[0_0_15px_rgba(131,110,249,0.4)] hover:shadow-[0_0_25px_rgba(131,110,249,0.65)] hover:bg-primary/90 transition-all"
          >
            Start Building
          </Link>
        </div>
      </div>
    </nav>
  );
}
