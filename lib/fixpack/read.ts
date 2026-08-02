import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { fixpacks } from "@/db/schema";
import type { FixItem, FixPack } from "./types";

// Devuelve el fix pack persistido de un scan, si ya se generó (idempotencia).
export async function getExistingFixPack(scanId: string): Promise<FixPack | null> {
  const [row] = await db
    .select()
    .from(fixpacks)
    .where(eq(fixpacks.scanId, scanId))
    .orderBy(desc(fixpacks.generatedAt))
    .limit(1);
  if (!row) return null;
  return {
    scanId: row.scanId,
    items: row.items as FixItem[],
    generatedAt: row.generatedAt.toISOString(),
  };
}
