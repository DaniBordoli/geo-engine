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
  prompts: PersistPrompt[];
};

// Escribe un scan completo en Neon: upsert de user (lead), scan, prompts y
// results. Devuelve el id del scan.
export async function persistScan(args: PersistScanArgs): Promise<string> {
  // Lead: upsert por email (email es UNIQUE).
  const [user] = await db
    .insert(users)
    .values({ email: args.email })
    .onConflictDoUpdate({ target: users.email, set: { email: args.email } })
    .returning({ id: users.id });

  const [scan] = await db
    .insert(scans)
    .values({
      userId: user.id,
      domain: args.domain,
      verticalId: args.verticalId,
      competitors: args.competitors,
      status: "done",
    })
    .returning({ id: scans.id });

  if (args.prompts.length === 0) return scan.id;

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

  return scan.id;
}
