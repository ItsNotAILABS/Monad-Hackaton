import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const componentDataSchema = z.object({
  id: z.string(),
  type: z.enum([
    "wallet-connect",
    "token-balance",
    "nft-gallery",
    "transaction-feed",
    "token-swap",
    "price-chart",
    "dao-vote",
    "heading",
    "paragraph",
    "button",
    "image",
    "divider",
    "hero-section",
    "card",
    "stats-row",
  ]),
  props: z.record(z.string(), z.unknown()),
  order: z.number().int(),
});

export type ComponentData = z.infer<typeof componentDataSchema>;

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  templateId: integer("template_id"),
  components: jsonb("components").notNull().$type<ComponentData[]>().default([]),
  theme: jsonb("theme").notNull().$type<Record<string, string>>().default({}),
  status: text("status").notNull().default("draft"), // draft | published
  publishedSlug: text("published_slug"),
  contractAddress: text("contract_address"),
  deployTxHash: text("deploy_tx_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
