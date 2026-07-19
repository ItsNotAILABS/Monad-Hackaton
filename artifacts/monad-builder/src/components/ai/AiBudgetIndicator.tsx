/**
 * AiBudgetIndicator — shows today's global AI call usage in the Navbar.
 * Polls GET /api/ai/budget every 60 s. Colour-codes by usage:
 *   green  < 60 %   (plenty of headroom)
 *   amber  60–85 %  (getting busy)
 *   red    > 85 %   (almost exhausted)
 */
import { useState, useEffect } from "react";
import { Cpu } from "lucide-react";

interface BudgetData {
  callCount: number;
  limit: number;
  secondsUntilReset: number;
}

export function AiBudgetIndicator() {
  const [budget, setBudget] = useState<BudgetData | null>(null);

  useEffect(() => {
    let dead = false;

    async function poll() {
      try {
        const res = await fetch("/api/ai/budget");
        if (!res.ok || dead) return;
        const data: BudgetData = await res.json();
        setBudget(data);
      } catch {}
    }

    poll();
    const id = setInterval(poll, 60_000);
    return () => {
      dead = true;
      clearInterval(id);
    };
  }, []);

  if (!budget) return null;

  const pct = budget.callCount / budget.limit;
  const colorClass =
    pct > 0.85
      ? "text-red-400"
      : pct > 0.6
        ? "text-amber-400"
        : "text-emerald-400";

  const hoursLeft = Math.floor(budget.secondsUntilReset / 3600);
  const minsLeft = Math.floor((budget.secondsUntilReset % 3600) / 60);
  const resetLabel =
    hoursLeft > 0 ? `resets in ${hoursLeft}h ${minsLeft}m` : `resets in ${minsLeft}m`;

  return (
    <span
      className={`hidden md:flex items-center gap-1.5 text-xs font-mono ${colorClass}`}
      title={`Global AI budget: ${budget.callCount} of ${budget.limit} calls used today (UTC). ${resetLabel}.`}
    >
      <Cpu className="w-3 h-3" />
      {budget.callCount} / {budget.limit}
    </span>
  );
}
