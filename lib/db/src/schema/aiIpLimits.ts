import { pgTable, text, integer, primaryKey } from "drizzle-orm/pg-core";

/**
 * Per-IP AI call counter: one row per (UTC date, IP address).
 * Incremented atomically alongside the global budget table.
 * Ensures no single IP can exhaust the shared daily budget,
 * even across server restarts (in-memory sliding window resets,
 * this persists).
 */
export const aiIpLimitsTable = pgTable(
  "ai_ip_limits",
  {
    date: text("date").notNull(), // "YYYY-MM-DD" UTC
    ip: text("ip").notNull(),
    callCount: integer("call_count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.date, t.ip] })]
);

export type AiIpLimit = typeof aiIpLimitsTable.$inferSelect;
