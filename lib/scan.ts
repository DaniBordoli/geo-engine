import { getAnalyzer } from "@/lib/agents/analyzer";
import { getPromptGenerator } from "@/lib/agents/prompt-generator";
import { getEngines } from "@/lib/engines";
import type { EngineResponse } from "@/lib/engines/types";
import { scoreScan } from "@/lib/scoring";
import type { ScanScore } from "@/lib/scoring/types";
import { mapLimit } from "@/lib/util/async";
import { withRetry } from "@/lib/util/retry";
import { getVertical } from "@/lib/verticals";
import { ecommerce } from "@/lib/verticals/ecommerce";

// Free tier acotado (P2.1): ~40 prompts × engines dentro de un server action
// puede pasarse del timeout serverless. Configurable por env.
const MAX_PROMPTS = Number(process.env.SCAN_MAX_PROMPTS ?? 15);
const ENGINE_CONCURRENCY = 5;

export type Attribution = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  referrer?: string | null;
};

export type ScanInput = {
  domain: string;
  email?: string;
  verticalId?: string;
  attribution?: Attribution;
};

export type LostPrompt = { prompt: string; engine: string };

export type ScanReport = {
  domain: string;
  brand: string;
  /** true = datos simulados (sin API keys). */
  mock: boolean;
  generatedAt: string;
  promptCount: number;
  engineIds: string[];
  score: ScanScore;
  /** Ejemplos de prompts donde la marca es invisible (para el reporte). */
  lostPrompts: LostPrompt[];
  /** Jobs (prompt × engine) que fallaron tras los reintentos → reporte parcial. */
  failedJobs: number;
  /** Id del scan si se persistió en la DB (undefined si corrió en memoria). */
  scanId?: string;
  /** Token del usuario para el link al dashboard (si se persistió). */
  dashboardToken?: string;
  /** Token del reporte público compartible /r/[token] (si se persistió). */
  reportToken?: string;
};

// Deriva el token de marca desde el dominio: "https://www.nike.com/x" → "nike".
export function brandFromDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split(".")[0]
    .toLowerCase();
}

export async function runScan(input: ScanInput): Promise<ScanReport> {
  const brand = brandFromDomain(input.domain);
  const vertical = (input.verticalId && getVertical(input.verticalId)) || ecommerce;

  const generator = getPromptGenerator();
  const analyzer = getAnalyzer();
  const { engines, mock } = getEngines();

  const prompts = (
    await withRetry(() => generator.generate(vertical, brand))
  ).slice(0, MAX_PROMPTS);

  // Producto cartesiano prompt × engine, con índice del prompt para reagrupar.
  const jobs = prompts.flatMap((prompt, pi) =>
    engines.map((engine) => ({ pi, prompt, engine })),
  );

  // Fase 1 — engines, con retry y degradación con gracia: un job que falla tras
  // los reintentos se descarta (reporte parcial) en vez de tumbar el scan.
  const engineResults = await mapLimit(jobs, ENGINE_CONCURRENCY, async (job) => {
    try {
      const response = await withRetry(() =>
        job.engine.run({ prompt: job.prompt.text, brand }),
      );
      return { pi: job.pi, promptText: job.prompt.text, engineId: job.engine.id, response };
    } catch (err) {
      console.error(`engine ${job.engine.id} falló: "${job.prompt.text}"`, err);
      return null;
    }
  });
  const okJobs = engineResults.filter((r): r is NonNullable<typeof r> => r !== null);
  const failedJobs = engineResults.length - okJobs.length;

  // Fase 2 — análisis en batch (menos llamadas al LLM). Nunca tira: degrada.
  const responses: EngineResponse[] = okJobs.map((r) => r.response);
  const analyses = await analyzer.analyzeMany(responses, brand);
  const jobResults = okJobs.map((r, i) => ({
    pi: r.pi,
    promptText: r.promptText,
    engineId: r.engineId,
    analysis: analyses[i],
  }));

  const score = scoreScan(analyses);

  const lostPrompts: LostPrompt[] = jobResults
    .filter((r) => !r.analysis.mentioned)
    .slice(0, 5)
    .map((r) => ({ prompt: r.promptText, engine: r.engineId }));

  // Persistencia (best-effort): solo con DB configurada y email presente.
  // Un fallo al persistir no debe tumbar el reporte (el reporte es el producto).
  let scanId: string | undefined;
  let dashboardToken: string | undefined;
  let reportToken: string | undefined;
  if (process.env.DATABASE_URL && input.email) {
    try {
      const { persistScan } = await import("@/lib/persist");
      const persisted = await persistScan({
        email: input.email,
        domain: input.domain,
        verticalId: vertical.id,
        competitors: score.leaderboard.map((c) => c.name),
        score: {
          shareOfVoice: score.shareOfVoice,
          citationRate: score.citationRate,
          invisibleRate: score.invisibleRate,
        },
        reportSnapshot: {
          mock,
          promptCount: prompts.length,
          engineIds: engines.map((e) => e.id),
          score,
          lostPrompts,
          failedJobs,
        },
        attribution: input.attribution,
        prompts: prompts.map((p, pi) => ({
          text: p.text,
          archetype: p.archetype,
          results: jobResults
            .filter((r) => r.pi === pi)
            .map((r) => ({ engineId: r.engineId, analysis: r.analysis })),
        })),
      });
      scanId = persisted.scanId;
      dashboardToken = persisted.dashboardToken;
      reportToken = persisted.reportToken;
    } catch (err) {
      console.error("persistencia falló (el reporte sigue)", err);
    }
  }

  return {
    domain: input.domain,
    brand,
    mock,
    generatedAt: new Date().toISOString(),
    promptCount: prompts.length,
    engineIds: engines.map((e) => e.id),
    score,
    lostPrompts,
    failedJobs,
    scanId,
    dashboardToken,
    reportToken,
  };
}
