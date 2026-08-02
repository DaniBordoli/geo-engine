import { getAnalyzer } from "@/lib/agents/analyzer";
import { getPromptGenerator } from "@/lib/agents/prompt-generator";
import type { ResponseAnalysis } from "@/lib/agents/types";
import { getEngines } from "@/lib/engines";
import { scoreScan } from "@/lib/scoring";
import type { ScanScore } from "@/lib/scoring/types";
import { mapLimit } from "@/lib/util/async";
import { getVertical } from "@/lib/verticals";
import { ecommerce } from "@/lib/verticals/ecommerce";

const MAX_PROMPTS = 40;
const ENGINE_CONCURRENCY = 5;

export type ScanInput = {
  domain: string;
  email?: string;
  verticalId?: string;
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
  /** Id del scan si se persistió en la DB (undefined si corrió en memoria). */
  scanId?: string;
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

  const prompts = (await generator.generate(vertical, brand)).slice(0, MAX_PROMPTS);

  // Producto cartesiano prompt × engine, con índice del prompt para reagrupar.
  const jobs = prompts.flatMap((prompt, pi) =>
    engines.map((engine) => ({ pi, prompt, engine })),
  );

  const jobResults = await mapLimit(jobs, ENGINE_CONCURRENCY, async ({ pi, prompt, engine }) => {
    const response = await engine.run({ prompt: prompt.text, brand });
    const analysis = await analyzer.analyze(response, brand);
    return { pi, promptText: prompt.text, engineId: engine.id, analysis };
  });

  const analyses: ResponseAnalysis[] = jobResults.map((r) => r.analysis);
  const score = scoreScan(analyses);

  const lostPrompts: LostPrompt[] = jobResults
    .filter((r) => !r.analysis.mentioned)
    .slice(0, 5)
    .map((r) => ({ prompt: r.promptText, engine: r.engineId }));

  // Persistencia (best-effort): solo con DB configurada y email presente.
  // Un fallo al persistir no debe tumbar el reporte (el reporte es el producto).
  let scanId: string | undefined;
  if (process.env.DATABASE_URL && input.email) {
    try {
      const { persistScan } = await import("@/lib/persist");
      scanId = await persistScan({
        email: input.email,
        domain: input.domain,
        verticalId: vertical.id,
        competitors: score.leaderboard.map((c) => c.name),
        prompts: prompts.map((p, pi) => ({
          text: p.text,
          archetype: p.archetype,
          results: jobResults
            .filter((r) => r.pi === pi)
            .map((r) => ({ engineId: r.engineId, analysis: r.analysis })),
        })),
      });
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
    scanId,
  };
}
