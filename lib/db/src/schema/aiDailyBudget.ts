import { pgTable, text, integer } from "drizzle-orm/pg-core";

/**
 * Global AI circuit-breaker: one row per UTC calendar date.
 * Incremented atomically on every AI request; the server
 * refuses new calls once call_count >= daily threshold.
 * Survives server restarts — state lives in the database.
 */
export const aiDailyBudgetTable = pgTable("ai_daily_budget", {
  date: text("date").primaryKey(), // "YYYY-MM-DD" UTC
  callCount: integer("call_count").notNull().default(0),
});

export type AiDailyBudget = typeof aiDailyBudgetTable.$inferSelect;
