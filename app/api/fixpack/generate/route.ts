import { generateFixPack } from "@/lib/fixpack/generator";

// Worker de generación (lo llama la cola / QStash). Fuera del webhook → su propio
// presupuesto de tiempo. 300s aplica en Vercel Pro; en Hobby igual capa a 60.
export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.FIXPACK_QUEUE_SECRET;
  if (!secret || req.headers.get("x-generate-secret") !== secret) {
    return new Response("unauthorized", { status: 401 });
  }

  let scanId: string | undefined;
  try {
    scanId = (await req.json())?.scanId;
  } catch {
    return new Response("bad body", { status: 400 });
  }
  if (!scanId) return new Response("no scanId", { status: 400 });

  try {
    await generateFixPack(scanId); // idempotente → reintentos de QStash no re-generan
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("generación (queue) falló", scanId, err);
    return new Response("error", { status: 500 }); // 5xx → QStash reintenta
  }
}
