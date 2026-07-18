#!/usr/bin/env node
/**
 * THESIS Node bridge — agents, WASM probe, WebGPU capability report, Julia relay.
 * Usage:
 *   node thesis-bridge.mjs pulse
 *   node thesis-bridge.mjs agent-rank '{"agents":[...]}'
 *   node thesis-bridge.mjs wasm-hash "hello"
 *   node thesis-bridge.mjs webgpu-info
 *   node thesis-bridge.mjs julia spectral '{}'
 */
import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JULIA_SCRIPT = join(__dirname, "..", "julia", "ThesisIntel.jl");

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

function parseJson(s, fallback = {}) {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return fallback;
  }
}

/** Minimal pure-JS "WASM-like" kernel: deterministic vector ops (always works). */
function wasmKernel(input = "thesis") {
  const buf = Buffer.from(String(input));
  const hash = createHash("sha256").update(buf).digest();
  const vec = [];
  for (let i = 0; i < 16; i++) vec.push(hash[i] / 255);
  const energy = vec.reduce((a, b) => a + b * b, 0);
  return {
    ok: true,
    engine: "node.wasm_kernel",
    locality: "node+wasm-sim",
    input_len: buf.length,
    digest: hash.toString("hex").slice(0, 32),
    vec16: vec,
    energy,
    note: "Deterministic WASM-style kernel (pure Node). Browser WebGPU is separate.",
  };
}

/** Optional real WASM module: multiply-add kernel compiled as raw bytes if available. */
async function tryRealWasm(n = 8) {
  // Tiny hand-written WASM: (func (param i32 i32) (result i32) local.get 0 local.get 1 i32.add)
  // magic + version + type/func/export/code sections — add two i32
  const bytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01,
    0x7f, 0x03, 0x02, 0x01, 0x00, 0x07, 0x07, 0x01, 0x03, 0x61, 0x64, 0x64, 0x00, 0x00, 0x0a, 0x09,
    0x01, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b,
  ]);
  try {
    const { instance } = await WebAssembly.instantiate(bytes);
    const add = instance.exports.add;
    const samples = [];
    for (let i = 0; i < n; i++) samples.push(add(i, i * 2));
    return {
      ok: true,
      engine: "node.wasm_native",
      locality: "node+wasm",
      export: "add",
      samples,
      webassembly: typeof WebAssembly !== "undefined",
    };
  } catch (e) {
    return { ok: false, error: String(e.message || e), engine: "node.wasm_native" };
  }
}

function agentRank(params) {
  const agents = params.agents || [
    { name: "yield", return: 0.08, risk: 0.03, lawful: true, gas_score: 0.9 },
    { name: "degen", return: 0.4, risk: 0.25, lawful: false, gas_score: 0.2 },
    { name: "mm", return: 0.05, risk: 0.015, lawful: true, gas_score: 0.95 },
  ];
  const ranked = agents
    .map((a) => {
      const ret = Number(a.return ?? a.expected_return ?? 0);
      const risk = Math.max(Number(a.risk ?? a.vol ?? 0.02), 1e-6);
      const lawful = a.lawful !== false;
      const gas = Number(a.gas_score ?? 0.8);
      const utility = (ret / risk) * (lawful ? 1 : 0.05) * gas;
      return { ...a, name: a.name || a.agent || "agent", utility };
    })
    .sort((x, y) => y.utility - x.utility);
  return {
    ok: true,
    engine: "node.agent_rank",
    locality: "node",
    ranking: ranked,
    winner: ranked[0]?.name ?? null,
    doctrine: "Lawful + gas-efficient agents rank higher than degen",
  };
}

function webgpuInfo() {
  // Node 24 may not have navigator.gpu; report capability for the *browser* via hints
  const hasNav = typeof navigator !== "undefined" && navigator.gpu;
  return {
    ok: true,
    engine: "node.webgpu_info",
    locality: "node",
    node_has_gpu: Boolean(hasNav),
    browser_hint:
      "In React, call navigator.gpu.requestAdapter() — WebGPU panel reports adapter limits",
    preferred_formats: ["bgra8unorm", "rgba8unorm"],
    fallback: "CPU Julia spectral + Node wasm kernel when WebGPU unavailable",
  };
}

function runJulia(cmd, params) {
  if (!existsSync(JULIA_SCRIPT)) {
    return { ok: false, error: "ThesisIntel.jl missing", path: JULIA_SCRIPT };
  }
  const r = spawnSync(
    "julia",
    ["--startup-file=no", "--compile=min", "-O0", JULIA_SCRIPT, cmd, JSON.stringify(params || {})],
    { encoding: "utf8", timeout: 60000, windowsHide: true }
  );
  if (r.error) {
    return { ok: false, error: String(r.error.message || r.error), engine: "node→julia" };
  }
  const lines = (r.stdout || "").trim().split(/\r?\n/).filter(Boolean);
  const last = lines[lines.length - 1] || "{}";
  try {
    const j = JSON.parse(last);
    return { ...j, relay: "node→julia", stderr: (r.stderr || "").slice(0, 200) || undefined };
  } catch {
    return {
      ok: false,
      error: "julia non-json",
      stdout: (r.stdout || "").slice(0, 400),
      stderr: (r.stderr || "").slice(0, 400),
    };
  }
}

function pulse() {
  return {
    ok: true,
    engine: "node.pulse",
    locality: "node",
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    engines: ["pulse", "agent-rank", "wasm-hash", "wasm-native", "webgpu-info", "julia"],
    julia_script: existsSync(JULIA_SCRIPT),
    nonce: randomBytes(8).toString("hex"),
  };
}

async function main() {
  const cmd = process.argv[2] || "pulse";
  const arg = process.argv[3] || "{}";
  const params = parseJson(arg);

  try {
    if (cmd === "pulse" || cmd === "status") {
      emit(pulse());
      return;
    }
    if (cmd === "agent-rank" || cmd === "agents") {
      emit(agentRank(params));
      return;
    }
    if (cmd === "wasm-hash" || cmd === "wasm") {
      emit(wasmKernel(params.input || params.text || arg));
      return;
    }
    if (cmd === "wasm-native") {
      emit(await tryRealWasm(Number(params.n || 8)));
      return;
    }
    if (cmd === "webgpu-info" || cmd === "webgpu") {
      emit(webgpuInfo());
      return;
    }
    if (cmd === "julia") {
      const jcmd = process.argv[3] || "pulse";
      const jparams = parseJson(process.argv[4] || "{}");
      emit(runJulia(jcmd, jparams));
      return;
    }
    // default: try julia cmd directly via relay name
    if (["spectral", "monte_carlo", "portfolio", "gas", "agent_score", "pulse"].includes(cmd)) {
      emit(runJulia(cmd, params));
      return;
    }
    emit({ ok: false, error: `unknown cmd ${cmd}`, hint: "pulse|agent-rank|wasm-hash|wasm-native|webgpu-info|julia" });
  } catch (e) {
    emit({ ok: false, error: String(e.message || e), engine: "node" });
  }
}

main();
