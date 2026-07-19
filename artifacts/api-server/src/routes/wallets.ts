/**
 * Wallet routes — generate burner wallets for non-crypto users and AI agents,
 * check live Monad Testnet balances, and track education rewards.
 */
import { Router, type IRouter } from "express";
import { db, walletsTable, educationProgressTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ethers } from "ethers";
import { z } from "zod";

const router: IRouter = Router();

// Monad Testnet RPC
const MONAD_RPC = "https://testnet-rpc.monad.xyz";
const MONAD_CHAIN_ID = 10143;

// Pre-seeded AI agent roles — each gets a deterministic wallet label
const AI_AGENT_ROLES = [
  { role: "agent", label: "THESIS Governance Agent" },
  { role: "agent", label: "Builder Agent" },
  { role: "agent", label: "Auditor Agent" },
  { role: "agent", label: "Rewards Agent" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getMonadBalance(address: string): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(MONAD_RPC, {
      chainId: MONAD_CHAIN_ID,
      name: "monad-testnet",
    });
    const bal = await provider.getBalance(address);
    return ethers.formatEther(bal);
  } catch {
    return "0.0";
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /wallets/generate
 * Generate a new burner wallet. Works for non-crypto users, AI agents, and learners.
 * Body: { label, role? }
 */
router.post("/wallets/generate", async (req, res): Promise<void> => {
  const body = z.object({
    label: z.string().min(1).max(80).default("My Wallet"),
    role:  z.enum(["user", "agent", "learner", "educator"]).default("user"),
    notes: z.string().optional(),
  }).safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const wallet = ethers.Wallet.createRandom();

  const [saved] = await db
    .insert(walletsTable)
    .values({
      label:      body.data.label,
      role:       body.data.role,
      address:    wallet.address,
      privateKey: wallet.privateKey,
      mnemonic:   wallet.mnemonic?.phrase ?? null,
      notes:      body.data.notes ?? null,
    })
    .returning();

  res.status(201).json({
    id:          saved.id,
    label:       saved.label,
    role:        saved.role,
    address:     saved.address,
    // Return private key ONCE on creation so the user can save it
    privateKey:  saved.privateKey,
    mnemonic:    saved.mnemonic,
    balance:     "0.0",
    faucetUrl:   "https://faucet.monad.xyz",
    explorerUrl: `https://testnet.monadexplorer.com/address/${saved.address}`,
    network:     { chainId: MONAD_CHAIN_ID, name: "Monad Testnet", rpc: MONAD_RPC },
    createdAt:   saved.createdAt,
  });
});

/**
 * GET /wallets
 * List all wallets, optionally filtered by role.
 */
router.get("/wallets", async (req, res): Promise<void> => {
  const role = req.query.role as string | undefined;

  const wallets = await db
    .select({
      id:          walletsTable.id,
      label:       walletsTable.label,
      role:        walletsTable.role,
      address:     walletsTable.address,
      balanceCache: walletsTable.balanceCache,
      notes:       walletsTable.notes,
      createdAt:   walletsTable.createdAt,
    })
    .from(walletsTable)
    .orderBy(desc(walletsTable.createdAt));

  const filtered = role ? wallets.filter(w => w.role === role) : wallets;
  res.json(filtered);
});

/**
 * GET /wallets/:address
 * Get a single wallet (no private key returned).
 */
router.get("/wallets/:address", async (req, res): Promise<void> => {
  const [wallet] = await db
    .select({
      id:          walletsTable.id,
      label:       walletsTable.label,
      role:        walletsTable.role,
      address:     walletsTable.address,
      balanceCache: walletsTable.balanceCache,
      notes:       walletsTable.notes,
      createdAt:   walletsTable.createdAt,
    })
    .from(walletsTable)
    .where(eq(walletsTable.address, req.params.address));

  if (!wallet) { res.status(404).json({ error: "Wallet not found" }); return; }
  res.json(wallet);
});

/**
 * GET /wallets/:address/balance
 * Fetch live MON balance from Monad Testnet and cache it.
 */
router.get("/wallets/:address/balance", async (req, res): Promise<void> => {
  const { address } = req.params;
  if (!ethers.isAddress(address)) {
    res.status(400).json({ error: "Invalid address" });
    return;
  }

  const balance = await getMonadBalance(address);

  // Update cache in DB (fire and forget)
  db.update(walletsTable)
    .set({ balanceCache: balance, balanceFetchedAt: new Date() })
    .where(eq(walletsTable.address, address))
    .catch(() => {});

  res.json({
    address,
    balance,
    unit: "MON",
    network: { chainId: MONAD_CHAIN_ID, name: "Monad Testnet" },
    explorerUrl: `https://testnet.monadexplorer.com/address/${address}`,
    faucetUrl: "https://faucet.monad.xyz",
  });
});

/**
 * POST /wallets/seed-agents
 * Seed wallets for the built-in AI agents (idempotent — skips existing agents).
 */
router.post("/wallets/seed-agents", async (_req, res): Promise<void> => {
  const existing = await db
    .select({ label: walletsTable.label })
    .from(walletsTable)
    .where(eq(walletsTable.role, "agent"));

  const existingLabels = new Set(existing.map(w => w.label));
  const created = [];

  for (const agent of AI_AGENT_ROLES) {
    if (existingLabels.has(agent.label)) continue;
    const wallet = ethers.Wallet.createRandom();
    const [saved] = await db
      .insert(walletsTable)
      .values({
        label:      agent.label,
        role:       agent.role,
        address:    wallet.address,
        privateKey: wallet.privateKey,
        mnemonic:   wallet.mnemonic?.phrase ?? null,
        notes:      `Auto-generated AI agent wallet for ${agent.label}`,
      })
      .returning({ id: walletsTable.id, label: walletsTable.label, address: walletsTable.address });
    created.push(saved);
  }

  res.json({ seeded: created.length, agents: created });
});

// ── Education Progress ────────────────────────────────────────────────────────

/**
 * POST /education/progress
 * Record a completed education module for a wallet address.
 */
router.post("/education/progress", async (req, res): Promise<void> => {
  const body = z.object({
    walletAddress: z.string(),
    moduleId:      z.string(),
    moduleTitle:   z.string(),
    score:         z.string().optional(),
  }).safeParse(req.body);

  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [progress] = await db
    .insert(educationProgressTable)
    .values({
      walletAddress: body.data.walletAddress,
      moduleId:      body.data.moduleId,
      moduleTitle:   body.data.moduleTitle,
      score:         body.data.score ?? null,
      completed:     true,
      completedAt:   new Date(),
    })
    .returning();

  res.status(201).json(progress);
});

/**
 * GET /education/progress/:address
 * Get all completed modules for a wallet address.
 */
router.get("/education/progress/:address", async (req, res): Promise<void> => {
  const progress = await db
    .select()
    .from(educationProgressTable)
    .where(eq(educationProgressTable.walletAddress, req.params.address))
    .orderBy(desc(educationProgressTable.createdAt));

  res.json(progress);
});

export default router;
