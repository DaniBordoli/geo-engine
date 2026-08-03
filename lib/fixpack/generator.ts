import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fixpacks, scans, users } from "@/db/schema";
import { getScanData } from "@/lib/scan-read";
import { appBaseUrl } from "@/lib/app-url";
import { sendFixPackReadyEmail } from "@/lib/email/send";
import { mapLimit } from "@/lib/util/async";
import { getVertical } from "@/lib/verticals";
import { ecommerce } from "@/lib/verticals/ecommerce";
import { diagnoseCause } from "./gap-cause";
import { generateContent } from "./content";
import { fetchSiteText } from "./crawl";
import { generateSchema } from "./schema";
import { generateOffsite } from "./offsite";
import { prioritize, scorePriority } from "./prioritize";
import { getExistingFixPack } from "./read";
import type { FixItem, FixPack, Gap } from "./types";

// Default 3 (no 6): la generación tiene que entrar en el maxDuration de Hobby.
const MAX_GAPS = Number(process.env.FIXPACK_MAX_GAPS ?? 3);
const GAP_CONCURRENCY = 3;

// Extrae los gaps: prompts donde la marca no aparece en ninguna respuesta.
function gapsFrom(scan: Awaited<ReturnType<typeof getScanData>>): Gap[] {
  if (!scan) return [];
  const seen = new Set<string>();
  const gaps: Gap[] = [];
  for (const p of scan.prompts) {
    if (p.results.length === 0 || p.results.some((r) => r.mentioned)) continue;
    if (seen.has(p.text)) continue;
    seen.add(p.text);
    const winningUrls = [...new Set(p.results.flatMap((r) => r.citedUrls))];
    gaps.push({ prompt: p.text, competitors: scan.competitors, winningUrls });
  }
  return gaps;
}

// Orquesta el fix pack completo (full auto) para un scan pago y lo persiste.
export async function generateFixPack(scanId: string): Promise<FixPack> {
  // Idempotencia (P0.2): si ya existe, no re-generar (evita ~30 llamadas LLM
  // y filas duplicadas al recargar / re-disparar el webhook).
  const already = await getExistingFixPack(scanId);
  if (already) return already;

  const scan = await getScanData(scanId);
  if (!scan) throw new Error(`scan ${scanId} no existe`);

  const vertical = getVertical(scan.verticalId) ?? ecommerce;
  const gaps = gapsFrom(scan).slice(0, MAX_GAPS);

  // Aterrizar el contenido en datos reales: crawleamos la homepage UNA vez.
  const siteText = await fetchSiteText(scan.domain);

  const perGap = await mapLimit(gaps, GAP_CONCURRENCY, async (gap) => {
    const cause = await diagnoseCause(gap, scan.brand, vertical);
    const [content, schema, offsite] = await Promise.all([
      generateContent(gap, cause, scan.brand, vertical, siteText),
      generateSchema(gap, scan.brand),
      generateOffsite(gap, scan.brand),
    ]);
    const n = gap.competitors.length;
    const items: FixItem[] = [
      {
        category: "citable-content",
        gap: gap.prompt,
        cause,
        title: content.title,
        body: content.body,
        priority: scorePriority("citable-content", n),
      },
      {
        category: "schema-markup",
        gap: gap.prompt,
        cause,
        title: schema.valid
          ? `JSON-LD para "${gap.prompt}"`
          : `⚠️ Revisar — JSON-LD para "${gap.prompt}"`,
        body: "```json\n" + schema.jsonld + "\n```",
        priority: scorePriority("schema-markup", n),
      },
      {
        category: "off-site-action",
        gap: gap.prompt,
        cause,
        title: `Acciones off-site para "${gap.prompt}"`,
        body: offsite,
        priority: scorePriority("off-site-action", n),
      },
    ];
    return items;
  });

  const items = prioritize(perGap.flat());
  const pack: FixPack = {
    scanId,
    items,
    generatedAt: new Date().toISOString(),
  };

  // onConflictDoNothing + re-lectura: si una generación concurrente ganó la
  // carrera (unique en scan_id), devolvemos la persistida, no la nuestra.
  await db.insert(fixpacks).values({ scanId, items }).onConflictDoNothing();

  // Mail "tu fix pack está listo" (best-effort; no-op sin RESEND_API_KEY). Cubre
  // el caso async: aunque la generación haya tardado, al comprador le llega el link.
  try {
    const base = appBaseUrl();
    if (base) {
      const [row] = await db
        .select({ email: users.email })
        .from(scans)
        .innerJoin(users, eq(users.id, scans.userId))
        .where(eq(scans.id, scanId));
      if (row?.email) {
        await sendFixPackReadyEmail(row.email, {
          domain: scan.domain,
          fixpackUrl: `${base}/fixpack/${scanId}`,
        });
      }
    }
  } catch (err) {
    console.error("email fix pack listo falló (no rompe)", err);
  }

  return (await getExistingFixPack(scanId)) ?? pack;
}
