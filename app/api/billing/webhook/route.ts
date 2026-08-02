import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { verifyWebhookSignature, type LemonWebhook } from "@/lib/billing/lemon";

// Webhook de Lemon Squeezy. Verifica la firma sobre el body CRUDO (no parsear
// antes de verificar), y marca el scan como pago (entitlement por-scan).
export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifyWebhookSignature(raw, signature)) {
    return new Response("invalid signature", { status: 401 });
  }

  const payload = JSON.parse(raw) as LemonWebhook;
  const event = payload.meta?.event_name;
  const scanId = payload.meta?.custom_data?.scan_id;

  // Sin scan_id no hay nada que desbloquear; 200 para que Lemon no reintente.
  if (!scanId) return new Response("no scan_id", { status: 200 });

  if (event === "order_created") {
    await db.update(scans).set({ paid: true }).where(eq(scans.id, scanId));
  } else if (event === "order_refunded") {
    await db.update(scans).set({ paid: false }).where(eq(scans.id, scanId));
  }

  return new Response("ok", { status: 200 });
}
