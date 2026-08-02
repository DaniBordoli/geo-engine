export type EventType =
  | "scan_started"
  | "report_viewed"
  | "report_shared"
  | "checkout_clicked"
  | "paid";

export type Attribution = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  referrer?: string | null;
};

// Registra un evento del funnel. Best-effort: nunca tira ni bloquea la request
// (igual que persist). Import dinámico de la capa DB → seguro sin DATABASE_URL.
export async function track(
  type: EventType,
  opts: { scanId?: string; attribution?: Attribution } = {},
): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    const { db } = await import("@/db");
    const { events } = await import("@/db/schema");
    await db.insert(events).values({
      type,
      scanId: opts.scanId ?? null,
      source: opts.attribution?.source ?? null,
      medium: opts.attribution?.medium ?? null,
      campaign: opts.attribution?.campaign ?? null,
      referrer: opts.attribution?.referrer ?? null,
    });
  } catch (err) {
    console.error("track falló (no bloquea)", type, err);
  }
}
