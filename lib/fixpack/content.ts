import type { VerticalConfig } from "@/lib/verticals/types";
import { FIXPACK_MODEL, getAnthropic, parseJsonContent } from "@/lib/agents/anthropic";
import { withRetry } from "@/lib/util/retry";
import type { Gap } from "./types";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    body: { type: "string" },
  },
  required: ["title", "body"],
} as const;

// Genera un draft de contenido CITABLE para cerrar el gap: claims claros, Q&A o
// tabla comparativa, según los contentTemplates del vertical. Devuelve Markdown.
export async function generateContent(
  gap: Gap,
  cause: string,
  brand: string,
  vertical: VerticalConfig,
): Promise<{ title: string; body: string }> {
  const message = await withRetry(() =>
    getAnthropic().messages.create({
      model: FIXPACK_MODEL,
      max_tokens: 8192,
      // Sin thinking: la generación tiene que entrar en el maxDuration de Hobby.
      thinking: { type: "disabled" },
      system:
        "You write citable content that AI engines quote: clear factual claims, " +
        "Q&A, and comparison tables. Output the body as Markdown. Make it " +
        `specific to the brand. Prefer these formats: ${vertical.contentTemplates.join(", ")}.`,
      messages: [
        {
          role: "user",
          content:
            `Brand: ${brand}\nPrompt to win: "${gap.prompt}"\n` +
            `Diagnosed cause: ${cause}\n` +
            `Competitors to beat: ${gap.competitors.join(", ") || "unknown"}\n\n` +
            "Write a title and a Markdown body for a page/section that would make " +
            "the brand citable for this prompt.",
        },
      ],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    }),
  );
  return parseJsonContent<{ title: string; body: string }>(message);
}
