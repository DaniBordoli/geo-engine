import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Data model mínimo — ver PROPOSAL.md § "Data model (mínimo)".

export const planEnum = pgEnum("plan", ["free", "paid"]);
export const scanStatusEnum = pgEnum("scan_status", [
  "pending",
  "running",
  "done",
  "error",
]);
export const engineEnum = pgEnum("engine", [
  "openai",
  "perplexity",
  "gemini",
  "anthropic",
]);
export const sentimentEnum = pgEnum("sentiment", [
  "positive",
  "neutral",
  "negative",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  plan: planEnum("plan").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  competitors: text("competitors").array().notNull().default([]),
  verticalId: text("vertical_id").notNull(),
  status: scanStatusEnum("status").notNull().default("pending"),
  /** Entitlement por-scan: el pago único desbloquea el fix pack de ESTE scan. */
  paid: boolean("paid").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  scanId: uuid("scan_id")
    .notNull()
    .references(() => scans.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  archetype: text("archetype").notNull(),
});

export const results = pgTable("results", {
  id: uuid("id").primaryKey().defaultRandom(),
  promptId: uuid("prompt_id")
    .notNull()
    .references(() => prompts.id, { onDelete: "cascade" }),
  engine: engineEnum("engine").notNull(),
  mentioned: boolean("mentioned").notNull().default(false),
  cited: boolean("cited").notNull().default(false),
  /** Posición de la marca en la respuesta (1-based); null si no aparece. */
  position: integer("position"),
  sentiment: sentimentEnum("sentiment"),
  citedUrls: text("cited_urls").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fixpacks = pgTable("fixpacks", {
  id: uuid("id").primaryKey().defaultRandom(),
  scanId: uuid("scan_id")
    .notNull()
    .references(() => scans.id, { onDelete: "cascade" }),
  items: jsonb("items").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Tipos inferidos para uso en la app.
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;
export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;
export type Result = typeof results.$inferSelect;
export type NewResult = typeof results.$inferInsert;
export type Fixpack = typeof fixpacks.$inferSelect;
export type NewFixpack = typeof fixpacks.$inferInsert;
