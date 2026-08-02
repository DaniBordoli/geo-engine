import type { Engine, EngineQuery, EngineResponse } from "./types";

// NOTA: no verificado end-to-end sin PERPLEXITY_API_KEY. Perplexity expone una
// API compatible con OpenAI que además devuelve `citations` (URLs fuente) al
// nivel superior de la respuesta — por eso usamos fetch en vez del SDK de
// OpenAI, que no tipa ese campo.
const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_MODEL = "sonar";

const SYSTEM =
  "You are a helpful assistant answering a shopper's question. " +
  "Recommend specific real brands and products by name, concisely.";

type PplxResponse = {
  choices: { message: { content: string } }[];
  citations?: string[];
};

export function createPerplexityEngine(apiKey: string): Engine {
  return {
    id: "perplexity",
    async run(query: EngineQuery): Promise<EngineResponse> {
      const res = await fetch(PERPLEXITY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: PERPLEXITY_MODEL,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: query.prompt },
          ],
        }),
      });
      if (!res.ok) {
        throw new Error(`Perplexity ${res.status}: ${await res.text()}`);
      }
      const data = (await res.json()) as PplxResponse;
      return {
        engine: "perplexity",
        text: data.choices[0]?.message?.content ?? "",
        citedUrls: data.citations ?? [],
        fetchedAt: new Date().toISOString(),
      };
    },
  };
}
