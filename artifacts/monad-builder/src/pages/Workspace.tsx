import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload, FolderOpen, File, Folder, ChevronRight, ChevronDown,
  Play, Trash2, RefreshCw, Terminal, Zap, ExternalLink,
  CheckCircle, XCircle, Loader2, X, Copy, CheckCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FileNode {
  name: string;
  type: "file" | "dir";
  path: string;
  size?: number;
  children?: FileNode[];
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut?: boolean;
}

interface TerminalLine {
  kind: "cmd" | "out" | "err" | "info";
  text: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API = "/api/workspace";

const FILE_ICONS: Record<string, string> = {
  py: "🐍", sol: "◆", json: "{ }", md: "📄", ts: "🔷", js: "🟨",
  txt: "📃", zip: "📦", env: "🔒", yaml: "⚙️", yml: "⚙️", toml: "⚙️",
};

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return FILE_ICONS[ext] ?? "📄";
}

function formatBytes(b?: number) {
  if (!b) return "";
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1024 / 1024).toFixed(1)}MB`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileTreeNode({
  node,
  depth,
  selected,
  onSelect,
  onDelete,
}: {
  node: FileNode;
  depth: number;
  selected: string | null;
  onSelect: (n: FileNode) => void;
  onDelete: (n: FileNode) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const indent = depth * 14;

  if (node.type === "dir") {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left hover:bg-white/5 transition-colors group text-sm"
          style={{ paddingLeft: `${12 + indent}px` }}
        >
          {open ? (
            <ChevronDown className="w-3 h-3 text-white/30 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-white/30 shrink-0" />
          )}
          <Folder className="w-3.5 h-3.5 text-primary/60 shrink-0" />
          <span className="text-white/70 truncate">{node.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node); }}
            className="ml-auto opacity-0 group-hover:opacity-100 text-white/30 hover:text-destructive transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        </button>
        {open && node.children?.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(node)}
      className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-left transition-colors group text-sm ${
        selected === node.path
          ? "bg-primary/15 text-white"
          : "hover:bg-white/5 text-white/60"
      }`}
      style={{ paddingLeft: `${26 + indent}px` }}
    >
      <span className="text-xs shrink-0">{fileIcon(node.name)}</span>
      <span className="truncate flex-1">{node.name}</span>
      {node.size && (
        <span className="text-[10px] text-white/25 font-mono shrink-0">{formatBytes(node.size)}</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(node); }}
        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-destructive transition-all ml-1"
      >
        <X className="w-3 h-3" />
      </button>
    </button>
  );
}

