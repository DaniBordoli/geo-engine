import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { brandFromDomain, type ScanReport } from "@/lib/scan";

// Lo que se persiste para renderizar el reporte público sin recomputar. Es el
// subconjunto de ScanReport que consume report-view (el "cachetazo").
export type ReportSnapshot = Pick<
  ScanReport,
  "mock" | "promptCount" | "engineIds" | "score" | "lostPrompts" | "failedJobs"
>;

// Reporte público read-only por token opaco (/r/[token]). Null si no existe o
// no tiene snapshot (scan viejo).
export async function getReportByToken(token: string): Promise<ScanReport | null> {
  const [scan] = await db.select().from(scans).where(eq(scans.reportToken, token));
  if (!scan || !scan.reportSnapshot) return null;

  const snap = scan.reportSnapshot as ReportSnapshot;
  return {
    domain: scan.domain,
    brand: brandFromDomain(scan.domain),
    mock: snap.mock,
    generatedAt: scan.createdAt.toISOString(),
    promptCount: snap.promptCount,
    engineIds: snap.engineIds,
    score: snap.score,
    lostPrompts: snap.lostPrompts,
    failedJobs: snap.failedJobs,
    // Nota: NO exponer scanId acá (es el id del fix pack; el reporte público usa
    // reportToken justamente para no filtrarlo).
  };
}

// Solo el id interno del scan (para eventos server-side), NO para el cliente.
export async function getScanIdByReportToken(token: string): Promise<string | null> {
  const [scan] = await db
    .select({ id: scans.id })
    .from(scans)
    .where(eq(scans.reportToken, token));
  return scan?.id ?? null;
}
