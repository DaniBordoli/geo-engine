import type { VerticalConfig } from "@/lib/verticals/types";
import type { EngineResponse } from "@/lib/engines/types";

// Contratos de los agentes Claude. Implementación en Semana 1 / Semana 2.
// Ver PROPOSAL.md § Tasks.

export type GeneratedPrompt = {
  text: string;
  archetype: string;
};

/** Genera 20–40 prompts de intención de compra desde el config del vertical. */
export interface PromptGenerator {
  generate(config: VerticalConfig, brand: string): Promise<GeneratedPrompt[]>;
}

export type ResponseAnalysis = {
  mentioned: boolean;
  cited: boolean;
  /** Posición 1-based de la marca; null si no aparece. */
  position: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  citedUrls: string[];
  /** Competidores detectados en la respuesta. */
  competitors: string[];
};

/** Detecta mención, citación, posición, sentiment y competidores. */
export interface ResponseAnalyzer {
  analyze(response: EngineResponse, brand: string): Promise<ResponseAnalysis>;
}
