"use server";

import { runScan, type ScanReport } from "@/lib/scan";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ScanActionInput = { domain: string; email: string };
export type ScanActionResult =
  | { ok: true; report: ScanReport }
  | { ok: false; error: string };

export async function runScanAction(input: ScanActionInput): Promise<ScanActionResult> {
  const domain = input.domain?.trim();
  const email = input.email?.trim();

  if (!domain) return { ok: false, error: "Ingresá un dominio." };
  if (!EMAIL_RE.test(email ?? "")) return { ok: false, error: "Email inválido." };

  try {
    // El scan persiste lead + scan + prompts + results si hay DATABASE_URL.
    const report = await runScan({ domain, email });
    return { ok: true, report };
  } catch (err) {
    console.error("scan failed", err);
    return { ok: false, error: "El scan falló. Reintentá en un momento." };
  }
}
