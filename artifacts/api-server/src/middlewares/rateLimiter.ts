/**
 * Rate-limiting for AI endpoints — three layers:
 *
 * 1. In-memory sliding-window per-IP (40 req / 15 min)
 *    Fast, low-latency guard against short bursts.
 *    Resets on server restart — Layer 2 covers that gap.
 *
 * 2. DB-backed per-IP daily cap (100 req / UTC day)
 *    Persists across restarts. Prevents a single IP from taking
 *    a disproportionate share of the shared global budget even
 *    after cold-start. In-memory cache used as fast first-check;
 *    DB is authoritative. Cache is keyed by "YYYY-MM-DD:ip" and
 *    cleared automatically when the UTC date rolls over.
 *
 * 3. DB-backed global circuit-breaker (500 AI calls / UTC day)
 *    Survives server restarts. Once the daily cap is hit, ALL AI
 *    requests return 429 until the UTC day rolls over.
 *    The counter is incremented atomically via a PostgreSQL upsert so
 *    there are no race conditions even under concurrent requests.
 */
import { Request, Response, NextFunction } from "express";
import { db, aiDailyBudgetTable, aiIpLimitsTable } from "@workspace/db";
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

// ─── Per-IP daily DB-backed limit ─────────────────────────────────────────────
/** Max AI calls from a single IP in one UTC calendar day. */
const DAILY_PER_IP_LIMIT = 100;

/**
 * In-memory cache of per-IP daily counts.
 * Key: "YYYY-MM-DD:ip"  Value: count returned by the last DB upsert
 *
 * The cache is intentionally optimistic: it stores the count AFTER the last
 * successful DB increment for that (date, ip) pair. If the cached count is
 * already >= DAILY_PER_IP_LIMIT we can reject without touching the DB.
 * When the date changes, all stale keys from yesterday are ignored because
 * they won't match todayUtc() in the key.
 */
const ipDailyCache = new Map<string, number>();

/** Evict yesterday's entries at UTC midnight to keep memory bounded. */
function scheduleIpCacheEviction(): void {
  const now = Date.now();
  const msUntilMidnight = nextUtcMidnightMs() - now;
  setTimeout(() => {
    const today = todayUtc();
    for (const key of ipDailyCache.keys()) {
      if (!key.startsWith(today + ":")) ipDailyCache.delete(key);
    }
    scheduleIpCacheEviction(); // reschedule for the next day
  }, msUntilMidnight + 1000); // +1 s margin
}
scheduleIpCacheEviction();

/**
 * Atomically increment the per-IP daily counter in the DB and return
 * the new count. Uses INSERT … ON CONFLICT DO UPDATE for safety under
 * concurrency.
 */
async function incrementIpCounter(date: string, ip: string): Promise<number> {
  const rows = await db
    .insert(aiIpLimitsTable)
    .values({ date, ip, callCount: 1 })
    .onConflictDoUpdate({
      target: [aiIpLimitsTable.date, aiIpLimitsTable.ip],
      set: { callCount: sql`${aiIpLimitsTable.callCount} + 1` },
    })
    .returning({ callCount: aiIpLimitsTable.callCount });
  return rows[0]?.callCount ?? 1;
}

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
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();

  // ── Layer 1: per-IP in-memory sliding window ──────────────────────────────
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

  // ── Layer 2: per-IP DB-backed daily cap ───────────────────────────────────
  try {
    const date = todayUtc();
    const cacheKey = `${date}:${ip}`;
    const cachedCount = ipDailyCache.get(cacheKey) ?? 0;

    if (cachedCount >= DAILY_PER_IP_LIMIT) {
      // Fast path — no DB round-trip needed
      const retryAfter = Math.ceil((nextUtcMidnightMs() - now) / 1000);
      res.status(429).json({
        error: "Daily IP limit exceeded",
        retryAfter,
        message: `You have reached the daily AI request limit for your IP. Service resets at UTC midnight (in ${Math.ceil(retryAfter / 60)} min).`,
      });
      return;
    }

    // Authoritative DB check — increment and verify
    const ipCount = await incrementIpCounter(date, ip);
    ipDailyCache.set(cacheKey, ipCount);

    if (ipCount > DAILY_PER_IP_LIMIT) {
      const retryAfter = Math.ceil((nextUtcMidnightMs() - now) / 1000);
      res.status(429).json({
        error: "Daily IP limit exceeded",
        retryAfter,
        message: `You have reached the daily AI request limit for your IP. Service resets at UTC midnight (in ${Math.ceil(retryAfter / 60)} min).`,
      });
      return;
    }
  } catch (err) {
    // DB unavailable — fall through; Layer 1 still provides basic protection.
    console.error("[rateLimiter] Per-IP DB check failed:", err);
  }

  // ── Layer 3: global daily circuit-breaker (DB-backed) ────────────────────
  try {
    const now2 = Date.now();

    // Fast path: in-process cache says budget is exhausted until UTC midnight.
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
    console.error("[rateLimiter] DB circuit-breaker check failed:", err);
  }

  // Record the per-IP sliding-window timestamp only after all checks pass
  entry.timestamps.push(now);
  next();
}
