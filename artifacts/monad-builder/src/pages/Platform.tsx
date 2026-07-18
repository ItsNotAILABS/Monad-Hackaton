import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { engineApi, enginePost, engineHealth } from "@/lib/engine";
import {
  Zap, Play, Loader2, ExternalLink, RefreshCw, Terminal,
  Shield, Building2, BarChart3, ScrollText, FileCode2,
  CheckCircle, XCircle, AlertCircle, ChevronRight, Copy, CheckCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tool { id: string; name: string; kind: string; who: string; do?: string; proof?: string; description?: string; }
interface Engine { id: string; name: string; kind: string; description: string; }
interface Law { id: string; text?: string; pillar?: string; summary?: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const KIND_COLOR: Record<string, string> = {
  safety:      "bg-red-500/15 text-red-300 border-red-500/20",
  governance:  "bg-violet-500/15 text-violet-300 border-violet-500/20",
  monad:       "bg-primary/15 text-primary border-primary/20",
  company:     "bg-amber-500/15 text-amber-300 border-amber-500/20",
  product:     "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  demo:        "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  ai:          "bg-pink-500/15 text-pink-300 border-pink-500/20",
  report:      "bg-blue-500/15 text-blue-300 border-blue-500/20",
  terminal:    "bg-white/10 text-white/60 border-white/10",
  intelligence:"bg-orange-500/15 text-orange-300 border-orange-500/20",
  execution:   "bg-teal-500/15 text-teal-300 border-teal-500/20",
  novel_tech:  "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
};

function Badge({ kind }: { kind: string }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${KIND_COLOR[kind] ?? "bg-white/5 text-white/40 border-white/10"}`}>
      {kind.replace("_", " ")}
    </span>
  );
}

function OfflineBanner({ retry }: { retry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle className="w-10 h-10 text-amber-400/60 mb-4" />
      <p className="text-white/60 font-medium mb-1">THESIS Engine offline</p>
      <p className="text-white/30 text-sm mb-6 max-w-sm">
        The Python FastAPI engine isn't running yet. Once the other agent brings it up at{" "}
        <code className="text-primary/70">/engine</code>, everything here goes live.
      </p>
      <Button size="sm" variant="secondary" onClick={retry} className="gap-1.5">
        <RefreshCw className="w-3.5 h-3.5" /> Retry connection
      </Button>
    </div>
  );
}

function ResultBox({ data, onClear }: { data: unknown; onClear: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="mt-3 border border-white/10 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border-b border-white/5">
        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-amber-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
        <span className="text-[10px] font-mono text-white/25 flex-1">output</span>
        <button onClick={copy} className="text-white/25 hover:text-white/60 transition-colors">
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onClear} className="text-white/25 hover:text-white/60 ml-1 transition-colors text-xs">clear</button>
      </div>
      <pre className="p-3 text-xs font-mono text-green-300 whitespace-pre-wrap break-all overflow-auto max-h-64">{text}</pre>
    </div>
  );
}

// ─── Tab components ───────────────────────────────────────────────────────────

function ToolsTab({ offline }: { offline: boolean }) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [gasEst, setGasEst] = useState("80000");
  const [termCmd, setTermCmd] = useState("help");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await engineApi<{ tools: Tool[] }>("/tools");
    if (r.tools) setTools(r.tools);
    setLoading(false);
  }, []);

  useEffect(() => { if (!offline) load(); }, [offline, load]);

  const runTool = async (id: string, params: Record<string, any> = {}) => {
    setRunning(id);
    const r = await enginePost(`/tools/${id}/run`, params);
    setResults(prev => ({ ...prev, [id]: r }));
    setRunning(null);
  };

  if (offline) return <OfflineBanner retry={load} />;
  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  // Sort: demo tools first, then by kind
  const sorted = [...tools].sort((a, b) => {
    const order = ["demo","product","safety","governance","monad","company","ai","intelligence","execution","report","terminal","novel_tech"];
    return (order.indexOf(a.kind) - order.indexOf(b.kind)) || a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-3 max-w-3xl">
      <p className="text-sm text-white/40 pb-1">
        {tools.length} shippable tools — usable by you, the in-app agent, or any AI via MCP.
      </p>
      {sorted.map(tool => {
        const result = results[tool.id];
        const isRunning = running === tool.id;

        // Tools that need extra input
        const needsGas = tool.id === "gas_coach";
        const needsTermCmd = tool.id === "terminal";

        return (
          <div key={tool.id} className="border border-white/10 rounded-xl p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-white">{tool.name}</span>
                  <Badge kind={tool.kind} />
                </div>
                <p className="text-xs text-white/40 mb-1">{tool.do ?? tool.description ?? ""}</p>
                {tool.proof && <p className="text-[10px] font-mono text-emerald-400/60">proof: {tool.proof}</p>}
                <p className="text-[10px] text-white/25 mt-1">who: {tool.who}</p>
              </div>
              <div className="flex flex-col gap-2 items-end shrink-0">
                {needsGas && (
                  <Input
                    value={gasEst}
                    onChange={e => setGasEst(e.target.value)}
                    placeholder="estimated gas"
                    className="h-7 w-28 text-xs font-mono bg-black/50 border-white/10"
                  />
                )}
                {needsTermCmd && (
                  <Input
                    value={termCmd}
                    onChange={e => setTermCmd(e.target.value)}
                    placeholder="command"
                    className="h-7 w-28 text-xs font-mono bg-black/50 border-white/10"
                  />
                )}
                <Button
                  size="sm"
                  className="gap-1.5 h-8 text-xs shrink-0"
                  disabled={isRunning}
                  onClick={() => {
                    const params: Record<string, unknown> = {};
                    if (needsGas) params.estimated_gas = parseInt(gasEst) || 80000;
                    if (needsTermCmd) params.line = termCmd;
                    runTool(tool.id, params);
                  }}
                >
                  {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Run
                </Button>
              </div>
            </div>
            {result && <ResultBox data={result} onClear={() => setResults(p => { const n = {...p}; delete n[tool.id]; return n; })} />}
          </div>
        );
      })}
    </div>
  );
}

function CloudTab({ offline }: { offline: boolean }) {
  const [engines, setEngines] = useState<Engine[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [addr, setAddr] = useState("");
  const [gasEst, setGasEst] = useState("80000");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await engineApi<{ engines: Engine[] }>("/engines");
    if (r.engines) setEngines(r.engines);
    setLoading(false);
  }, []);

  useEffect(() => { if (!offline) load(); }, [offline, load]);

  const runEngine = async (id: string, params: Record<string, any> = {}) => {
    setRunning(id);
    const r = await enginePost(`/engines/${id}/run`, { network: "monad-testnet", ...params });
    setResults(prev => ({ ...prev, [id]: r }));
    setRunning(null);
  };

  if (offline) return <OfflineBanner retry={load} />;
  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3 max-w-3xl">
      <p className="text-sm text-white/40 pb-1">
        {engines.length} cloud engines — live Monad RPC calls, gas doctrine, research.
      </p>

      {/* Chain engine — featured */}
      <div className="border border-primary/20 rounded-xl p-4 bg-primary/[0.04]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-sm text-white mb-0.5">Chain Engine</div>
            <div className="text-xs text-white/40">Live Monad JSON-RPC: chain id, block, gas, balances</div>
          </div>
          <Button size="sm" className="gap-1.5 h-8 text-xs" disabled={running === "chain"} onClick={() => runEngine("chain", { op: "pulse" })}>
            {running === "chain" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Pulse
          </Button>
        </div>
        <div className="flex gap-2">
          <Input value={addr} onChange={e => setAddr(e.target.value)} placeholder="0x… address (balance check)" className="h-8 text-xs font-mono bg-black/50 border-white/10 flex-1" />
          <Button size="sm" variant="secondary" className="h-8 text-xs gap-1" disabled={running === "chain-bal" || !addr.startsWith("0x")} onClick={() => { setRunning("chain-bal"); enginePost("/engines/chain/run", { op: "balance", address: addr, network: "monad-testnet" }).then(r => { setResults(p => ({...p, chain: r})); setRunning(null); }); }}>
            {running === "chain-bal" ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Balance
          </Button>
        </div>
        {results.chain && <ResultBox data={results.chain} onClear={() => setResults(p => { const n={...p}; delete n.chain; return n; })} />}
      </div>

      {/* Gas engine */}
      <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-sm text-white mb-0.5">Gas Engine</div>
            <div className="text-xs text-white/40">Monad gas doctrine · pay limit not used · ~7.5% margin</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Input value={gasEst} onChange={e => setGasEst(e.target.value)} placeholder="estimated gas" className="h-8 text-xs font-mono bg-black/50 border-white/10 w-36" />
          <Button size="sm" className="gap-1.5 h-8 text-xs" disabled={running === "gas"} onClick={() => runEngine("gas", { estimated_gas: parseInt(gasEst) || 80000 })}>
            {running === "gas" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Coach
          </Button>
        </div>
        {results.gas && <ResultBox data={results.gas} onClear={() => setResults(p => { const n={...p}; delete n.gas; return n; })} />}
      </div>

      {/* Other engines */}
      {engines.filter(e => e.id !== "chain" && e.id !== "gas").map(eng => (
        <div key={eng.id} className="border border-white/10 rounded-xl p-4 bg-white/[0.02] flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm text-white mb-0.5">{eng.name}</div>
            <div className="text-xs text-white/40">{eng.description}</div>
            <Badge kind={eng.kind} />
          </div>
          <Button size="sm" variant="secondary" className="gap-1.5 h-8 text-xs" disabled={running === eng.id} onClick={() => runEngine(eng.id)}>
            {running === eng.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Run
          </Button>
          {results[eng.id] && <ResultBox data={results[eng.id]} onClear={() => setResults(p => { const n={...p}; delete n[eng.id]; return n; })} />}
        </div>
      ))}
    </div>
  );
}

function JudgeTab({ offline }: { offline: boolean }) {
  const [scorecard, setScorecard] = useState<any>(null);
  const [judge, setJudge] = useState<any>(null);
  const [winPath, setWinPath] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningWin, setRunningWin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [sc, jg] = await Promise.all([
      engineApi("/competition/scorecard"),
      engineApi("/judge"),
    ]);
    setScorecard(sc);
    setJudge(jg);
    setLoading(false);
  }, []);

  useEffect(() => { if (!offline) load(); }, [offline, load]);

  const runWin = async () => {
    setRunningWin(true);
    const r = await enginePost("/demo/win-path", {});
    setWinPath(r);
    setRunningWin(false);
  };

  if (offline) return <OfflineBanner retry={load} />;
  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const sc = scorecard as any;
  const rows: any[] = sc?.rows ?? sc?.scorecard ?? [];

  return (
    <div className="space-y-5 max-w-3xl">
      {/* WIN PATH */}
      <div className="border border-emerald-500/25 rounded-xl p-5 bg-emerald-500/[0.04]">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-bold text-white text-base">▶ WIN PATH</div>
            <div className="text-sm text-white/40">90-second judge demo · reject arena + scorecard</div>
          </div>
          <Button onClick={runWin} disabled={runningWin} className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
            {runningWin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {runningWin ? "Running…" : "Run WIN PATH"}
          </Button>
        </div>
        {winPath && <ResultBox data={winPath} onClear={() => setWinPath(null)} />}
      </div>

      {/* Scorecard */}
      {rows.length > 0 && (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="font-semibold text-sm text-white">Live Scorecard</div>
          </div>
          <div className="divide-y divide-white/5">
            {rows.map((row: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                {row.pass || row.status === "PASS" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span className="text-sm text-white/80 flex-1">{row.criterion ?? row.name ?? row.check}</span>
                <span className="text-xs font-mono text-white/30">{row.proof ?? row.value ?? ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Judge bundle */}
      {judge && (
        <div className="border border-white/10 rounded-xl p-4">
          <div className="font-semibold text-sm text-white mb-3">Judge Bundle</div>
          <ResultBox data={judge} onClear={() => setJudge(null)} />
        </div>
      )}
    </div>
  );
}

function HQTab({ offline }: { offline: boolean }) {
  const [hq, setHq] = useState<any>(null);
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningBrief, setRunningBrief] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await engineApi("/company/headquarters");
    setHq(r);
    setLoading(false);
  }, []);

  useEffect(() => { if (!offline) load(); }, [offline, load]);

  const runBrief = async () => {
    setRunningBrief(true);
    const r = await enginePost("/company/morning-brief", {});
    setBrief(r);
    setRunningBrief(false);
  };

  if (offline) return <OfflineBanner retry={load} />;
  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const data = hq as any;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="border border-amber-500/20 rounded-xl p-5 bg-amber-500/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-white text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" /> Company HQ
            </div>
            <div className="text-sm text-white/40">Agents propose. Laws decide. Owner signs.</div>
          </div>
          <Button onClick={runBrief} disabled={runningBrief} variant="secondary" className="gap-1.5">
            {runningBrief ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Morning Brief
          </Button>
        </div>
        {data && typeof data === "object" && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data as Record<string, unknown>)
              .filter(([, v]) => typeof v !== "object")
              .slice(0, 6)
              .map(([k, v]) => (
                <div key={k} className="bg-black/30 rounded-lg px-3 py-2">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">{k.replace(/_/g, " ")}</div>
                  <div className="text-sm font-mono text-white/80 truncate">{String(v)}</div>
                </div>
              ))}
          </div>
        )}
      </div>
      {brief && <ResultBox data={brief} onClear={() => setBrief(null)} />}
    </div>
  );
}

function DeskTab({ offline }: { offline: boolean }) {
  const [desk, setDesk] = useState<any>(null);
  const [arenaResult, setArenaResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningArena, setRunningArena] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await engineApi("/desk");
    setDesk(r);
    setLoading(false);
  }, []);

  useEffect(() => { if (!offline) load(); }, [offline, load]);

  const runArena = async () => {
    setRunningArena(true);
    const r = await enginePost("/desk/arena", {});
    setArenaResult(r);
    setRunningArena(false);
  };

  if (offline) return <OfflineBanner retry={load} />;
  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const d = desk as any;
  const tickets: any[] = d?.tickets ?? d?.desk?.tickets ?? [];

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="border border-red-500/20 rounded-xl p-5 bg-red-500/[0.03]">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-bold text-white text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" /> REJECT Arena
            </div>
            <div className="text-sm text-white/40">Agents propose. Laws decide. Owner signs. REJECT is a feature.</div>
          </div>
          <Button onClick={runArena} disabled={runningArena} className="gap-2 bg-red-700 hover:bg-red-600 text-white">
            {runningArena ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Arena
          </Button>
        </div>
        {arenaResult && <ResultBox data={arenaResult} onClear={() => setArenaResult(null)} />}
      </div>

      {tickets.length > 0 && (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] text-sm font-semibold text-white">
            Desk Tickets ({tickets.length})
          </div>
          <div className="divide-y divide-white/5">
            {tickets.slice(0, 8).map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.status === "rejected" ? "bg-red-500/20 text-red-300" : t.status === "accepted" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/50"}`}>
                  {t.status ?? "pending"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/80 truncate">{t.action ?? t.id ?? `Ticket ${i+1}`}</div>
                  {t.agent && <div className="text-xs text-white/30">agent: {t.agent}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {desk && <ResultBox data={desk} onClear={() => setDesk(null)} />}
    </div>
  );
}

function LawsTab({ offline }: { offline: boolean }) {
  const [laws, setLaws] = useState<Law[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await engineApi<{ laws: Law[] } | Law[]>("/laws");
    const arr = Array.isArray(r) ? r : (r as any).laws ?? [];
    setLaws(arr);
    setLoading(false);
  }, []);

  useEffect(() => { if (!offline) load(); }, [offline, load]);

  if (offline) return <OfflineBanner retry={load} />;
  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const filtered = laws.filter(l =>
    !filter || JSON.stringify(l).toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter laws…" className="h-8 text-sm bg-black/50 border-white/10" />
        <span className="text-sm text-white/30 shrink-0">{filtered.length} / {laws.length} laws</span>
      </div>
      <div className="space-y-2">
        {filtered.map((law, i) => (
          <div key={law.id ?? i} className="border border-white/8 rounded-lg px-4 py-3 bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
            <div className="flex items-start gap-3">
              <ScrollText className="w-3.5 h-3.5 text-violet-400/60 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {law.id && <div className="text-[10px] font-mono text-primary/60 mb-0.5">{law.id}</div>}
                <div className="text-sm text-white/75">{law.text ?? law.summary ?? JSON.stringify(law)}</div>
                {law.pillar && <div className="text-[10px] text-white/25 mt-1">pillar: {law.pillar}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContractsTab({ offline }: { offline: boolean }) {
  const [deployment, setDeployment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await engineApi("/deployment");
    setDeployment(r);
    setLoading(false);
  }, []);

  useEffect(() => { if (!offline) load(); }, [offline, load]);

  const KNOWN_CONTRACTS = [
    { name: "SovereignVault", role: "Spark submission address — execute under policy", file: "SovereignVault.sol" },
    { name: "PolicyKernel", role: "Onchain policy / law gate", file: "PolicyKernel.sol" },
    { name: "ReceiptChain", role: "Audit seal — receipts remember", file: "ReceiptChain.sol" },
    { name: "AgentRegistry", role: "Agent propose path", file: "AgentRegistry.sol" },
    { name: "ProposalBook", role: "Proposal storage", file: "ProposalBook.sol" },
    { name: "ExecutionRouter", role: "Route vault executions", file: "ExecutionRouter.sol" },
    { name: "LawBook", role: "Dual law stack registry", file: "LawBook.sol" },
    { name: "ThesisFactory", role: "Deploy new THESIS instances", file: "ThesisFactory.sol" },
  ];

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const d = deployment as any;
  const addresses: Record<string, string> = d?.contracts ?? d?.addresses ?? {};

  return (
    <div className="max-w-3xl space-y-4">
      {d?.primary_submission_address && (
        <div className="border border-primary/30 rounded-xl p-4 bg-primary/[0.04]">
          <div className="text-xs text-white/40 mb-1">Spark submission address</div>
          <div className="font-mono text-sm text-primary break-all">{d.primary_submission_address}</div>
          <div className="flex gap-2 mt-2">
            <a href={`https://monadvision.com/address/${d.primary_submission_address}`} target="_blank" rel="noopener noreferrer" className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">MonadVision <ExternalLink className="w-3 h-3" /></a>
            <a href={`https://monadscan.com/address/${d.primary_submission_address}`} target="_blank" rel="noopener noreferrer" className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">Monadscan <ExternalLink className="w-3 h-3" /></a>
          </div>
        </div>
      )}

      {offline && (
        <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
          <p className="text-sm text-white/40 mb-1">Engine offline — showing contract catalog from source</p>
        </div>
      )}

      <div className="border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] text-sm font-semibold text-white flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-white/40" /> Solidity Contracts
        </div>
        <div className="divide-y divide-white/5">
          {KNOWN_CONTRACTS.map(c => {
            const addr = addresses[c.name] ?? addresses[c.name.toLowerCase()];
            return (
              <div key={c.name} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-white">{c.name}</div>
                  <div className="text-xs text-white/35">{c.role}</div>
                  {addr && (
                    <div className="text-[11px] font-mono text-primary/70 mt-1 flex items-center gap-2">
                      {addr}
                      <a href={`https://monadvision.com/address/${addr}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 text-white/25 hover:text-white/60" />
                      </a>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-mono text-white/20">{c.file}</span>
              </div>
            );
          })}
        </div>
      </div>

      {d && <ResultBox data={d} onClear={() => setDeployment(null)} />}

      <div className="border border-white/8 rounded-xl p-4 text-sm text-white/40">
        <p className="mb-1 font-medium text-white/60">Deploy to Monad testnet</p>
        <code className="text-xs font-mono text-primary/60 block">./scripts/deploy.sh testnet</code>
        <p className="mt-2 text-xs">Contracts live in <code className="text-primary/50">contracts/src/</code> — Foundry project with full test suite.</p>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "tools",     label: "Tools",     icon: Zap },
  { id: "cloud",     label: "Cloud",     icon: BarChart3 },
  { id: "judge",     label: "Judge",     icon: CheckCircle },
  { id: "hq",        label: "HQ",        icon: Building2 },
  { id: "desk",      label: "Desk",      icon: Shield },
  { id: "laws",      label: "Laws",      icon: ScrollText },
  { id: "contracts", label: "Contracts", icon: FileCode2 },
] as const;

type TabId = typeof TABS[number]["id"];

export default function Platform() {
  const [tab, setTab] = useState<TabId>("tools");
  const [engineAlive, setEngineAlive] = useState<boolean | null>(null);
  const [engineVersion, setEngineVersion] = useState<string>("");
  const [checking, setChecking] = useState(true);

  const checkEngine = useCallback(async () => {
    setChecking(true);
    const { alive, version } = await engineHealth();
    setEngineAlive(alive);
    if (version) setEngineVersion(version);
    setChecking(false);
  }, []);

  useEffect(() => { checkEngine(); }, [checkEngine]);

  const offline = engineAlive === false;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="border-b border-white/10 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">THESIS Platform</h1>
            <p className="text-sm text-white/40 mt-0.5">
              Agents propose · Laws decide · Receipts remember · Owner signs
            </p>
          </div>

          {/* Engine status */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border ${
              checking           ? "border-white/10 text-white/30 bg-white/[0.02]" :
              engineAlive        ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/[0.06]" :
                                   "border-amber-500/30 text-amber-300 bg-amber-500/[0.06]"
            }`}>
              {checking ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : engineAlive ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400/60" />
              )}
              {checking ? "Connecting…" : engineAlive ? `Engine live${engineVersion ? ` · v${engineVersion}` : ""}` : "Engine offline"}
            </div>
            <button onClick={checkEngine} className="text-white/25 hover:text-white/60 transition-colors">
              <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                tab === id
                  ? "bg-primary/15 text-white border border-primary/25"
                  : "text-white/45 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto p-6">
        {tab === "tools"     && <ToolsTab     offline={offline} />}
        {tab === "cloud"     && <CloudTab     offline={offline} />}
        {tab === "judge"     && <JudgeTab     offline={offline} />}
        {tab === "hq"        && <HQTab        offline={offline} />}
        {tab === "desk"      && <DeskTab      offline={offline} />}
        {tab === "laws"      && <LawsTab      offline={offline} />}
        {tab === "contracts" && <ContractsTab offline={offline} />}
      </main>
    </div>
  );
}
