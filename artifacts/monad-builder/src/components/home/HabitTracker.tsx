/**
 * HabitTracker — daily operator habits for a MonadBuilder+ user.
 * Persists checked state in localStorage, resets daily at midnight.
 * Streak counted from consecutive days with all habits completed.
 */
import { useState, useEffect } from "react";
import { CheckCircle, Circle, Flame, Zap } from "lucide-react";

interface Habit {
  id: string;
  label: string;
  detail: string;
  link?: string;
}

const HABITS: Habit[] = [
  { id: "chain",   label: "Check chain status",       detail: "Monad Mainnet · Chain 143 · 10k TPS",          link: "/platform" },
  { id: "gas",     label: "Review gas prices",         detail: "Pay limit × price — not gas used",             link: "/platform" },
  { id: "brief",   label: "Read morning brief",        detail: "THESIS OS daily brief on the dashboard",       link: "/dashboard" },
  { id: "dapps",   label: "Review your published dApps", detail: "Preview and test your live projects",        link: "/dashboard" },
  { id: "govern",  label: "Check pending proposals",   detail: "Agents propose · laws decide · owner signs",   link: "/platform" },
];

function todayKey() {
  return "mb_habits_" + new Date().toISOString().slice(0, 10);
}

function loadChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(todayKey());
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveChecked(checked: Set<string>) {
  localStorage.setItem(todayKey(), JSON.stringify([...checked]));
}

function loadStreak(): number {
  try { return parseInt(localStorage.getItem("mb_streak") ?? "0", 10) || 0; }
  catch { return 0; }
}

function updateStreak(allDone: boolean): number {
  const lastKey = localStorage.getItem("mb_streak_date") ?? "";
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  let streak = loadStreak();

  if (allDone) {
    if (lastKey === today) {
      // Already counted today
    } else if (lastKey === yesterday) {
      streak += 1;
      localStorage.setItem("mb_streak", String(streak));
      localStorage.setItem("mb_streak_date", today);
    } else {
      // Streak broken
      streak = 1;
      localStorage.setItem("mb_streak", "1");
      localStorage.setItem("mb_streak_date", today);
    }
  }
  return streak;
}

export function HabitTracker() {
  const [checked, setChecked] = useState<Set<string>>(loadChecked);
  const [streak, setStreak] = useState(loadStreak);

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveChecked(next);
      const allDone = HABITS.every(h => next.has(h.id));
      setStreak(updateStreak(allDone));
      return next;
    });
  };

  const doneCount = checked.size;
  const total = HABITS.length;
  const allDone = doneCount === total;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary/70" />
          <span className="text-sm font-semibold text-white/80">Daily Operator Habits</span>
          <span className="text-xs text-white/30 font-mono">{doneCount}/{total}</span>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
            <Flame className="w-3.5 h-3.5" /> {streak}d
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <div
          className={`h-full transition-all duration-500 ${allDone ? "bg-emerald-400" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Habit list */}
      <div className="divide-y divide-white/[0.04]">
        {HABITS.map(habit => {
          const done = checked.has(habit.id);
          return (
            <button
              key={habit.id}
              onClick={() => toggle(habit.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                done ? "bg-emerald-500/[0.04]" : "hover:bg-white/[0.02]"
              }`}
            >
              {done
                ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                : <Circle className="w-4 h-4 text-white/20 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium transition-colors ${done ? "text-white/40 line-through" : "text-white/75"}`}>
                  {habit.label}
                </div>
                <div className="text-[11px] text-white/25">{habit.detail}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Completion message */}
      {allDone && (
        <div className="px-5 py-3 border-t border-emerald-500/20 bg-emerald-500/[0.05] text-center">
          <p className="text-xs text-emerald-400 font-medium">
            All done — you're running a tight operation. {streak > 1 ? `${streak}-day streak 🔥` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
