// TEMPORAL — verificación de env vars en prod. NO expone secretos (solo presencia).
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM ?? null, // no es secreto
    QSTASH_TOKEN: !!process.env.QSTASH_TOKEN,
    QSTASH_URL: process.env.QSTASH_URL ?? null, // no es secreto
    FIXPACK_QUEUE_SECRET: !!process.env.FIXPACK_QUEUE_SECRET,
  });
}
