import type { VerticalConfig } from "@/lib/verticals/types";
import type { GeneratedPrompt, PromptGenerator } from "./types";
import { GENERATOR_MODEL, getAnthropic, parseJsonContent } from "./anthropic";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    prompts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          archetype: { type: "string" },
        },
        required: ["text", "archetype"],
      },
    },
  },
  required: ["prompts"],
} as const;

// Generador real: agente Claude que produce prompts de intención de compra.
// NOTA: no verificado end-to-end sin ANTHROPIC_API_KEY.
function realGenerator(): PromptGenerator {
  return {
    async generate(config: VerticalConfig, brand: string): Promise<GeneratedPrompt[]> {
      const message = await getAnthropic().messages.create({
        model: GENERATOR_MODEL,
        max_tokens: 8192,
        system:
          "You generate buy-intent search prompts a shopper would ask an AI " +
          "assistant. Return 20-40 prompts covering the given archetypes. " +
          "Each prompt must be natural and specific to the category and buyer.",
        messages: [
          {
            role: "user",
            content:
              `Category: ${config.category}\n` +
              `Buyer (ICP): ${config.icp}\n` +
              `Language: ${config.lang}\n` +
              `Archetypes: ${config.promptArchetypes.join(", ")}\n` +
              `Brand under analysis: ${brand}\n\n` +
              "Generate the prompts. Fill each archetype with realistic values.",
          },
        ],
        output_config: { format: { type: "json_schema", schema: SCHEMA } },
      });
      return parseJsonContent<{ prompts: GeneratedPrompt[] }>(message).prompts;
    },
  };
}

// Generador mock: expande los arquetipos de forma determinista (sin keys).
function mockGenerator(): PromptGenerator {
  return {
    async generate(config: VerticalConfig): Promise<GeneratedPrompt[]> {
      const fillers = ["home use", "beginners", "professionals", "small budgets", "gifts"];
      const out: GeneratedPrompt[] = [];
      for (const archetype of config.promptArchetypes) {
        for (const filler of fillers) {
          out.push({
            text: archetype
              .replace(/\{category\}/g, config.category)
              .replace(/\{use_case\}/g, filler)
              .replace(/\{year\}/g, "2026")
              .replace(/\{[^}]+\}/g, filler),
            archetype,
          });
        }
      }
      return out;
    },
  };
}

export function getPromptGenerator(): PromptGenerator {
  const base = process.env.ANTHROPIC_API_KEY ? realGenerator() : mockGenerator();
  return {
    async generate(config: VerticalConfig, brand: string): Promise<GeneratedPrompt[]> {
      // Set fijo → mismos prompts para toda marca (head-to-head comparable),
      // sin llamada al LLM. Brand-agnóstico a propósito.
      if (config.fixedPrompts?.length) {
        return config.fixedPrompts.map((text) => ({ text, archetype: "fixed" }));
      }
      return base.generate(config, brand);
    },
  };
}
