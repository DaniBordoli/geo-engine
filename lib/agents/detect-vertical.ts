import { ANALYZER_MODEL, getAnthropic, parseJsonContent } from "./anthropic";
import { withRetry } from "@/lib/util/retry";

// Rubro + idioma inferidos del sitio, más los prompts de compra ya generados
// (brand-agnósticos, en el idioma detectado). Se genera todo en UNA llamada:
// la clasificación y la generación de prompts van juntas (más barato que 2 pasos).
export type DetectedVertical = {
  /** Rubro en pocas palabras: "specialty coffee roaster", "billing SaaS". */
  category: string;
  /** Quién compra (ICP). */
  icp: string;
  /** Idioma del contenido: "en" | "es" | "pt" | ... */
  lang: string;
  /** 12–15 prompts de compra de categoría, brand-agnósticos, en `lang`. */
  prompts: string[];
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: { type: "string" },
    icp: { type: "string" },
    lang: { type: "string" },
    prompts: { type: "array", items: { type: "string" } },
  },
  required: ["category", "icp", "lang", "prompts"],
} as const;

// Detecta rubro+idioma y genera los prompts. `opts` permite forzar idioma/categoría
// (cuando la auto-detección falla o la marca vende en otro idioma que su web).
export async function detectVertical(
  crawlData: string,
  domain: string,
  opts?: { lang?: string; category?: string },
): Promise<DetectedVertical> {
  const overrides = [
    opts?.category ? `Category is FIXED to: "${opts.category}" (do not re-detect it).` : "",
    opts?.lang ? `Language is FIXED to: "${opts.lang}" — write the prompts in this language.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const message = await withRetry(() =>
    getAnthropic().messages.create({
      model: ANALYZER_MODEL,
      max_tokens: 2048,
      system:
        "You analyze a website to prepare an AI-visibility scan. From the site " +
        "content: (1) identify the product/service CATEGORY in a few words, (2) the " +
        "buyer (ICP), (3) the LANGUAGE of the content (ISO code: en, es, pt…), and " +
        "(4) write 12-15 realistic buy-intent search prompts a shopper would ask an " +
        "AI assistant in that category.\n" +
        "Rules for the prompts:\n" +
        "- BRAND-AGNOSTIC: never name any brand (so share-of-voice is comparable).\n" +
        "- Buy-intent / category questions: 'best X for Y', 'most reliable X under $Z'.\n" +
        "- Written in the detected language (or the fixed one if given).\n" +
        "- Concrete and varied across use-cases within the category.",
      messages: [
        {
          role: "user",
          content:
            `Domain: ${domain}\n` +
            (overrides ? `${overrides}\n` : "") +
            `\nSite content (title, meta, JSON-LD, body — may be sparse):\n"""` +
            (crawlData || "(empty — infer the category from the domain name)") +
            `"""`,
        },
      ],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    }),
  );

  return parseJsonContent<DetectedVertical>(message);
}
