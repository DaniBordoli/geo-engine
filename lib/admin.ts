import { neon } from "@neondatabase/serverless";

// Agregados del funnel para la vista /admin (solo lectura). Usa el cliente neon
// directo (dep existente) por lo mecánico de los group-by. Null si no hay DB.
export type AdminData = {
  scansByDay: { day: string; count: number }[];
  funnel: { type: string; count: number }[];
  bySource: { source: string; scans: number; paid: number }[];
};

export async function getAdminData(): Promise<AdminData | null> {
  if (!process.env.DATABASE_URL) return null;
  const sql = neon(process.env.DATABASE_URL);

  const scansByDay = (await sql`
    select to_char(created_at, 'YYYY-MM-DD') as day, count(*)::int as count
    from events
    where type = 'scan_started' and created_at > now() - interval '30 days'
    group by day
    order by day
  `) as { day: string; count: number }[];

  const funnel = (await sql`
    select type, count(*)::int as count
    from events
    where created_at > now() - interval '30 days'
    group by type
  `) as { type: string; count: number }[];

  // Scans y pagos por fuente ('directo' = sin atribución) → tasa scan→paid.
  const bySource = (await sql`
    select
      coalesce(s.source, 'directo') as source,
      count(distinct s.id)::int as scans,
      count(distinct case when e.type = 'paid' then e.id end)::int as paid
    from scans s
    left join events e on e.scan_id = s.id
    group by coalesce(s.source, 'directo')
    order by paid desc, scans desc
  ` as unknown as { source: string; scans: number; paid: number }[]);

  return { scansByDay, funnel, bySource };
}
