// TEMPORAL — verificación del reuso de prompts por dominio. NO commitear. Borrar.
import { NextResponse } from "next/server";
import { runScan } from "@/lib/scan";

export const maxDuration = 300;

export async function GET(req: Request) {
  const domain = new URL(req.url).searchParams.get("domain");
  if (!domain) return NextResponse.json({ error: "domain?" }, { status: 400 });
  const report = await runScan({
    domain,
    email: "reusetest@geo-engine.internal",
    attribution: { source: "reusetest" },
  });
  return NextResponse.json({
    scanId: report.scanId,
    category: report.category,
    lang: report.lang,
    promptCount: report.promptCount,
    samplePrompts: report.lostPrompts.map((lp) => lp.prompt),
  });
}
