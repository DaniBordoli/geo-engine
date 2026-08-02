"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { buildCheckoutUrl } from "@/lib/billing/lemon";
import { getExistingFixPack } from "@/lib/fixpack/read";
import type { FixPack } from "@/lib/fixpack/types";

// Solo lectura (WEEK2_FIXES P0.3): la generación la dispara el webhook post-pago.
export type FixPackState =
  | { status: "locked"; checkoutUrl: string }
  | { status: "generating" }
  | { status: "ready"; pack: FixPack }
  | { status: "error"; error: string };

export async function getFixPackState(
  scanId: string,
  email?: string,
): Promise<FixPackState> {
  const [scan] = await db.select().from(scans).where(eq(scans.id, scanId));
  if (!scan) return { status: "error", error: "El scan no existe." };

  if (!scan.paid) {
    return { status: "locked", checkoutUrl: buildCheckoutUrl(scanId, email) };
  }

  const pack = await getExistingFixPack(scanId);
  return pack ? { status: "ready", pack } : { status: "generating" };
}

// Resuelve el scan pagado desde el id de orden de Lemon (lo persiste el webhook
// order_created). Es el puente del redirect post-pago /fixpack/resolve?order=…,
// que sólo trae el [order_id] y no el scan_id. Null si el webhook aún no llegó.
export async function resolveScanIdByOrder(orderId: string): Promise<string | null> {
  if (!orderId) return null;
  const [scan] = await db
    .select({ id: scans.id })
    .from(scans)
    .where(eq(scans.orderId, orderId));
  return scan?.id ?? null;
}
