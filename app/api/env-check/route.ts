// TEMPORAL — verificación env + prueba de cola en prod. NO expone secretos. Borrar.
import { NextResponse } from "next/server";
import { enqueueGeneration } from "@/lib/fixpack/queue";

export async function GET(req: Request) {
  const enqueue = new URL(req.url).searchParams.get("enqueue");
  if (enqueue) {
    // Publica a QStash (si está configurado) → worker /api/fixpack/generate.
    // Devuelve rápido; el fixpack lo escribe el worker async.
    await enqueueGeneration(enqueue);
    return NextResponse.json({ enqueued: enqueue });
  }
  return NextResponse.json({
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM ?? null,
    QSTASH_TOKEN: !!process.env.QSTASH_TOKEN,
    QSTASH_URL: process.env.QSTASH_URL ?? null,
    FIXPACK_QUEUE_SECRET: !!process.env.FIXPACK_QUEUE_SECRET,
  });
}
