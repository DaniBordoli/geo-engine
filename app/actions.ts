"use server";

import { runScan, type Attribution, type ScanReport } from "@/lib/scan";
import { getScanIdByReportToken } from "@/lib/report-read";
import { track } from "@/lib/analytics/events";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ScanActionInput = {
  domain: string;
  email: string;
  /** Overrides opcionales de la detección de vertical (Auto por default). */
  lang?: string;
  category?: string;
  attribution?: Attribution;
};
export type ScanActionResult =
  | { ok: true; report: ScanReport }
  | { ok: false; error: string };

export async function runScanAction(input: ScanActionInput): Promise<ScanActionResult> {
  const domain = input.domain?.trim();
  const email = input.email?.trim();

  if (!domain) return { ok: false, error: "Enter a domain." };
  if (!EMAIL_RE.test(email ?? "")) return { ok: false, error: "Invalid email." };

  try {
    // El scan persiste lead + scan + prompts + results si hay DATABASE_URL.
    const report = await runScan({
      domain,
      email,
      lang: input.lang,
      category: input.category,
      attribution: input.attribution,
    });
    // Funnel: scan_started linkeado al scan + su atribución.
    await track("scan_started", { scanId: report.scanId, attribution: input.attribution });
    return { ok: true, report };
  } catch (err) {
    console.error("scan failed", err);
    return { ok: false, error: "The scan failed. Try again in a moment." };
  }
}

// report_shared: lo dispara el botón de compartir (client) vía este action.
export async function trackShareAction(reportToken: string): Promise<void> {
  const scanId = (await getScanIdByReportToken(reportToken)) ?? undefined;
  await track("report_shared", { scanId });
}
