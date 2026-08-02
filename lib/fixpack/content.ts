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

// Genera un draft de contenido CITABLE para cerrar el gap, ATERRIZADO en datos
// reales: usa el texto del sitio del cliente (si se pudo crawlear) y NO inventa
// precios/specs/productos — lo que no está, va como [placeholder] a completar.
export async function generateContent(
  gap: Gap,
  cause: string,
  brand: string,
  vertical: VerticalConfig,
  siteText: string,
): Promise<{ title: string; body: string }> {
  const message = await withRetry(() =>
    getAnthropic().messages.create({
      model: FIXPACK_MODEL,
      max_tokens: 8192,
      // Sin thinking: la generación tiene que entrar en el maxDuration de Hobby.
      thinking: { type: "disabled" },
      system:
        "You write citable content that AI engines quote (clear factual claims, " +
        "Q&A, comparison tables), as Markdown.\n" +
        "HARD RULES — this is a draft the customer will fact-check and publish:\n" +
        "1. NEVER invent product names, prices, specs, dates, or claims. Use ONLY " +
        "facts present in the provided 'Site content'.\n" +
        "2. For anything real but not in the site content, write a clear " +
        "placeholder in [brackets] for the customer to fill: [precio], [modelo], " +
        "[spec], [URL].\n" +
        "3. Ground it against the REAL competitors and sources currently winning " +
        "this query (given below) — reference them by name; they are real.\n" +
        "4. Start the body with one line: '> Completá los [corchetes] con tus " +
        "datos reales antes de publicar.'\n" +
        `Prefer these formats: ${vertical.contentTemplates.join(", ")}.`,
      messages: [
        {
          role: "user",
          content:
            `Brand: ${brand}\n` +
            `Prompt to win: "${gap.prompt}"\n` +
            `Diagnosed cause: ${cause}\n` +
            `Real competitors winning this query: ${gap.competitors.join(", ") || "unknown"}\n` +
            `Sources currently cited for this query: ${gap.winningUrls.join(", ") || "none"}\n\n` +
            `Site content (real, from ${brand}'s homepage — use these facts, do not invent):\n"""` +
            (siteText || "(no se pudo obtener — usá [placeholders] para todo dato de producto)") +
            `"""\n\n` +
            "Write a title and a Markdown body for a page/section that would make " +
            "the brand citable for this prompt, following the HARD RULES.",
        },
      ],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    }),
  );
  return parseJsonContent<{ title: string; body: string }>(message);
}
