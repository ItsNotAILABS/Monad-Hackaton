import { Link, useLocation } from "wouter";
import { Zap, Terminal, Layers, Sparkles, GraduationCap, Globe, Github, LogOut, ChevronDown } from "lucide-react";
import { LiveBlockTicker } from "@/components/ai/LiveBlockTicker";
import { AiBudgetIndicator } from "@/components/ai/AiBudgetIndicator";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLink = (href: string, label: string, icon?: React.ReactNode) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
        location === href ? "text-white" : "text-white/55 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <nav className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Zap className="w-5 h-5 fill-primary" />
          <span className="font-bold text-base tracking-tight">
            MonadBuilder<span className="text-primary">+</span>
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <LiveBlockTicker />
          <AiBudgetIndicator />

          {navLink("/templates", "Templates")}
          {navLink("/dashboard", "Dashboard")}
          {navLink("/workspace", "Workspace", <Terminal className="w-3.5 h-3.5" />)}
          {navLink("/platform", "Platform", <Layers className="w-3.5 h-3.5" />)}
          {navLink("/ai", "AI Studio", <Sparkles className="w-3.5 h-3.5" />)}
          {navLink("/gallery", "Gallery", <Globe className="w-3.5 h-3.5" />)}
          {navLink("/learn", "Learn & Earn", <GraduationCap className="w-3.5 h-3.5" />)}

          {/* GitHub Auth */}
          {!isLoading && (
            isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors text-sm"
                >
                  <img src={user.avatarUrl} alt={user.login} className="w-5 h-5 rounded-full" />
                  <span className="text-white/80 font-medium max-w-[80px] truncate">{user.login}</span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-black/90 border border-white/10 rounded-xl shadow-xl z-50 backdrop-blur-xl overflow-hidden">
                    <div className="px-3 py-2 border-b border-white/10">
                      <div className="text-xs text-white/40">Signed in as</div>
                      <div className="text-sm font-bold text-white truncate">{user.name || user.login}</div>
                    </div>
                    <button
                      onClick={async () => { setMenuOpen(false); await logout(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors text-sm text-white/70 hover:text-white"
              >
                <Github className="w-4 h-4" /> Sign in
              </button>
            )
          )}

          <Link
            href="/dashboard?build=1"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold shadow-[0_0_15px_rgba(131,110,249,0.4)] hover:shadow-[0_0_25px_rgba(131,110,249,0.65)] hover:bg-primary/90 transition-all"
          >
            Start Building
          </Link>
        </div>
      </div>
    </nav>
  );
}
