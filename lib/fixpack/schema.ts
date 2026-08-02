import { ANALYZER_MODEL, getAnthropic, textContent } from "@/lib/agents/anthropic";
import { withRetry } from "@/lib/util/retry";
import type { Gap } from "./types";

// Genera el JSON-LD (schema.org) relevante al gap: FAQPage, Product, etc.
// Modelo barato: es una tarea estructurada y mecánica.
export async function generateSchema(gap: Gap, brand: string): Promise<string> {
  const message = await withRetry(() =>
    getAnthropic().messages.create({
      model: ANALYZER_MODEL,
      max_tokens: 2048,
      system:
        "You output a single valid JSON-LD (schema.org) block relevant to a " +
        "buy-intent prompt: FAQPage, Product, or Review as fits. Output ONLY the " +
        "JSON-LD, no prose, no code fences.",
      messages: [
        {
          role: "user",
          content: `Brand: ${brand}\nPrompt: "${gap.prompt}"`,
        },
      ],
    }),
  );
  return textContent(message).trim();
}
