// TEMPORAL — verificación del reuso de prompts (con override). NO commitear. Borrar.
import { NextResponse } from "next/server";
import { runScan } from "@/lib/scan";

export const maxDuration = 300;

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const domain = p.get("domain");
  if (!domain) return NextResponse.json({ error: "domain?" }, { status: 400 });
  const report = await runScan({
    domain,
    email: "reusetest@geo-engine.internal",
    lang: p.get("lang") ?? undefined,
    category: p.get("category") ?? undefined,
    attribution: { source: "reusetest" },
  });
  return NextResponse.json({
    scanId: report.scanId,
    category: report.category,
    lang: report.lang,
    promptCount: report.promptCount,
  });
}
