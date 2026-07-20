import { boolean, integer, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  githubId: text("github_id").notNull().unique(),
  login: text("login").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("users_login_idx").on(table.login)]);

export const workspacesTable = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerUserId: integer("owner_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").