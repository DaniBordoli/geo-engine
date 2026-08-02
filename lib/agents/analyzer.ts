import type { EngineResponse } from "@/lib/engines/types";
import { DEMO_COMPETITORS } from "@/lib/engines/mock";
import type { ResponseAnalysis, ResponseAnalyzer } from "./types";
import { AGENT_MODEL, getAnthropic, parseJsonContent } from "./anthropic";

// La citación es determinista: ¿alguna URL fuente apunta a la marca?
// No hace falta un LLM para eso.
function isCited(response: EngineResponse, brand: string): boolean {
  return response.citedUrls.some((u) => u.toLowerCase().includes(brand));
}

const SCHEMA = {
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
} as const;

// Analizador real: Claude detecta mención, posición, sentiment y competidores.
// NOTA: no verificado end-to-end sin ANTHROPIC_API_KEY.
function realAnalyzer(): ResponseAnalyzer {
  return {
    async analyze(response: EngineResponse, brand: string): Promise<ResponseAnalysis> {
      const message = await getAnthropic().messages.create({
        model: AGENT_MODEL,
        max_tokens: 2048,
        system:
          "You analyze an AI engine's answer to detect how a brand appears. " +
          "position = the brand's 1-based rank among all brands named (null if " +
          "absent). competitors = other brands named, excluding the target.",
        messages: [
          {
            role: "user",
            content: `Target brand: ${brand}\n\nEngine answer:\n"""${response.text}"""`,
          },
        ],
        output_config: { format: { type: "json_schema", schema: SCHEMA } },
      });
      const parsed = parseJsonContent<Omit<ResponseAnalysis, "cited" | "citedUrls">>(
        message,
      );
      return {
        ...parsed,
        cited: isCited(response, brand),
        citedUrls: response.citedUrls,
      };
    },
  };
}

// Analizador mock: detección heurística por substring contra una watchlist.
function mockAnalyzer(watchlist: string[]): ResponseAnalyzer {
  return {
    async analyze(response: EngineResponse, brand: string): Promise<ResponseAnalysis> {
      const text = response.text.toLowerCase();
      const mentioned = text.includes(brand.toLowerCase());
      const competitors = watchlist.filter((c) => text.includes(c.toLowerCase()));

      // Posición: rank 1-based de la marca entre todas las marcas presentes,
      // ordenadas por primera aparición en el texto.
      let position: number | null = null;
      if (mentioned) {
        const brands = [brand, ...competitors].map((b) => ({
          name: b,
          at: text.indexOf(b.toLowerCase()),
        }));
        brands.sort((a, b) => a.at - b.at);
        position = brands.findIndex((b) => b.name === brand) + 1;
      }

      return {
        mentioned,
        cited: isCited(response, brand),
        position,
        sentiment: mentioned ? "neutral" : null,
        citedUrls: response.citedUrls,
        competitors,
      };
    },
  };
}

export function getAnalyzer(): ResponseAnalyzer {
  return process.env.ANTHROPIC_API_KEY ? realAnalyzer() : mockAnalyzer(DEMO_COMPETITORS);
}
