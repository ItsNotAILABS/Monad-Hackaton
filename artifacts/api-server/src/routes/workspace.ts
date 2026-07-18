import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { createReadStream, existsSync } from "fs";
import unzipper from "unzipper";
import { spawn } from "child_process";
import { logger } from "../lib/logger";

// ─── Workspace directory (persists in Replit filesystem) ─────────────────────
export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

// Ensure it exists on startup
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {});

// ─── Multer setup ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    // Preserve original name but sanitize it
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
});

// ─── Router ───────────────────────────────────────────────────────────────────
export const workspaceRouter = Router();

// POST /workspace/upload — accept any files, auto-extract ZIPs
workspaceRouter.post(
  "/workspace/upload",
  (upload.array("files", 30) as any),
  async (req: any, res: any) => {
    try {
      const files = (req.files ?? []) as Express.Multer.File[];
      const results: any[] = [];

      for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file.filename);

        if (file.originalname.toLowerCase().endsWith(".zip")) {
          // Extract into a subdirectory named after the ZIP (without extension)
          const baseName = file.filename.replace(/\.zip$/i, "");
          const extractDir = path.join(UPLOADS_DIR, baseName);
          await fs.mkdir(extractDir, { recursive: true });

          await new Promise<void>((resolve, reject) => {
            createReadStream(filePath)
              .pipe(unzipper.Extract({ path: extractDir }))
              .on("close", resolve)
              .on("error", reject);
          });

          // Remove the raw ZIP after extraction
          await fs.rm(filePath, { force: true });

          results.push({
            name: file.originalname,
            type: "zip",
            extracted: true,
            extractedTo: baseName,
          });
        } else {
          results.push({
            name: file.originalname,
            filename: file.filename,
            type: "file",
            size: file.size,
            mimetype: file.mimetype,
          });
        }
      }

      logger.info({ count: files.length }, "Files uploaded to workspace");
      res.json({ ok: true, uploaded: results });
    } catch (err) {
      logger.error({ err }, "Upload error");
      res.status(500).json({ error: String(err) });
    }
  }
);

