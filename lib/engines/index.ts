import type { Engine } from "./types";
import { withCache } from "./cache";
import { createMockEngine } from "./mock";
import { createOpenAIEngine } from "./openai";
import { createPerplexityEngine } from "./perplexity";

export type { Engine, EngineId, EngineQuery, EngineResponse } from "./types";
export { DEMO_COMPETITORS } from "./mock";

export type EnginesBundle = {
  engines: Engine[];
  /** true = corriendo con MockEngine (sin keys). El reporte lo marca como demo. */
  mock: boolean;
};

// Selecciona engines reales si hay keys; si no, cae a mocks. Cada engine real
// se envuelve en caché. Semana 1 = OpenAI + Perplexity.
export function getEngines(): EnginesBundle {
  const engines: Engine[] = [];

  if (process.env.OPENAI_API_KEY) {
    engines.push(withCache(createOpenAIEngine(process.env.OPENAI_API_KEY)));
  }
  if (process.env.PERPLEXITY_API_KEY) {
    engines.push(withCache(createPerplexityEngine(process.env.PERPLEXITY_API_KEY)));
  }

  if (engines.length > 0) return { engines, mock: false };

  return {
    engines: [createMockEngine("openai"), createMockEngine("perplexity")],
    mock: true,
  };
}
