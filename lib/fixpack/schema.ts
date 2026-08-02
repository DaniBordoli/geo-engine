import { ANALYZER_MODEL, getAnthropic, textContent } from "@/lib/agents/anthropic";
import { withRetry } from "@/lib/util/retry";
import type { Gap } from "./types";

export type SchemaResult = { jsonld: string; valid: boolean };

// Genera el JSON-LD (schema.org) relevante al gap: FAQPage, Product, etc.
// Modelo barato. Valida que sea JSON parseable (P2.2): si el modelo devuelve
// prosa, marcamos valid=false para que el item se muestre como "revisar".
export async function generateSchema(gap: Gap, brand: string): Promise<SchemaResult> {
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

  // Sacar fences si el modelo los agregó igual, y validar como JSON.
  const jsonld = textContent(message)
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  let valid = false;
  try {
    JSON.parse(jsonld);
    valid = true;
  } catch {
    valid = false;
  }
  return { jsonld, valid };
}
