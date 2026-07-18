/**
 * AIAssistant — floating global chat widget.
 * Lives in App.tsx, persists across all pages.
 * Slides in from the right. Stateless per session (messages in React state).
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, RotateCcw, ChevronDown } from "lucide-react";
import { streamChat, type ChatMessage } from "@/lib/ai";

const STARTERS = [
  "How do I build a token swap on Monad?",
  "Explain THESIS OS laws in plain English",
  "What's the Monad gas model vs Ethereum?",
  "Which components for a DAO governance dApp?",
  "How does WMON work on Chain 143?",
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mr-2 mt-0.5">
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-primary text-white rounded-br-sm"
            : "bg-white/[0.06] text-white/85 rounded-bl-sm border border-white/[0.08]"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput("");
    setStreaming(true);

    // Placeholder for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamChat(
      updatedMsgs,
      (chunk) => setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant") last.content += chunk;
        return next;
      }),
      () => setStreaming(false)
    );
  }, [messages, streaming]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all ${
          open
            ? "bg-white/10 border border-white/20 text-white/60"
            : "bg-primary shadow-[0_0_20px_rgba(131,110,249,0.6)] text-white hover:shadow-[0_0_30px_rgba(131,110,249,0.9)]"
        }`}
        style={{ width: 52, height: 52 }}
      >
        {open ? <ChevronDown className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[72px] right-6 z-50 w-[380px] h-[520px] flex flex-col rounded-2xl border border-white/10 bg-[#0d0d14]/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/[0.07] shrink-0">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white leading-none">MonadBuilder<span className="text-primary">+</span> AI</div>
                <div className="text-[10px] text-white/30 mt-0.5">Monad · THESIS OS · dApp builder</div>
              </div>
              {messages.length > 0 && (
                <button onClick={() => setMessages([])} className="text-white/20 hover:text-white/50 transition-colors mr-1">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center">
                  <p className="text-xs text-white/25 text-center mb-5 uppercase tracking-widest">Ask anything</p>
                  <div className="space-y-2">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full text-left text-sm text-white/50 hover:text-white/80 px-3.5 py-2.5 rounded-xl border border-white/[0.07] hover:border-primary/30 hover:bg-primary/[0.05] transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                  {streaming && messages[messages.length - 1]?.content === "" && (
                    <div className="flex items-center gap-2 ml-8 mb-3">
                      <Loader2 className="w-3.5 h-3.5 text-primary/60 animate-spin" />
                      <span className="text-xs text-white/30">Thinking…</span>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-white/[0.07] shrink-0">
              <div className="flex items-end gap-2 bg-white/[0.04] rounded-xl border border-white/[0.08] px-3 py-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about Monad, THESIS, components…"
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 resize-none outline-none max-h-28 min-h-[20px]"
                  style={{ height: Math.min(Math.max(input.split("\n").length, 1) * 20, 112) }}
                  disabled={streaming}
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || streaming}
                  className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center disabled:opacity-30 hover:bg-primary/80 transition-colors shrink-0 mb-0.5"
                >
                  {streaming ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
              <p className="text-[10px] text-white/15 text-center mt-1.5">Enter to send · Shift+Enter for newline</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
