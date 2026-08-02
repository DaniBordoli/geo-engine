import { db } from "@/db";
import { prompts, results, scans, users } from "@/db/schema";
import type { ResponseAnalysis } from "@/lib/agents/types";
import type { EngineId } from "@/lib/engines/types";

export type PersistPrompt = {
  text: string;
  archetype: string;
  results: { engineId: EngineId; analysis: ResponseAnalysis }[];
};

export type PersistScanArgs = {
  email: string;
  domain: string;
  verticalId: string;
  competitors: string[];
  /** Resumen de score (0–1) para la tendencia del dashboard. */
  score: { shareOfVoice: number; citationRate: number; invisibleRate: number };
  prompts: PersistPrompt[];
};

export type PersistResult = { scanId: string; dashboardToken: string };

// Escribe un scan completo en Neon: upsert de user (lead), scan (con score),
// prompts y results. Devuelve el id del scan y el token de dashboard del user.
export async function persistScan(args: PersistScanArgs): Promise<PersistResult> {
  // Lead: upsert por email (email es UNIQUE).
  const [user] = await db
    .insert(users)
    .values({ email: args.email })
    .onConflictDoUpdate({ target: users.email, set: { email: args.email } })
    .returning({ id: users.id, dashboardToken: users.dashboardToken });

  const [scan] = await db
    .insert(scans)
    .values({
      userId: user.id,
      domain: args.domain,
      verticalId: args.verticalId,
      competitors: args.competitors,
      status: "done",
      shareOfVoice: args.score.shareOfVoice,
      citationRate: args.score.citationRate,
      invisibleRate: args.score.invisibleRate,
    })
    .returning({ id: scans.id });

  const out: PersistResult = { scanId: scan.id, dashboardToken: user.dashboardToken };
  if (args.prompts.length === 0) return out;

  // Prompts en batch; Postgres devuelve los ids en orden de inserción.
  const insertedPrompts = await db
    .insert(prompts)
    .values(
      args.prompts.map((p) => ({
        scanId: scan.id,
        text: p.text,
        archetype: p.archetype,
      })),
    )
    .returning({ id: prompts.id });

  const resultRows = args.prompts.flatMap((p, i) =>
    p.results.map((r) => ({
      promptId: insertedPrompts[i].id,
      engine: r.engineId,
      mentioned: r.analysis.mentioned,
      cited: r.analysis.cited,
      position: r.analysis.position,
      sentiment: r.analysis.sentiment,
      citedUrls: r.analysis.citedUrls,
    })),
  );

  if (resultRows.length > 0) await db.insert(results).values(resultRows);

  return out;
}
