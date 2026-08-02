import crypto from "node:crypto";

// Integración con Lemon Squeezy (pago único, checkout hosted).
// No usa API key: redirigimos al checkout hosted con el scan_id como custom
// data, y confirmamos el pago verificando la firma del webhook.

// Arma la URL de checkout con el scan_id (custom data) y email prellenado.
// El webhook order_created devuelve ese scan_id → marcamos scans.paid.
export function buildCheckoutUrl(scanId: string, email?: string): string {
  const base = process.env.LEMONSQUEEZY_CHECKOUT_URL;
  if (!base) throw new Error("LEMONSQUEEZY_CHECKOUT_URL no está definida");
  const url = new URL(base);
  url.searchParams.set("checkout[custom][scan_id]", scanId);
  if (email) url.searchParams.set("checkout[email]", email);
  // El redirect post-pago NO se puede fijar por query param en el checkout hosted
  // (sólo vía el API create-checkout, que evitamos). Se configura a nivel producto
  // en Lemon → /fixpack/resolve?order=[order_id], y ahí resolvemos el scan.
  return url.toString();
}

// Verifica la firma HMAC-SHA256 del webhook (header X-Signature) contra el body
// crudo. Comparación en tiempo constante.
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET no está definida");
  if (!signature) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Tipos mínimos del payload de webhook que consumimos.
export type LemonWebhook = {
  meta: {
    event_name: string;
    custom_data?: { scan_id?: string };
  };
  // data.id = id de la orden; lo persistimos para resolver el scan desde el
  // redirect post-pago (que sólo tiene el [order_id], no el scan_id).
  data?: { id?: string };
};
