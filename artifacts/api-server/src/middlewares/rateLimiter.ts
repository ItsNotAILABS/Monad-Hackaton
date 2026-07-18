/**
 * Rate-limiting for AI endpoints — two layers:
 *
 * 1. In-memory sliding-window per-IP (40 req / 15 min)
 *    Fast, low-latency guard against individual abuse.
 *    Resets on server restart — acceptable because layer 2 covers that gap.
 *
 * 2. DB-backed global circuit-breaker (500 AI calls / UTC day)
 *    Survives server restarts. Once the daily cap is hit, ALL AI
 *    requests return 429 until the UTC day rolls over.
 *    The counter is incremented atomically via a PostgreSQL upsert so
 *    there are no race conditions even under concurrent requests.
 */
import { Request, Response, NextFunction } from "express";
import { db, aiDailyBudgetTable } from "@workspace/db";
import { sql } from "drizzle-orm";

// ─── Per-IP sliding window ───────────────────────────────────────────────────
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_IP = 40;

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Prune stale IPs every 15 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
    if (entry.timestamps.length === 0) store.delete(ip);
  }
}, WINDOW_MS);

// ─── Global circuit-breaker ───────────────────────────────────────────────────
/** Max AI calls across ALL IPs in a single UTC calendar day. */
const DAILY_GLOBAL_LIMIT = 500;

/** UTC date string "YYYY-MM-DD" for today. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Unix timestamp (ms) after which the cached exhaustion flag expires (UTC midnight). */
let exhaustedUntil = 0;

/** UTC midnight timestamp (ms) for the end of the current UTC day. */
function nextUtcMidnightMs(): number {
  const now = new Date();
  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
}

/**
 * Atomically increment today's global call counter and return the new count.
 * Uses INSERT … ON CONFLICT DO UPDATE so it's safe under concurrency.
 */
async function incrementDailyCounter(): Promise<number> {
  const date = todayUtc();
  const rows = await db
    .insert(aiDailyBudgetTable)
    .values({ date, callCount: 1 })
    .onConflictDoUpdate({
      target: aiDailyBudgetTable.date,
      set: { callCount: sql`${aiDailyBudgetTable.callCount} + 1` },
    })
    .returning({ callCount: aiDailyBudgetTable.callCount });
  return rows[0]?.callCount ?? 1;
}

// ─── Combined middleware ───────────────────────────────────────────────────────
export async function aiRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Layer 1 — per-IP in-memory sliding window
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS_PER_IP) {
    const oldestTs = entry.timestamps[0]!;
    const retryAfter = Math.ceil((oldestTs + WINDOW_MS - now) / 1000);
    res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter,
      message: `Too many AI requests. Try again in ${retryAfter}s.`,
    });
    return;
  }

  // Layer 2 — global daily circuit-breaker (DB-backed, survives restarts)
  try {
    const now2 = Date.now();

    // Fast path: in-process cache says budget is exhausted until UTC midnight.
    // Avoids a DB write for every blocked request after the limit is hit.
    if (exhaustedUntil > now2) {
      const retryAfter = Math.ceil((exhaustedUntil - now2) / 1000);
      res.status(429).json({
        error: "Daily AI budget exhausted",
        retryAfter,
        message: `The daily AI request limit has been reached. Service resets at UTC midnight (in ${Math.ceil(retryAfter / 60)} min).`,
      });
      return;
    }

    const dailyCount = await incrementDailyCounter();
    if (dailyCount > DAILY_GLOBAL_LIMIT) {
      // Cache the exhausted state until UTC midnight so subsequent requests
      // short-circuit without another DB round-trip.
      exhaustedUntil = nextUtcMidnightMs();
      const retryAfter = Math.ceil((exhaustedUntil - now2) / 1000);
      res.status(429).json({
        error: "Daily AI budget exhausted",
        retryAfter,
        message: `The daily AI request limit has been reached. Service resets at UTC midnight (in ${Math.ceil(retryAfter / 60)} min).`,
      });
      return;
    }
  } catch (err) {
    // If the DB is unavailable, fall through rather than blocking all requests.
    // The per-IP limiter still provides basic protection.
    console.error("[rateLimiter] DB circuit-breaker check failed:", err);
  }

  // Record the per-IP timestamp only after both checks pass
  entry.timestamps.push(now);
  next();
}
