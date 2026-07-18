/**
 * AIComponentPrompt — in-Builder AI component generator.
 * Takes a natural language prompt, calls /api/ai/generate-component,
 * and calls onAdd with the resulting component config.
 */
import { useState, useCallback } from "react";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { generateComponent } from "@/lib/ai";

interface Props {
  existingTypes: string[];
  onAdd: (type: string, props: Record<string, any>) => void;
}

const QUICK_PROMPTS = [
  "Token swap widget",
  "Wallet connect button",
  "DAO voting card",
  "MON balance display",
  "Gas price tracker",
];

export function AIComponentPrompt({ existingTypes, onAdd }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ type: string; name: string; reasoning: string } | null>(null);
  const [error, setError] = useState("");

  const generate = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setError("");
    setLastResult(null);
    setLoading(true);
    const result = await generateComponent(t, existingTypes);
    setLoading(false);
    if (result) {
      setLastResult({ type: result.type, name: result.name, reasoning: result.reasoning });
      setPrompt("");
      onAdd(result.type, result.props ?? {});
    } else {
      setError("Couldn't generate a component — try rephrasing.");
    }
  }, [loading, existingTypes, onAdd]);

  return (
    <div className="border-t border-white/[0.07] pt-4 mt-2">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Wand2 className="w-3.5 h-3.5 text-primary/70" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">AI Add Component</span>
      </div>

      <div className="flex gap-2 mb-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate(prompt)}
          placeholder="Describe a component…"
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/70 placeholder-white/20 outline-none focus:border-primary/40 transition-colors"
          disabled={loading}
        />
        <button
          onClick={() => generate(prompt)}
          disabled={!prompt.trim() || loading}
          className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center disabled:opacity-30 hover:bg-primary/80 transition-colors shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
        </button>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => generate(p)}
            disabled={loading}
            className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded-md border border-white/[0.07] hover:border-primary/30 transition-all disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>

      {lastResult && (
        <div className="text-[10px] text-emerald-400/80 bg-emerald-500/[0.05] border border-emerald-500/20 rounded-lg px-2.5 py-2 leading-relaxed">
          <span className="font-semibold">Added {lastResult.name}</span> — {lastResult.reasoning}
        </div>
      )}
      {error && (
        <p className="text-[10px] text-red-400/70">{error}</p>
      )}
    </div>
  );
}
