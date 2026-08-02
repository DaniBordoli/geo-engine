import type { EngineResponse } from "@/lib/engines/types";
import { DEMO_COMPETITORS } from "@/lib/engines/mock";
import { withRetry } from "@/lib/util/retry";
import type { ResponseAnalysis, ResponseAnalyzer } from "./types";
import { ANALYZER_MODEL, getAnthropic, parseJsonContent } from "./anthropic";

const BATCH_SIZE = 10;

// --- Parte determinista (sin LLM): mención y citación -----------------------

// Citación por HOST (P3.2): una label del dominio == token de marca. Evita el
// falso positivo de "nike" dentro de "nikeshoes.com" o en un competidor.
function hostMatchesBrand(url: string, brand: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return host.split(".").includes(brand);
  } catch {
    return false;
  }
}

// El token de marca sale del dominio concatenado ("theordinary"), pero en prosa
// los modelos escriben "The Ordinary" (con espacio). Normalizamos ambos lados
// sacando no-alfanuméricos para que el fallback determinista los matchee.
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

type Base = Pick<ResponseAnalysis, "mentioned" | "cited" | "citedUrls">;

function computeBase(response: EngineResponse, brand: string): Base {
  return {
    mentioned: normalize(response.text).includes(normalize(brand)),
    cited: response.citedUrls.some((u) => hostMatchesBrand(u, brand)),
    citedUrls: response.citedUrls,
  };
}

// --- Enriquecimiento LLM (posición / sentiment / competidores) --------------

type Enrichment = {
  mentioned: boolean;
  position: number | null;
  sentiment: ResponseAnalysis["sentiment"];
  competitors: string[];
};

const ENRICH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          mentioned: { type: "boolean" },
          position: { anyOf: [{ type: "integer" }, { type: "null" }] },
          sentiment: {
            anyOf: [
              { type: "string", enum: ["positive", "neutral", "negative"] },
              { type: "null" },
            ],
          },
          competitors: { type: "array", items: { type: "string" } },
        },
        required: ["mentioned", "position", "sentiment", "competitors"],
      },
    },
  },
  required: ["items"],
} as const;

// Un batch = una llamada al LLM. Lanza si el shape/len no coincide (el caller
// hace fallback a llamadas individuales).
async function enrichGroup(texts: string[], brand: string): Promise<Enrichment[]> {
  const message = await withRetry(() =>
    getAnthropic().messages.create({
      model: ANALYZER_MODEL,
      max_tokens: 2048,
      system:
        "You analyze AI engine answers to detect how a brand appears. The target " +
        "brand may be written differently than given (spacing, capitalization, " +
        "possessives, common aliases) — judge presence by meaning, not exact " +
        "string. For each answer return: mentioned (true if the target brand " +
        "appears in any form), position (brand's 1-based rank among all brands " +
        "named, null if absent), sentiment toward the brand, and competitors " +
        `(other brands named, excluding the target). Return exactly ${texts.length} ` +
        "items in the same order.",
      messages: [
        {
          role: "user",
          content:
            `Target brand: ${brand}\n\nAnswers (JSON array):\n` +
            JSON.stringify(texts),
        },
      ],
      output_config: { format: { type: "json_schema", schema: ENRICH_SCHEMA } },
    }),
  );
  const { items } = parseJsonContent<{ items: Enrichment[] }>(message);
  if (items.length !== texts.length) {
    throw new Error(`batch len mismatch: ${items.length} != ${texts.length}`);
  }
  return items;
}

function combine(base: Base, enr: Enrichment | null): ResponseAnalysis {
  // Mención: el LLM (que entiende variantes de nombre) manda; si falló, cae al
  // determinista normalizado. Posición/sentiment solo si la marca aparece.
  const mentioned = enr ? enr.mentioned : base.mentioned;
  return {
    mentioned,
    cited: base.cited,
    citedUrls: base.citedUrls,
    position: mentioned ? (enr?.position ?? null) : null,
    sentiment: mentioned ? (enr?.sentiment ?? null) : null,
    competitors: enr?.competitors ?? [],
  };
}

// Analizador real. Citación determinista (host↔dominio); mención por LLM (Haiku,
// en batch) — entiende variantes de nombre — con fallback determinista normalizado.
// Posición/sentiment/competidores también del LLM. Nunca tira: si el LLM falla,
// degrada a la base determinista (P0.2).
function realAnalyzer(): ResponseAnalyzer {
  async function analyzeMany(responses: EngineResponse[], brandRaw: string) {
    const brand = brandRaw.toLowerCase();
    const bases = responses.map((r) => computeBase(r, brand));
    const enrichments: (Enrichment | null)[] = new Array(responses.length).fill(null);

    for (let start = 0; start < responses.length; start += BATCH_SIZE) {
      const idx = responses.slice(start, start + BATCH_SIZE).map((_, k) => start + k);
      const texts = idx.map((i) => responses[i].text);
      try {
        const items = await enrichGroup(texts, brand);
        idx.forEach((i, k) => (enrichments[i] = items[k]));
      } catch (groupErr) {
        console.error("batch de análisis falló, fallback individual", groupErr);
        for (const i of idx) {
          try {
            const [one] = await enrichGroup([responses[i].text], brand);
            enrichments[i] = one;
          } catch (itemErr) {
            console.error("análisis individual falló, uso base determinista", itemErr);
          }
        }
      }
    }

    return responses.map((_, i) => combine(bases[i], enrichments[i]));
  }

  return {
    analyzeMany,
    analyze: async (response, brand) => (await analyzeMany([response], brand))[0],
  };
}

// Analizador mock: heurística por substring contra una watchlist (sin LLM).
function mockAnalyzer(watchlist: string[]): ResponseAnalyzer {
  async function analyze(response: EngineResponse, brandRaw: string): Promise<ResponseAnalysis> {
    const brand = brandRaw.toLowerCase();
    const text = response.text.toLowerCase();
    const base = computeBase(response, brand);
    const competitors = watchlist.filter((c) => text.includes(c.toLowerCase()));

    let position: number | null = null;
    if (base.mentioned) {
      const brands = [brand, ...competitors.map((c) => c.toLowerCase())].map((b) => ({
        name: b,
        at: text.indexOf(b),
      }));
      brands.sort((a, b) => a.at - b.at);
      position = brands.findIndex((b) => b.name === brand) + 1;
    }

    return {
      ...base,
      position,
      sentiment: base.mentioned ? "neutral" : null,
      competitors,
    };
  }

  return {
    analyze,
    analyzeMany: (responses, brand) => Promise.all(responses.map((r) => analyze(r, brand))),
  };
}

export function getAnalyzer(): ResponseAnalyzer {
  return process.env.ANTHROPIC_API_KEY ? realAnalyzer() : mockAnalyzer(DEMO_COMPETITORS);
}
