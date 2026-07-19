import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { GraduationCap, Trophy, Key, Zap, CheckCircle, ArrowRight, ExternalLink, RefreshCw, Bot, Star, ChevronRight, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { useSetAIContext } from "@/lib/aiPageContext";

// ── Learn & Earn modules ────────────────────────────────────────────────────

const MODULES = [
  {
    id: "monad-101",
    title: "What is Monad?",
    description: "The fastest EVM chain: 10,000 TPS, 400ms blocks, full Ethereum compatibility.",
    reward: "0.1 MON",
    difficulty: "Beginner",
    duration: "3 min",
    color: "violet",
    quiz: {
      question: "What is Monad's block time?",
      options: ["1 second", "400ms", "12 seconds", "5 seconds"],
      correct: 1,
    },
    content: [
      "Monad is an Ethereum-compatible (EVM) Layer 1 blockchain that achieves 10,000 transactions per second.",
      "It uses parallel execution and MonadBFT consensus to achieve 400ms block times and sub-second finality.",
      "Any Ethereum dApp can deploy on Monad without changing a single line of code — same Solidity, same tools.",
      "Monad Testnet uses MON as the native gas token. Chain ID: 10143.",
    ],
  },
  {
    id: "defi-basics",
    title: "DeFi on Monad",
    description: "Learn swaps, liquidity pools, and yield — then earn testnet MON for completing the quiz.",
    reward: "0.15 MON",
    difficulty: "Beginner",
    duration: "5 min",
    color: "blue",
    quiz: {
      question: "What does a liquidity pool enable?",
      options: ["Mining blocks", "Token swaps without a centralized exchange", "NFT minting", "Wallet generation"],
      correct: 1,
    },
    content: [
      "DeFi (Decentralized Finance) recreates financial services — trading, lending, borrowing — using smart contracts.",
      "A liquidity pool lets anyone trade tokens permissionlessly. You can also provide liquidity and earn fees.",
      "Monad's speed (10,000 TPS) makes DeFi feel instant — no more waiting 12 seconds per Ethereum block.",
      "Merkl (app.merkl.xyz) distributes DeFi rewards on Monad — you can see live yield opportunities in your dApp.",
    ],
  },
  {
    id: "smart-contracts",
    title: "Smart Contracts for Everyone",
    description: "No code needed. Understand what contracts do and deploy one with MonadBuilder+.",
    reward: "0.2 MON",
    difficulty: "Intermediate",
    duration: "7 min",
    color: "green",
    quiz: {
      question: "What makes a smart contract 'smart'?",
      options: [
        "It uses AI",
        "It runs automatically when conditions are met, with no middleman",
        "It's written in Python",
        "It costs less gas",
      ],
      correct: 1,
    },
    content: [
      "A smart contract is code that lives on the blockchain and runs automatically — no bank, no middleman, no trust required.",
      "When you deploy a dApp with MonadBuilder+, we write and deploy a Solidity contract to Monad Testnet for you.",
      "Your contract gets a permanent address on-chain. Anyone can verify what it does by looking at the code.",
      "MonadBuilder+ handles the complexity — you just describe what you want to build.",
    ],
  },
  {
    id: "dao-governance",
    title: "DAO & THESIS Governance",
    description: "How communities govern themselves on-chain using proposals, votes, and law receipts.",
    reward: "0.25 MON",
    difficulty: "Intermediate",
    duration: "6 min",
    color: "amber",
    quiz: {
      question: "What is a DAO?",
      options: [
        "A type of cryptocurrency",
        "A Decentralized Autonomous Organization governed by token holders",
        "A database",
        "A programming language",
      ],
      correct: 1,
    },
    content: [
      "A DAO (Decentralized Autonomous Organization) is a community governed by smart contracts instead of executives.",
      "Members vote on proposals using governance tokens. Code enforces the outcome — no humans needed to execute decisions.",
      "THESIS OS extends DAO governance with 'law receipts' — immutable records of every decision, enforceable on-chain.",
      "MonadBuilder+ lets you drag-and-drop a full DAO voting interface into your dApp — no Solidity experience required.",
    ],
  },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: "text-green-400 bg-green-500/10 border-green-500/20",
  Intermediate: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Advanced: "text-red-400 bg-red-500/10 border-red-500/20",
};

// ── Wallet Generation Panel ──────────────────────────────────────────────────

function WalletPanel() {
  const [wallet, setWallet] = useState<{ address: string; privateKey: string; mnemonic?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Learn & Earn Wallet", role: "learner" }),
      });
      const data = await res.json();
      setWallet({ address: data.address, privateKey: data.privateKey, mnemonic: data.mnemonic });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!wallet) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">New to crypto? Start here.</h3>
              <p className="text-sm text-white/50 mb-4">
                We generate a free Monad Testnet wallet for you — no MetaMask, no downloads, no seed phrases to memorize right now.
                Complete lessons to earn real testnet MON directly to this address.
              </p>
              <Button onClick={generate} disabled={loading} className="gap-2">
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</> : <><Key className="w-4 h-4" /> Generate My Wallet — It's Free</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-500/20 bg-green-500/5">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-bold text-green-400">Wallet Ready</span>
          <span className="text-xs text-white/30 font-mono ml-auto">Monad Testnet</span>
        </div>

        {/* Address */}
        <div>
          <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1 font-bold">Your Address (public — safe to share)</div>
          <div className="flex items-center gap-2 bg-black/40 border border-green-500/20 rounded-xl p-3">
            <span className="font-mono text-green-400 text-xs flex-1 break-all">{wallet.address}</span>
            <button onClick={() => copy(wallet.address)} className="shrink-0 text-white/30 hover:text-green-400">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Private key — shown once */}
        {!saved && (
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-amber-400/70 uppercase tracking-widest font-bold">Private Key — Save This Now</span>
              <X className="w-3 h-3 text-amber-400/50 ml-auto" />
            </div>
            <p className="text-xs text-white/40 mb-2">This is shown only once. Save it to a safe place — it's your password to this wallet.</p>
            <div className="flex items-center gap-2 bg-black/40 border border-amber-500/20 rounded-xl p-2">
              <span className="font-mono text-amber-400/70 text-[11px] flex-1 break-all blur-sm hover:blur-none transition-all">{wallet.privateKey}</span>
              <button onClick={() => copy(wallet.privateKey)} className="shrink-0 text-white/30 hover:text-amber-400">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={() => setSaved(true)} className="mt-2 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> I've saved my private key
            </button>
          </div>
        )}

        {/* Next steps */}
        <div className="grid grid-cols-2 gap-2">
          <a href="https://faucet.monad.xyz" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-primary/20 text-primary text-xs font-medium hover:bg-primary/10 transition-colors">
            <Zap className="w-3.5 h-3.5" /> Get Free MON
          </a>
          <a href={`https://testnet.monadexplorer.com/address/${wallet.address}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-white/10 text-white/50 text-xs hover:bg-white/5 transition-colors">
            <ExternalLink className="w-3 h-3" /> View on Explorer
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Module Card ──────────────────────────────────────────────────────────────

function ModuleCard({ module, index }: { module: typeof MODULES[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"read" | "quiz" | "done">("read");
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const colorMap: Record<string, string> = {
    violet: "border-violet-500/20 text-violet-400",
    blue: "border-blue-500/20 text-blue-400",
    green: "border-green-500/20 text-green-400",
    amber: "border-amber-500/20 text-amber-400",
  };
  const c = colorMap[module.color] || colorMap.violet;
  const isCorrect = selected === module.quiz.correct;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <Card className={`border overflow-hidden transition-all ${open ? c : "border-white/10"}`}>
        <button className="w-full text-left" onClick={() => setOpen(!open)}>
          <div className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${open ? c.replace("text-", "bg-").replace("400", "500/10") + " " + c : "border-white/10 bg-white/5"}`}>
              {step === "done" ? <CheckCircle className="w-5 h-5 text-green-400" /> : <GraduationCap className={`w-5 h-5 ${open ? c.split(" ")[1] : "text-white/40"}`} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white">{module.title}</div>
              <div className="text-xs text-white/40 mt-0.5 truncate">{module.description}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLOR[module.difficulty]}`}>{module.difficulty}</span>
                <span className="text-[10px] text-white/30">{module.duration}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-amber-400/60 font-mono">Earn</div>
              <div className="text-base font-bold text-amber-400 font-mono">{module.reward}</div>
              <ChevronRight className={`w-4 h-4 text-white/20 ml-auto mt-1 transition-transform ${open ? "rotate-90" : ""}`} />
            </div>
          </div>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/10"
            >
              <div className="p-5 space-y-4">
                {step === "read" && (
                  <>
                    <div className="space-y-3">
                      {module.content.map((para, i) => (
                        <p key={i} className="text-sm text-white/65 leading-relaxed flex gap-2">
                          <span className="text-primary/40 shrink-0 mt-0.5">▸</span>
                          {para}
                        </p>
                      ))}
                    </div>
                    <Button className="w-full gap-2" onClick={() => setStep("quiz")}>
                      I understand — Take the Quiz <ArrowRight className="w-4 h-4" />
                    </Button>
                  </>
                )}

                {step === "quiz" && (
                  <>
                    <p className="text-base font-bold text-white">{module.quiz.question}</p>
                    <div className="space-y-2">
                      {module.quiz.options.map((opt, i) => {
                        let cls = "border-white/10 bg-white/[0.02] text-white/70 hover:border-primary/30 hover:bg-primary/5";
                        if (submitted && i === module.quiz.correct) cls = "border-green-500/40 bg-green-500/10 text-green-400";
                        else if (submitted && selected === i && i !== module.quiz.correct) cls = "border-red-500/40 bg-red-500/10 text-red-400";
                        else if (!submitted && selected === i) cls = "border-primary/40 bg-primary/10 text-primary";
                        return (
                          <button key={i} disabled={submitted} onClick={() => setSelected(i)}
                            className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${cls}`}>
                            <span className="font-mono text-[10px] opacity-50 mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                          </button>
                        );
                      })}
                    </div>
                    {!submitted ? (
                      <Button className="w-full" disabled={selected === null} onClick={() => setSubmitted(true)}>
                        Submit Answer
                      </Button>
                    ) : isCorrect ? (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                          <Trophy className="w-4 h-4" /> Correct! You earned <strong>{module.reward}</strong>
                        </div>
                        <Button className="w-full gap-2" onClick={() => setStep("done")}>
                          <CheckCircle className="w-4 h-4" /> Claim Reward & Complete Module
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                          Not quite — the answer is: <strong>{module.quiz.options[module.quiz.correct]}</strong>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => { setSelected(null); setSubmitted(false); }}>
                          Try Again
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {step === "done" && (
                  <div className="text-center py-4 space-y-3">
                    <div className="text-5xl">🏆</div>
                    <div className="font-bold text-white">Module Complete!</div>
                    <div className="text-sm text-white/50">
                      <span className="text-amber-400 font-mono font-bold">{module.reward}</span> reward sent to your wallet
                    </div>
                    <Link href="/dashboard">
                      <Button variant="outline" className="gap-2 mt-2">
                        Build a dApp with this knowledge <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ── AI Agent Wallets Panel ───────────────────────────────────────────────────

function AgentWalletsPanel() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    try {
      const r = await fetch("/api/wallets?role=agent");
      const data = await r.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch { setAgents([]); }
    finally { setLoading(false); }
  };

  const seed = async () => {
    setSeeding(true);
    await fetch("/api/wallets/seed-agents", { method: "POST" }).catch(() => {});
    await load();
    setSeeding(false);
  };

  useState(() => { load(); });

  return (
    <Card className="border-violet-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-400" />
            <CardTitle className="text-base">AI Agent Wallets</CardTitle>
          </div>
          {agents.length === 0 && !loading && (
            <Button size="sm" variant="outline" onClick={seed} disabled={seeding} className="text-xs border-violet-500/30 text-violet-400">
              {seeding ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Seeding…</> : "Seed Agents"}
            </Button>
          )}
        </div>
        <p className="text-xs text-white/40">AI agents that hold real testnet MON and can transact autonomously on Monad.</p>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-white/30 text-xs gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading…
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">
            No agents yet. Click "Seed Agents" to create them.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {agents.map((a, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02]">
                <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{a.label}</div>
                  <div className="text-[10px] font-mono text-white/30 truncate">{a.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-primary">{a.balanceCache ?? "0.0"} MON</div>
                  <a href={`https://testnet.monadexplorer.com/address/${a.address}`} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-white/20 hover:text-primary flex items-center gap-0.5 justify-end">
                    Explorer <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Learn() {
  useSetAIContext("Current page: Learn & Earn — user is exploring Monad education modules and wallet generation. Help them understand Web3 concepts, how to use their generated wallet, and how to earn testnet MON.");

  const totalRewards = MODULES.reduce((sum, m) => sum + parseFloat(m.reward), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Star className="w-3.5 h-3.5" /> Learn & Earn
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Learn Web3.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">Earn Monad.</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            No crypto experience needed. Complete lessons, pass quizzes, earn testnet MON directly to your wallet.
            Then use MonadBuilder+ to ship what you learned.
          </p>
          <div className="mt-4 inline-flex items-center gap-6 text-sm text-white/30">
            <span><strong className="text-white">{MODULES.length}</strong> modules</span>
            <span><strong className="text-amber-400">{totalRewards.toFixed(2)} MON</strong> total rewards</span>
            <span><strong className="text-white">~21 min</strong> total</span>
          </div>
        </motion.div>

        {/* Wallet generation — first thing a non-crypto user does */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <WalletPanel />
        </motion.div>

        {/* Modules */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Modules</h2>
          <span className="text-xs text-white/30 font-mono">Complete in order for best results</span>
        </div>
        <div className="space-y-3 mb-12">
          {MODULES.map((mod, i) => <ModuleCard key={mod.id} module={mod} index={i} />)}
        </div>

        {/* AI Agent wallets */}
        <AgentWalletsPanel />

        {/* CTA — build what you learned */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-12 text-center">
          <div className="p-8 rounded-2xl border border-primary/20 bg-primary/5">
            <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Ready to build?</h3>
            <p className="text-white/50 text-sm mb-6">
              You've learned the concepts. Now deploy a real dApp on Monad Testnet in minutes — no code required.
            </p>
            <Link href="/">
              <Button className="gap-2 text-base px-8 shadow-[0_0_20px_rgba(131,110,249,0.4)]">
                Start Building <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
