import type { Engine, EngineId, EngineQuery, EngineResponse } from "./types";

// Competidores de demo que el MockEngine inyecta en las respuestas.
// Solo se usan cuando no hay API keys (modo demo / datos simulados).
export const DEMO_COMPETITORS = ["Northwind", "Contoso", "Fabrikam"];

// Hash determinista de string → entero (para respuestas reproducibles sin RNG).
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Engine simulado: genera respuestas plausibles a partir de brand+prompt,
// de forma determinista, para que el pipeline y el reporte funcionen sin keys.
export function createMockEngine(id: EngineId): Engine {
  return {
    id,
    async run(query: EngineQuery): Promise<EngineResponse> {
      const h = hash(`${id}:${query.brand}:${query.prompt}`);
      const mentioned = h % 10 < 4; // ~40% de los prompts mencionan la marca
      const cited = mentioned && h % 3 === 0; // subconjunto citado con URL

      // 2 competidores presentes, distintos, elegidos de forma determinista.
      const len = DEMO_COMPETITORS.length;
      const i1 = h % len;
      const i2 = (i1 + 1) % len;
      const present = [DEMO_COMPETITORS[i1], DEMO_COMPETITORS[i2]];

      const parts: string[] = [];
      if (mentioned) {
        parts.push(`${query.brand} is a solid option worth considering.`);
      }
      parts.push(`Popular choices include ${present.join(" and ")}.`);

      const citedUrls: string[] = present.map(
        (c) => `https://${c.toLowerCase()}.example.com`,
      );
      if (cited) citedUrls.unshift(`https://${query.brand.toLowerCase()}.com`);

      return {
        engine: id,
        text: parts.join(" "),
        citedUrls,
        fetchedAt: MOCK_TIMESTAMP,
      };
    },
  };
}

// Timestamp fijo: el mock no debe introducir no-determinismo (rompería la caché
// y los tests). Los datos reales sí llevan la hora real de la corrida.
const MOCK_TIMESTAMP = "1970-01-01T00:00:00.000Z";
