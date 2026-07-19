/**
 * AiBudgetIndicator — shows today's global AI call usage in the Navbar.
 * Polls GET /api/ai/budget every 60 s. Colour-codes by usage:
 *   green  < 60 %          (plenty of headroom)
 *   amber  60 % – thresh   (getting busy)
 *   red    > thresh (80 %) (almost exhausted — also shows a dismissible banner)
 *
 * The warning threshold is served by the API (AI_BUDGET_WARN_THRESHOLD env var,
 * default 80 %). The warning banner fires at most once per page-load day to
 * avoid repeated noise; the server already logs a WARN once per UTC day.
 */
import { useState, useEffect, useRef } from "react";
import { Cpu, X, TriangleAlert } from "lucide-react";

interface BudgetData {
  callCount: number;
  limit: number;
  warnThreshold: number; // fraction 0–1, e.g. 0.8
  secondsUntilReset: number;
}

export function AiBudgetIndicator() {
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Track which UTC date the banner was last shown so it resets daily
  const warnedDateRef = useRef<string>("");

  useEffect(() => {
    let dead = false;

    async function poll() {
      try {
        const res = await fetch("/api/ai/budget");
        if (!res.ok || dead) return;
        const data: BudgetData = await res.json();
        // If the UTC day rolled over, un-dismiss the banner so it can fire again
        const today = new Date().toISOString().slice(0, 10);
        if (warnedDateRef.current && warnedDateRef.current !== today) {
          setBannerDismissed(false);
        }
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

  const threshold = budget.warnThreshold ?? 0.8;
  const pct = budget.callCount / budget.limit;

  const colorClass =
    pct > threshold
      ? "text-red-400"
      : pct > 0.6
        ? "text-amber-400"
        : "text-emerald-400";

  const hoursLeft = Math.floor(budget.secondsUntilReset / 3600);
  const minsLeft = Math.floor((budget.secondsUntilReset % 3600) / 60);
  const resetLabel =
    hoursLeft > 0 ? `resets in ${hoursLeft}h ${minsLeft}m` : `resets in ${minsLeft}m`;

  const showBanner = pct >= threshold && !bannerDismissed;
  const pctDisplay = Math.round(pct * 100);

  function dismiss() {
    // Record the date so the banner re-arms on the next UTC day
    warnedDateRef.current = new Date().toISOString().slice(0, 10);
    setBannerDismissed(true);
  }

  return (
    <>
      {/* Inline budget counter in the navbar */}
      <span
        className={`hidden md:flex items-center gap-1.5 text-xs font-mono ${colorClass}`}
        title={`Global AI budget: ${budget.callCount} of ${budget.limit} calls used today (UTC). ${resetLabel}.`}
      >
        <Cpu className="w-3 h-3" />
        {budget.callCount} / {budget.limit}
      </span>

      {/* Warning banner — only visible when usage ≥ threshold and not dismissed */}
      {showBanner && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-50 flex items-start gap-3 max-w-sm rounded-lg border border-amber-500/40 bg-gray-900/95 px-4 py-3 shadow-lg backdrop-blur"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="flex-1 text-xs text-gray-200 leading-relaxed">
            <p className="font-semibold text-amber-400 mb-0.5">AI budget warning</p>
            <p>
              {pctDisplay}% of today's AI budget used ({budget.callCount}/{budget.limit} calls).
              {" "}{resetLabel}.
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss budget warning"
            className="ml-1 shrink-0 rounded p-0.5 text-gray-500 hover:text-gray-200 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