function TerminalOutput({ lines }: { lines: TerminalLine[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-[#060608] rounded-b-lg"
      style={{ minHeight: "200px", maxHeight: "400px" }}
    >
      {lines.length === 0 ? (
        <p className="text-white/20 text-xs">Run a script or Monad action to see output here.</p>
      ) : (
        lines.map((line, i) => (
          <div key={i} className={`leading-relaxed whitespace-pre-wrap break-all ${
            line.kind === "cmd"  ? "text-primary font-bold" :
            line.kind === "err"  ? "text-red-400" :
            line.kind === "info" ? "text-white/30 italic" :
            "text-green-300"
          }`}>
            {line.kind === "cmd" && <span className="text-white/40">$ </span>}
            {line.text}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main Workspace page ──────────────────────────────────────────────────────
export default function Workspace() {
  // Files
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Terminal / scripts
  const [termLines, setTermLines] = useState<TerminalLine[]>([
    { kind: "info", text: "Monad Workspace — Python runtime connected. Type a script or use Quick Actions." },
    { kind: "info", text: `RPC: https://testnet-rpc.monad.xyz  |  Chain ID: 10143  |  Monad Testnet` },
  ]);
  const [script, setScript] = useState(
`# Python script — runs against Monad Testnet
import urllib.request, json

rpc = "https://testnet-rpc.monad.xyz"
req = urllib.request.Request(rpc,
  data=json.dumps({"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}).encode(),
  headers={"Content-Type":"application/json"})
r = json.loads(urllib.request.urlopen(req).read())
print(f"Latest Monad block: {int(r['result'], 16):,}")
`);
  const [lang, setLang] = useState<"python3" | "node">("python3");
  const [running, setRunning] = useState(false);

  // Monad Quick Actions
  const [activeTab, setActiveTab] = useState<"terminal" | "monad" | "viewer">("terminal");
  const [monadAddr, setMonadAddr] = useState("");
  const [monadHash, setMonadHash] = useState("");
  const [monadRunning, setMonadRunning] = useState<string | null>(null);

  // Copy helper
  const [copied, setCopied] = useState(false);

  const copyOutput = () => {
    const text = termLines.map(l => l.text).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ── Fetch file tree ──────────────────────────────────────────────────────────
  const refreshFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch(`${API}/files`);
      const data = await res.json();
      setFiles(data.files ?? []);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => { refreshFiles(); }, [refreshFiles]);

  // ── Upload files ─────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (fileList: FileList | File[]) => {
    if (!fileList.length) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(fileList).forEach((f) => fd.append("files", f));

    try {
      const res = await fetch(`${API}/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        const names = data.uploaded.map((u: any) =>
          u.type === "zip" ? `📦 ${u.name} → extracted to /${u.extractedTo}/` : `📄 ${u.name}`
        );
        appendLines([
          { kind: "info", text: `Uploaded ${data.uploaded.length} file(s):` },
          ...names.map((n: string) => ({ kind: "out" as const, text: `  ${n}` })),
        ]);
        await refreshFiles();
        setActiveTab("viewer");
      } else {
        appendLines([{ kind: "err", text: `Upload failed: ${data.error}` }]);
      }
    } catch (e) {
      appendLines([{ kind: "err", text: `Upload error: ${e}` }]);
    } finally {
      setUploading(false);
    }
  }, [refreshFiles]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  // ── Select file ──────────────────────────────────────────────────────────────
  const handleSelectFile = async (node: FileNode) => {
    setSelectedFile(node);
    setActiveTab("viewer");
    setFileContent(null);
    try {
      const res = await fetch(`${API}/file?path=${encodeURIComponent(node.path)}`);
      const data = await res.json();
      setFileContent(data.content ?? data.error ?? "");
    } catch {
      setFileContent("Error loading file.");
    }
  };

  // ── Delete file ──────────────────────────────────────────────────────────────
  const handleDelete = async (node: FileNode) => {
    if (!confirm(`Delete "${node.name}"?`)) return;
    await fetch(`${API}/file?path=${encodeURIComponent(node.path)}`, { method: "DELETE" });
    if (selectedFile?.path === node.path) { setSelectedFile(null); setFileContent(null); }
    await refreshFiles();
  };

  // ── Run script ───────────────────────────────────────────────────────────────
  const appendLines = (lines: TerminalLine[]) => setTermLines((prev) => [...prev, ...lines]);

  const runScript = async () => {
    if (!script.trim() || running) return;
    setRunning(true);
    setActiveTab("terminal");
    appendLines([{ kind: "cmd", text: `[${lang}] Running script…` }]);
    try {
      const res = await fetch(`${API}/exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, lang }),
      });
      const data: ExecResult = await res.json();
      if (data.stdout) appendLines(data.stdout.trimEnd().split("\n").map(l => ({ kind: "out", text: l })));
      if (data.stderr) appendLines(data.stderr.trimEnd().split("\n").map(l => ({ kind: "err", text: l })));
      appendLines([{
        kind: "info",
        text: data.timedOut ? "⏱ Timed out" : `Exit code: ${data.exitCode}`,
      }]);
    } catch (e) {
      appendLines([{ kind: "err", text: String(e) }]);
    } finally {
      setRunning(false);
    }
  };

  // ── Run file from tree ───────────────────────────────────────────────────────
  const runFile = async (node: FileNode) => {
    if (!fileContent) return;
    const ext = node.name.split(".").pop()?.toLowerCase();
    const fileLang = ext === "py" ? "python3" : ext === "js" || ext === "ts" ? "node" : null;
    if (!fileLang) { appendLines([{ kind: "err", text: `Cannot run .${ext} files directly.` }]); return; }
    setRunning(true);
    setActiveTab("terminal");
    appendLines([{ kind: "cmd", text: `Running ${node.name}…` }]);
    try {
      const res = await fetch(`${API}/exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: fileContent, lang: fileLang }),
      });
      const data: ExecResult = await res.json();
      if (data.stdout) appendLines(data.stdout.trimEnd().split("\n").map(l => ({ kind: "out", text: l })));
      if (data.stderr) appendLines(data.stderr.trimEnd().split("\n").map(l => ({ kind: "err", text: l })));
      appendLines([{ kind: "info", text: `Exit code: ${data.exitCode}` }]);
    } catch (e) {
      appendLines([{ kind: "err", text: String(e) }]);
    } finally {
      setRunning(false);
    }
  };

  // ── Monad quick action ───────────────────────────────────────────────────────
  const runMonadAction = async (action: string, params: Record<string, string> = {}) => {
    setMonadRunning(action);
    setActiveTab("terminal");
    appendLines([{ kind: "cmd", text: `monad:${action} ${JSON.stringify(params)}` }]);
    try {
      const res = await fetch(`${API}/monad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, params }),
      });
      const data: ExecResult = await res.json();
      if (data.stdout) appendLines(data.stdout.trimEnd().split("\n").map(l => ({ kind: "out", text: l })));
      if (data.stderr) appendLines(data.stderr.trimEnd().split("\n").map(l => ({ kind: "err", text: l })));
    } catch (e) {
      appendLines([{ kind: "err", text: String(e) }]);
    } finally {
      setMonadRunning(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Page header */}
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Monad Workspace
            </h1>
            <p className="text-sm text-white/45 mt-0.5">
              Upload files · Execute Python/Node.js · Query Monad Testnet (Chain 10143)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://docs.monad.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors"
            >
              docs.monad.xyz <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Body: sidebar + main */}
        <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 130px)" }}>

          {/* ── Left: File Tree ─────────────────────────────────────────────── */}
          <div className="w-64 shrink-0 border-r border-white/10 bg-[#0A0A0F] flex flex-col overflow-hidden">
            {/* Upload dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`m-3 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center gap-2 ${
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-white/10 hover:border-white/25 hover:bg-white/[0.03]"
              }`}
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-white/30" />
              )}
              <p className="text-xs text-center text-white/40 leading-relaxed">
                {uploading ? "Uploading…" : "Drop files here\nor click to browse"}
              </p>
              <p className="text-[10px] text-white/20 text-center">
                ZIP files auto-extracted
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </div>

            {/* File tree header */}
            <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                Files ({files.length})
              </span>
              <button
                onClick={refreshFiles}
                className="text-white/25 hover:text-white/60 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${loadingFiles ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto">
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-white/20 text-xs text-center px-4">
                  <FolderOpen className="w-8 h-8 mb-2 opacity-30" />
                  No files yet.<br />Upload something to start.
                </div>
              ) : (
                files.map((node) => (
                  <FileTreeNode
                    key={node.path}
                    node={node}
                    depth={0}
                    selected={selectedFile?.path ?? null}
                    onSelect={handleSelectFile}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Right: Main panel ───────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Tabs */}
            <div className="flex items-center border-b border-white/10 bg-[#0A0A0F] px-4 pt-2 gap-1 shrink-0">
              {(["terminal", "monad", "viewer"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t transition-colors capitalize ${
                    activeTab === tab
                      ? "bg-background text-white border-x border-t border-white/10"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab === "terminal" && <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" />Terminal</span>}
                  {tab === "monad" && <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />Monad Actions</span>}
                  {tab === "viewer" && <span className="flex items-center gap-1.5"><File className="w-3.5 h-3.5" />{selectedFile ? selectedFile.name : "File Viewer"}</span>}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2 pb-1">
                <button
                  onClick={copyOutput}
                  className="text-white/25 hover:text-white/60 transition-colors text-xs flex items-center gap-1"
                >
                  {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setTermLines([{ kind: "info", text: "Terminal cleared." }])}
                  className="text-white/25 hover:text-white/60 transition-colors text-xs"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* ── Tab: Terminal ──────────────────────────────────────────────── */}
            {activeTab === "terminal" && (
              <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
                {/* Script editor */}
                <div className="flex items-center gap-2">
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value as any)}
                    className="bg-black/50 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white/70 focus:outline-none focus:border-primary/50"
                  >
                    <option value="python3">Python 3</option>
                    <option value="node">Node.js</option>
                  </select>
                  <span className="text-white/20 text-xs">Script editor</span>
                  <Button
                    size="sm"
                    onClick={runScript}
                    disabled={running || !script.trim()}
                    className="ml-auto gap-1.5 h-7 text-xs"
                  >
                    {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    {running ? "Running…" : "Run"}
                  </Button>
                </div>

                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runScript(); }
                  }}
                  className="h-44 w-full bg-black/60 border border-white/10 rounded-lg p-3 font-mono text-sm text-white/80 resize-none focus:outline-none focus:border-primary/40 leading-relaxed"
                  placeholder="# Write Python or Node.js here…"
                  spellCheck={false}
                />

                <p className="text-[10px] text-white/20">
                  Ctrl+Enter to run · Scripts execute in the uploads directory · 30s timeout · No network restrictions
                </p>

                {/* Output terminal */}
                <div className="flex-1 flex flex-col border border-white/10 rounded-lg overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-white/5 flex items-center gap-2 bg-black/40 shrink-0">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-[10px] font-mono text-white/25">monad-workspace</span>
                    {running && <Loader2 className="w-3 h-3 animate-spin text-primary ml-auto" />}
                  </div>
                  <TerminalOutput lines={termLines} />
                </div>
              </div>
            )}

            {/* ── Tab: Monad Actions ─────────────────────────────────────────── */}
            {activeTab === "monad" && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl space-y-5">

                  {/* Chain status */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-bold text-sm text-white">Chain Status</div>
                        <div className="text-xs text-white/40 mt-0.5">Latest block · gas price · chain ID</div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => runMonadAction("status")}
                        disabled={!!monadRunning}
                        className="gap-1.5 h-8"
                      >
                        {monadRunning === "status" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Run
                      </Button>
                    </div>
                    <div className="flex gap-4 text-xs font-mono text-white/30">
                      <span>testnet-rpc.monad.xyz</span>
                      <span>·</span>
                      <span>Chain 10143</span>
                    </div>
                  </div>

                  {/* Balance check */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="font-bold text-sm text-white mb-1">Check Wallet Balance</div>
                    <div className="text-xs text-white/40 mb-3">eth_getBalance · returns MON balance</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="0x… wallet address"
                        value={monadAddr}
                        onChange={(e) => setMonadAddr(e.target.value)}
                        className="font-mono text-xs h-9 bg-black/50 border-white/10"
                      />
                      <Button
                        size="sm"
                        onClick={() => runMonadAction("balance", { address: monadAddr })}
                        disabled={!!monadRunning || !monadAddr.startsWith("0x")}
                        className="shrink-0 gap-1.5 h-9"
                      >
                        {monadRunning === "balance" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        Check
                      </Button>
                    </div>
                  </div>

                  {/* Latest block */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-bold text-sm text-white">Latest Block</div>
                        <div className="text-xs text-white/40 mt-0.5">eth_getBlockByNumber · hash, txs, gas</div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => runMonadAction("block")}
                        disabled={!!monadRunning}
                        className="gap-1.5 h-8"
                      >
                        {monadRunning === "block" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        Fetch
                      </Button>
                    </div>
                  </div>

                  {/* Transaction lookup */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="font-bold text-sm text-white mb-1">Transaction Lookup</div>
                    <div className="text-xs text-white/40 mb-3">eth_getTransactionByHash · from, to, value, block</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="0x… transaction hash"
                        value={monadHash}
                        onChange={(e) => setMonadHash(e.target.value)}
                        className="font-mono text-xs h-9 bg-black/50 border-white/10"
                      />
                      <Button
                        size="sm"
                        onClick={() => runMonadAction("tx", { hash: monadHash })}
                        disabled={!!monadRunning || !monadHash.startsWith("0x")}
                        className="shrink-0 gap-1.5 h-9"
                      >
                        {monadRunning === "tx" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        Lookup
                      </Button>
                    </div>
                  </div>

                  {/* Contract code check */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="font-bold text-sm text-white mb-1">Contract Code Check</div>
                    <div className="text-xs text-white/40 mb-3">eth_getCode · verify if address is a deployed contract</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="0x… contract address"
                        value={monadAddr}
                        onChange={(e) => setMonadAddr(e.target.value)}
                        className="font-mono text-xs h-9 bg-black/50 border-white/10"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => runMonadAction("code", { address: monadAddr })}
                        disabled={!!monadRunning || !monadAddr.startsWith("0x")}
                        className="shrink-0 gap-1.5 h-9"
                      >
                        {monadRunning === "code" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        Check
                      </Button>
                    </div>
                  </div>

                  {/* Terminal output - compact */}
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 bg-black/40">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                        <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                        <div className="w-2 h-2 rounded-full bg-green-500/50" />
                      </div>
                      <span className="text-[10px] font-mono text-white/25">output</span>
                      {monadRunning && <Loader2 className="w-3 h-3 animate-spin text-primary ml-auto" />}
                    </div>
                    <TerminalOutput lines={termLines} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: File Viewer ───────────────────────────────────────────── */}
            {activeTab === "viewer" && (
              <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
                {!selectedFile ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/20 text-center">
                    <File className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">Select a file from the tree to view its content.</p>
                  </div>
                ) : (
                  <>
                    {/* File header */}
                    <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-lg">
                      <span className="text-xl">{fileIcon(selectedFile.name)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono font-bold text-sm text-white truncate">{selectedFile.name}</div>
                        <div className="text-xs text-white/35 font-mono mt-0.5">{selectedFile.path}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {/* Run button for Python/JS files */}
                        {(selectedFile.name.endsWith(".py") || selectedFile.name.endsWith(".js")) && fileContent && (
                          <Button
                            size="sm"
                            onClick={() => runFile(selectedFile)}
                            disabled={running}
                            className="gap-1.5 h-8 text-xs"
                          >
                            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            Run File
                          </Button>
                        )}
                        {/* Load into editor */}
                        {fileContent && (selectedFile.name.endsWith(".py") || selectedFile.name.endsWith(".js")) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => { setScript(fileContent); setActiveTab("terminal"); }}
                            className="h-8 text-xs"
                          >
                            Edit
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(selectedFile)}
                          className="h-8 text-xs text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* File content */}
                    <div className="flex-1 overflow-hidden border border-white/10 rounded-lg bg-[#060608]">
                      {fileContent === null ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      ) : (
                        <pre className="h-full overflow-auto p-4 font-mono text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-all">
                          {fileContent}
                        </pre>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
