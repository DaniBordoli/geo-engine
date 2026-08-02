import crypto from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { buildCheckoutUrl, verifyWebhookSignature } from "./lemon";

const SECRET = "testsecret";

beforeAll(() => {
  process.env.LEMONSQUEEZY_CHECKOUT_URL =
    "https://citeable.lemonsqueezy.com/checkout/buy/UUID";
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
});

describe("buildCheckoutUrl", () => {
  it("adjunta el scan_id como custom data (lo devuelve el webhook)", () => {
    // Sin el scan_id en el checkout, el webhook no sabría qué scan desbloquear.
    const url = buildCheckoutUrl("scan-123", "a@b.com");
    expect(url).toContain("scan_id");
    expect(url).toContain("scan-123");
    expect(url).toContain("a%40b.com");
  });
});

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ meta: { event_name: "order_created" } });

  it("acepta una firma HMAC-SHA256 válida", () => {
    const good = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
    expect(verifyWebhookSignature(body, good)).toBe(true);
  });

  it("rechaza firma inválida y ausente (no confiar en un pago no verificado)", () => {
    // El gate de pago depende de esto: una firma falsa NO debe desbloquear.
    expect(verifyWebhookSignature(body, "deadbeef")).toBe(false);
    expect(verifyWebhookSignature(body, null)).toBe(false);
  });

  it("rechaza si el body fue alterado tras firmar", () => {
    const good = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
    const tampered = body.replace("order_created", "order_refunded");
    expect(verifyWebhookSignature(tampered, good)).toBe(false);
  });
});
