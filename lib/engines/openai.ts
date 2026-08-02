import OpenAI from "openai";
import type { Engine, EngineQuery, EngineResponse } from "./types";

// NOTA: no verificado end-to-end sin OPENAI_API_KEY. Escrito contra la API
// estable de chat completions. La API de OpenAI sin browsing no devuelve
// fuentes, así que citedUrls queda vacío (esperado y honesto: mención sí,
// citación con URL no).
const OPENAI_MODEL = "gpt-4o";

const SYSTEM =
  "You are a helpful assistant answering a shopper's question. " +
  "Recommend specific real brands and products by name, concisely.";

export function createOpenAIEngine(apiKey: string): Engine {
  const client = new OpenAI({ apiKey });
  return {
    id: "openai",
    async run(query: EngineQuery): Promise<EngineResponse> {
      const completion = await client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: query.prompt },
        ],
      });
      return {
        engine: "openai",
        text: completion.choices[0]?.message?.content ?? "",
        citedUrls: [],
        fetchedAt: new Date().toISOString(),
      };
    },
  };
}
