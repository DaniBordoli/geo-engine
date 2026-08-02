// Interfaz común de engines. Empezamos con Perplexity + OpenAI;
// Gemini/Anthropic se suman después detrás del mismo contrato.
// Ver PROPOSAL.md § Tasks Semana 1 "Runner de engines".

export type EngineId = "openai" | "perplexity" | "gemini" | "anthropic";

export type EngineQuery = {
  prompt: string;
  /** Marca/dominio objetivo, para que el analizador sepa qué buscar. */
  brand: string;
};

export type EngineResponse = {
  engine: EngineId;
  /** Texto crudo de la respuesta del engine. */
  text: string;
  /** URLs citadas/fuentes que el engine devolvió, si las hay. */
  citedUrls: string[];
  /** Timestamp de la corrida (para caché y re-scans). */
  fetchedAt: string;
};

export interface Engine {
  readonly id: EngineId;
  run(query: EngineQuery): Promise<EngineResponse>;
}
