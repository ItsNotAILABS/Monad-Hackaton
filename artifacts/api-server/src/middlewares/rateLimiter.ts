/**
 * In-memory sliding-window rate limiter for AI endpoints.
 * 40 requests per IP per 15-minute window.
 * No external dependencies — suitable for hackathon demo use.
 */
import { Request, Response, NextFunction } from "express";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 40;

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Prune old IPs every 15 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
    if (entry.timestamps.length === 0) store.delete(ip);
  }
}, WINDOW_MS);

export function aiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Use req.ip — Express resolves this against the trust proxy setting in app.ts,
  // so it returns the real client IP from the trusted proxy chain rather than
  // a raw (spoofable) X-Forwarded-For header value.
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";

  const now = Date.now();
  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  // Slide the window — drop timestamps older than WINDOW_MS
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    // Compute how many seconds until the oldest timestamp ages out
    const oldestTs = entry.timestamps[0]!;
    const retryAfter = Math.ceil((oldestTs + WINDOW_MS - now) / 1000);
    res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter,
      message: `Too many AI requests. Try again in ${retryAfter}s.`,
    });
    return;
  }

  entry.timestamps.push(now);
  next();
}
