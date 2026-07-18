import { useState, useRef, KeyboardEvent } from "react";
import { Sparkles, RotateCcw, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ComponentData } from "@workspace/api-client-react";
import { refineDapp, RateLimitError } from "@/lib/ai";

interface AIRefinePanelProps {
  projectName: string;
  currentComponents: ComponentData[];
  onRefined: (newComponents: ComponentData[]) => void;
}

type Status = "idle" | "loading" | "success" | "error";

export function AIRefinePanel({ projectName, currentComponents, onRefined }: AIRefinePanelProps) {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleRefine() {
    const trimmed = prompt.trim();
    if (!trimmed || status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const result = await refineDapp(
        projectName,
        currentComponents.map((c) => ({ type: c.type, props: c.props })),
        trimmed
      );

      if (!result || result.length === 0) {
        setStatus("error");
        setErrorMsg("AI returned an empty layout. Try rephrasing your instruction.");
        return;
      }

      onRefined(result as ComponentData[]);
      setStatus("success");
      setPrompt("");

      // Reset to idle after a moment
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      if (err instanceof RateLimitError) {
        setErrorMsg(`Rate limit reached — please wait ${err.retryAfter}s.`);
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Refinement failed. Try again.");
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleRefine();
    }
  }

  const isLoading = status === "loading";
  const isEmpty = currentComponents.length === 0;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#07070C]">
      {/* Header — always visible */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <span className="text-xs font-semibold text-white/80">Refine with AI</span>
        </div>
        {collapsed
          ? <ChevronDown className="w-3.5 h-3.5 text-white/30" />
          : <ChevronUp className="w-3.5 h-3.5 text-white/30" />
        }
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-white/5 pt-2.5">
          {isEmpty && (
            <p className="text-[10px] text-white/30 leading-relaxed">
              Add some components first, then describe how to change the layout.
            </p>
          )}

          {!isEmpty && (
            <p className="text-[10px] text-white/40 leading-relaxed">
              Describe a change — AI will rebuild the canvas around your current {currentComponents.length} component{currentComponents.length !== 1 ? "s" : ""}.
            </p>
          )}

          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); if (status !== "idle") setStatus("idle"); }}
            onKeyDown={handleKeyDown}
            placeholder={
              isEmpty
                ? 'e.g. "a DeFi swap with DAO governance"'
                : 'e.g. "add a governance section"\n"make it more DeFi focused"\n"remove the NFT gallery, add gas tracker"'
            }
            rows={3}
            disabled={isLoading}
            className="text-xs resize-none bg-black/40 border-white/10 placeholder:text-white/20 focus-visible:border-primary/50 leading-relaxed"
          />

          {/* Status feedback */}
          {status === "error" && (
            <div className="flex items-start gap-1.5 text-[10px] text-red-400">
              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center gap-1.5 text-[10px] text-green-400">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Canvas updated!</span>
            </div>
          )}

          <Button
            size="sm"
            onClick={handleRefine}
            disabled={!prompt.trim() || isLoading}
            className="w-full h-8 gap-1.5 text-xs font-semibold"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-3 h-3 animate-spin" />
                Refining…
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Refine Canvas
              </>
            )}
          </Button>
          <p className="text-[9px] text-white/20 text-center">⌘↩ to submit</p>
        </div>
      )}
    </div>
  );
}
