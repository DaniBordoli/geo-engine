import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { prompts, results, scans } from "@/db/schema";
import { brandFromDomain } from "@/lib/scan";

// Read-side de un scan persistido: input del generador de fix pack.

export type ScanResultRow = {
  engine: string;
  mentioned: boolean;
  cited: boolean;
  position: number | null;
  sentiment: string | null;
  citedUrls: string[];
};

export type ScanPromptData = {
  text: string;
  archetype: string;
  results: ScanResultRow[];
};

export type ScanData = {
  id: string;
  domain: string;
  brand: string;
  verticalId: string;
  competitors: string[];
  paid: boolean;
  prompts: ScanPromptData[];
};

export async function getScanData(scanId: string): Promise<ScanData | null> {
  const [scan] = await db.select().from(scans).where(eq(scans.id, scanId));
  if (!scan) return null;

  const promptRows = await db.select().from(prompts).where(eq(prompts.scanId, scanId));
  const promptIds = promptRows.map((p) => p.id);

  const resultRows = promptIds.length
    ? await db.select().from(results).where(inArray(results.promptId, promptIds))
    : [];

  const byPrompt = new Map<string, ScanResultRow[]>();
  for (const r of resultRows) {
    const row: ScanResultRow = {
      engine: r.engine,
      mentioned: r.mentioned,
      cited: r.cited,
      position: r.position,
      sentiment: r.sentiment,
      citedUrls: r.citedUrls,
    };
    const list = byPrompt.get(r.promptId);
    if (list) list.push(row);
    else byPrompt.set(r.promptId, [row]);
  }

  return {
    id: scan.id,
    domain: scan.domain,
    brand: brandFromDomain(scan.domain),
    verticalId: scan.verticalId,
    competitors: scan.competitors,
    paid: scan.paid,
    prompts: promptRows.map((p) => ({
      text: p.text,
      archetype: p.archetype,
      results: byPrompt.get(p.id) ?? [],
    })),
  };
}
