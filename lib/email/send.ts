// Email transaccional best-effort vía Resend (fetch directo, sin dependencia nueva).
// No-op sin RESEND_API_KEY — igual que el resto del seam mock↔real. Nunca tira:
// un fallo de email no debe romper el scan ni la generación del fix pack.

const FROM = process.env.EMAIL_FROM || "geo-engine <noreply@geo-engine.app>";

async function send(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return; // sin configurar → no-op
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      console.error("email falló", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("email falló", err);
  }
}

function shell(heading: string, body: string, cta: { label: string; url: string }): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#18181b">
    <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
    <p style="font-size:15px;line-height:1.5;color:#3f3f46;margin:0 0 20px">${body}</p>
    <a href="${cta.url}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:15px">${cta.label}</a>
    <p style="font-size:12px;color:#a1a1aa;margin-top:28px">geo-engine · AI visibility for your store</p>
  </div>`;
}

// Mail 1: el reporte gratis está listo.
export async function sendReportReadyEmail(
  to: string,
  opts: { domain: string; reportUrl: string },
): Promise<void> {
  await send(
    to,
    "Your AI-visibility report is ready",
    shell(
      "Your AI-visibility report is ready",
      `We scanned <b>${opts.domain}</b> and measured how often AI recommends you vs your competitors.`,
      { label: "View your report", url: opts.reportUrl },
    ),
  );
}

// Mail 2: el fix pack pago está listo (cubre también el caso async si tardó).
export async function sendFixPackReadyEmail(
  to: string,
  opts: { domain: string; fixpackUrl: string },
): Promise<void> {
  await send(
    to,
    "Your fix pack is ready",
    shell(
      "Your fix pack is ready",
      `The prioritized fixes for <b>${opts.domain}</b> — citable content, schema and off-site actions — are ready to ship.`,
      { label: "Open your fix pack", url: opts.fixpackUrl },
    ),
  );
}
