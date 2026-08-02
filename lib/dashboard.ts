import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { scans, users } from "@/db/schema";

// Historial por dominio de un usuario (identificado por token opaco), para el
// dashboard: tendencia de share-of-voice y citación a lo largo de los re-scans.

export type ScanPoint = {
  id: string;
  createdAt: string;
  shareOfVoice: number | null;
  citationRate: number | null;
  invisibleRate: number | null;
  paid: boolean;
};

export type DomainHistory = {
  domain: string;
  /** Scans ascendentes por fecha (el último es el más reciente). */
  points: ScanPoint[];
};

export type Dashboard = {
  email: string;
  domains: DomainHistory[];
};

export async function getDashboard(token: string): Promise<Dashboard | null> {
  const [user] = await db.select().from(users).where(eq(users.dashboardToken, token));
  if (!user) return null;

  const rows = await db
    .select()
    .from(scans)
    .where(eq(scans.userId, user.id))
    .orderBy(asc(scans.createdAt));

  const byDomain = new Map<string, ScanPoint[]>();
  for (const s of rows) {
    const point: ScanPoint = {
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      shareOfVoice: s.shareOfVoice,
      citationRate: s.citationRate,
      invisibleRate: s.invisibleRate,
      paid: s.paid,
    };
    const list = byDomain.get(s.domain);
    if (list) list.push(point);
    else byDomain.set(s.domain, [point]);
  }

  return {
    email: user.email,
    domains: [...byDomain.entries()].map(([domain, points]) => ({ domain, points })),
  };
}