// GET /workspace/files — recursive file tree
workspaceRouter.get("/workspace/files", async (_req: any, res: any) => {
  try {
    const tree = await buildFileTree(UPLOADS_DIR, UPLOADS_DIR);
    res.json({ files: tree });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /workspace/file?path=... — file content (text only)
workspaceRouter.get("/workspace/file", async (req: any, res: any) => {
  try {
    const relPath = (req.query.path as string) || "";
    const fullPath = path.resolve(UPLOADS_DIR, relPath);

    // Security: must stay within UPLOADS_DIR
    if (!fullPath.startsWith(UPLOADS_DIR + path.sep) && fullPath !== UPLOADS_DIR) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const stat = await fs.stat(fullPath).catch(() => null);
    if (!stat || !stat.isFile()) return res.status(404).json({ error: "Not found" });

    // Cap at 1 MB for text files
    if (stat.size > 1 * 1024 * 1024) {
      return res.json({ content: "[File too large to display — > 1 MB]", path: relPath });
    }

    const content = await fs.readFile(fullPath, "utf-8");
    res.json({ content, path: relPath, size: stat.size });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /workspace/file?path=... — remove a file or directory
workspaceRouter.delete("/workspace/file", async (req: any, res: any) => {
  try {
    const relPath = (req.query.path as string) || "";
    if (!relPath) return res.status(400).json({ error: "path required" });

    const fullPath = path.resolve(UPLOADS_DIR, relPath);
    if (!fullPath.startsWith(UPLOADS_DIR + path.sep) && fullPath !== UPLOADS_DIR) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await fs.rm(fullPath, { recursive: true, force: true });
    res.json({ ok: true, deleted: relPath });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /workspace/exec — run a Python or Node.js script
workspaceRouter.post("/workspace/exec", async (req: any, res: any) => {
  try {
    const { script, lang = "python3", timeout = 20000 } = req.body;
    if (!script || typeof script !== "string") {
      return res.status(400).json({ error: "script string required" });
    }

    const result = await runScript(script, lang as string, Math.min(timeout as number, 30000));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /workspace/monad — pre-built Monad chain actions
workspaceRouter.post("/workspace/monad", async (req: any, res: any) => {
  try {
    const { action, params = {} } = req.body;

    const script = buildMonadScript(action, params);
    if (!script) return res.status(400).json({ error: `Unknown action: ${action}` });

    const result = await runScript(script, "python3", 20000);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Script runner ────────────────────────────────────────────────────────────
function runScript(
  script: string,
  lang: string,
  timeout: number
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
  return new Promise((resolve) => {
    const validLangs: Record<string, string[]> = {
      python3: ["-c", script],
      node: ["--eval", script],
      python: ["-c", script],
    };

    const args = validLangs[lang];
    if (!args) {
      return resolve({ stdout: "", stderr: `Unsupported lang: ${lang}`, exitCode: 1, timedOut: false });
    }

    const proc = spawn(lang, args, {
      cwd: UPLOADS_DIR,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, timeout);

    proc.on("close", (code: number | null) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: timedOut ? stderr + `\n⏱ Script killed after ${timeout / 1000}s timeout` : stderr,
        exitCode: code ?? 0,
        timedOut,
      });
    });
  });
}

// ─── Pre-built Monad Python scripts ──────────────────────────────────────────
function buildMonadScript(action: string, params: Record<string, any>): string | null {
  const RPC = "https://rpc.monad.xyz";

  const rpcCall = (method: string, rpcParams: any[]) => `
import urllib.request, json, sys

def rpc(method, params):
    req = urllib.request.Request(
        "${RPC}",
        data=json.dumps({"jsonrpc":"2.0","method":method,"params":params,"id":1}).encode(),
        headers={"Content-Type":"application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return {"error": {"message": str(e)}}
`;

  const scripts: Record<string, string> = {
    status: rpcCall("eth_blockNumber", []) + `
r_chain = rpc("eth_chainId", [])
r_block = rpc("eth_blockNumber", [])
r_gas   = rpc("eth_gasPrice", [])

if "error" in r_chain:
    print("❌ RPC error:", r_chain["error"]["message"]); sys.exit(1)

chain_id   = int(r_chain["result"], 16)
block_num  = int(r_block["result"], 16)
gas_price  = int(r_gas["result"], 16)

print("━━━  Monad Mainnet Status  ━━━")
print(f"  Chain ID    :  {chain_id}")
print(f"  Latest Block:  {block_num:,}")
print(f"  Gas Price   :  {gas_price / 1e9:.4f} Gwei")
print(f"  RPC         :  ${RPC}")
print(f"  Throughput  :  10,000 TPS")
print(f"  Block Time  :  400ms")
print(f"  Finality    :  800ms")
`,

    balance: rpcCall("eth_getBalance", []) + `
addr = ${JSON.stringify(params.address || "0x0000000000000000000000000000000000000000")}
r = rpc("eth_getBalance", [addr, "latest"])
if "error" in r:
    print("❌ RPC error:", r["error"]["message"]); sys.exit(1)

wei = int(r["result"], 16)
mon = wei / 1e18
print("━━━  Wallet Balance  ━━━")
print(f"  Address:  {addr}")
print(f"  Balance:  {mon:.8f} MON")
print(f"  In wei :  {wei:,}")
`,

    block: rpcCall("eth_getBlockByNumber", ["latest", False]) + `
r = rpc("eth_getBlockByNumber", ["latest", False])
if "error" in r:
    print("❌ RPC error:", r["error"]["message"]); sys.exit(1)

b = r["result"]
import datetime
ts = datetime.datetime.utcfromtimestamp(int(b["timestamp"], 16))

print("━━━  Latest Block  ━━━")
print(f"  Number      :  {int(b['number'], 16):,}")
print(f"  Hash        :  {b['hash']}")
print(f"  Parent      :  {b['parentHash']}")
print(f"  Timestamp   :  {ts} UTC")
print(f"  Transactions:  {len(b['transactions'])}")
print(f"  Gas Used    :  {int(b['gasUsed'], 16):,}")
print(f"  Gas Limit   :  {int(b['gasLimit'], 16):,}")
print(f"  Miner       :  {b.get('miner', b.get('coinbase', 'N/A'))}")
print(f"  Base Fee    :  {int(b['baseFeePerGas'], 16) / 1e9:.4f} Gwei" if b.get('baseFeePerGas') else "  Base Fee    :  N/A")
`,

    tx: rpcCall("eth_getTransactionByHash", []) + `
txhash = ${JSON.stringify(params.hash || "0x")}
if not txhash or txhash == "0x":
    print("❌ No transaction hash provided"); sys.exit(1)

r = rpc("eth_getTransactionByHash", [txhash])
if "error" in r:
    print("❌ RPC error:", r["error"]["message"]); sys.exit(1)

tx = r.get("result")
if not tx:
    print("❌ Transaction not found on Monad Mainnet"); sys.exit(1)

mon_val = int(tx["value"], 16) / 1e18

print("━━━  Transaction  ━━━")
print(f"  Hash   :  {tx['hash']}")
print(f"  From   :  {tx['from']}")
print(f"  To     :  {tx.get('to') or '(contract creation)'}")
print(f"  Value  :  {mon_val:.8f} MON")
print(f"  Gas    :  {int(tx['gas'], 16):,}")
print(f"  Nonce  :  {int(tx['nonce'], 16)}")
blk = tx.get("blockNumber")
print(f"  Block  :  {int(blk, 16):,}" if blk else "  Block  :  pending")
`,

    code: rpcCall("eth_getCode", []) + `
addr = ${JSON.stringify(params.address || "0x0000000000000000000000000000000000000000")}
r = rpc("eth_getCode", [addr, "latest"])
if "error" in r:
    print("❌ RPC error:", r["error"]["message"]); sys.exit(1)

code = r["result"]
print("━━━  Contract Code  ━━━")
print(f"  Address  :  {addr}")
if code == "0x" or not code:
    print(f"  Status   :  Not a contract (EOA)")
else:
    print(f"  Status   :  Contract deployed ✓")
    print(f"  Bytecode :  {len(code)//2 - 1} bytes")
    print(f"  Hex (first 64 bytes):")
    print(f"  {code[2:130]}...")
`,
  };

  return scripts[action] ?? null;
}

// ─── File tree builder ────────────────────────────────────────────────────────
interface FileNode {
  name: string;
  type: "file" | "dir";
  path: string;
  size?: number;
  children?: FileNode[];
}

async function buildFileTree(dir: string, root: string, depth = 0): Promise<FileNode[]> {
  if (depth > 8) return []; // safety
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const result: FileNode[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(root, fullPath);

    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        type: "dir",
        path: relPath,
        children: await buildFileTree(fullPath, root, depth + 1),
      });
    } else {
      const stat = await fs.stat(fullPath).catch(() => null);
      result.push({
        name: entry.name,
        type: "file",
        path: relPath,
        size: stat?.size,
      });
    }
  }

  return result.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
