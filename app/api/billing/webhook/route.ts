import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { verifyWebhookSignature, type LemonWebhook } from "@/lib/billing/lemon";
import { enqueueGeneration } from "@/lib/fixpack/queue";
import { track } from "@/lib/analytics/events";

// La generación del fix pack corre en after() (post-respuesta) para no bloquear
// el 200 del webhook. maxDuration da margen a esa generación en serverless.
export const maxDuration = 60;

// Webhook de Lemon Squeezy. Verifica la firma sobre el body CRUDO (no parsear
// antes de verificar), marca el scan como pago, y dispara la generación del fix
// pack (idempotente) fuera del camino de respuesta.
export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return new Response("invalid signature", { status: 401 });
  }

  const payload = JSON.parse(raw) as LemonWebhook;
  const event = payload.meta?.event_name;
  const scanId = payload.meta?.custom_data?.scan_id;
  const orderId = payload.data?.id;

  if (!scanId) return new Response("no scan_id", { status: 200 });

  if (event === "order_created") {
    // orderId permite resolver este scan desde el redirect post-pago de Lemon.
    await db.update(scans).set({ paid: true, orderId }).where(eq(scans.id, scanId));
    await track("paid", { scanId });
    // Genera el fix pack post-respuesta: encola (cola configurada) o inline. En
    // ambos casos idempotente. El usuario, al volver, sólo lee la fila de la DB.
    after(async () => {
      try {
        await enqueueGeneration(scanId);
      } catch (err) {
        console.error("generación post-pago falló", scanId, err);
      }
    });
  } else if (event === "order_refunded") {
    await db.update(scans).set({ paid: false }).where(eq(scans.id, scanId));
  }

  return new Response("ok", { status: 200 });
}
