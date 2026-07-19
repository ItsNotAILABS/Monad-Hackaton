import { Link, useLocation } from "wouter";
import { Zap, Terminal, Layers, Sparkles } from "lucide-react";
import { LiveBlockTicker } from "@/components/ai/LiveBlockTicker";
import { AiBudgetIndicator } from "@/components/ai/AiBudgetIndicator";

export function Navbar() {
  const [location] = useLocation();

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
          {navLink("/learn", "Learn & Earn", <GraduationCap className="w-3.5 h-3.5" />)}

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
