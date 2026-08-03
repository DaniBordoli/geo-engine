import { generateFixPack } from "./generator";

// URL pública de la app (Vercel la expone sola en prod).
function appUrl(): string | null {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const v = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return v ? `https://${v}` : null;
}

// Encola la generación del fix pack, o la corre inline si no hay cola configurada.
//
// SKELETON: con QSTASH_TOKEN + FIXPACK_QUEUE_SECRET seteados, publica a QStash
// (Upstash) apuntando a /api/fixpack/generate → la generación corre en una
// invocación separada, con su propio maxDuration (se puede volver a Opus / más
// gaps sin chocar los 60s del webhook). Sin eso, corre INLINE (comportamiento
// actual, ya verificado). El endpoint es idempotente, así que los reintentos de
// QStash no re-generan.
export async function enqueueGeneration(scanId: string): Promise<void> {
  const token = process.env.QSTASH_TOKEN;
  const secret = process.env.FIXPACK_QUEUE_SECRET;
  const base = appUrl();
  // El endpoint depende de la región de la cuenta (EU: qstash-eu-central-1…,
  // US: qstash-us-east-1…). Se toma de QSTASH_URL (consola de Upstash); default
  // al histórico global por compatibilidad.
  const qstashUrl = (process.env.QSTASH_URL || "https://qstash.upstash.io").replace(/\/+$/, "");

  if (token && secret && base) {
    try {
      const res = await fetch(
        `${qstashUrl}/v2/publish/${base}/api/fixpack/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            // Se reenvía como header a nuestro endpoint (auth del worker).
            "Upstash-Forward-x-generate-secret": secret,
          },
          body: JSON.stringify({ scanId }),
        },
      );
      if (res.ok) return;
      console.error("QStash publish falló, genero inline", res.status);
    } catch (err) {
      console.error("QStash error, genero inline", err);
    }
  }

  // Fallback: generación inline (idempotente).
  await generateFixPack(scanId);
}
