"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { buildCheckoutUrl } from "@/lib/billing/lemon";
import { generateFixPack } from "@/lib/fixpack/generator";
import type { FixPack } from "@/lib/fixpack/types";

// Gate de pago (entitlement por-scan): si el scan no está pago, devuelve la URL
// de checkout; si está pago, genera y devuelve el fix pack.
export type FixPackActionResult =
  | { ok: true; pack: FixPack }
  | { ok: false; locked: true; checkoutUrl: string }
  | { ok: false; locked: false; error: string };

export async function getFixPackAction(
  scanId: string,
  email?: string,
): Promise<FixPackActionResult> {
  const [scan] = await db.select().from(scans).where(eq(scans.id, scanId));
  if (!scan) return { ok: false, locked: false, error: "El scan no existe." };

  if (!scan.paid) {
    return { ok: false, locked: true, checkoutUrl: buildCheckoutUrl(scanId, email) };
  }

  try {
    const pack = await generateFixPack(scanId);
    return { ok: true, pack };
  } catch (err) {
    console.error("fix pack falló", err);
    return { ok: false, locked: false, error: "No se pudo generar el fix pack." };
  }
}
