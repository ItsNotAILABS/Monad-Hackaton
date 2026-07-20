import { pgTable, serial, text, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable, workspacesTable } from "./accounts";

export const componentDataSchema = z.object({
  id: z.string(),
  type: z.enum([
    "wallet-connect", "token-balance", "nft-gallery", "transaction-feed",
    "token-swap", "