import type { VerticalConfig } from "@/lib/verticals/types";
import { FIXPACK_MODEL, getAnthropic, textContent } from "@/lib/agents/anthropic";
import { withRetry } from "@/lib/util/retry";
import type { Gap } from "./types";

// Diagnostica POR QUÉ la marca pierde este gap, mirando qué tienen los que ganan
// (las winningUrls). Devuelve una causa breve y accionable.
export async function diagnoseCause(
  gap: Gap,
  brand: string,
  vertical: VerticalConfig,
): Promise<string> {
  const message = await withRetry(() =>
    getAnthropic().messages.create({
      model: FIXPACK_MODEL,
      max_tokens: 512,
      // Sin thinking: la generación tiene que entrar en el maxDuration de Hobby.
      thinking: { type: "disabled" },
      system:
        "You diagnose why a brand is absent from an AI engine's answer to a " +
        "buy-intent prompt. Name the single most likely cause in one or two " +
        "sentences: no content on the topic, absent from the sources the LLM " +
        "reads, missing schema, or weak entity. Be concrete and actionable.",
      messages: [
        {
          role: "user",
          content:
            `Brand: ${brand}\nCategory: ${vertical.category}\n` +
            `Prompt where the brand loses: "${gap.prompt}"\n` +
            `Competitors present: ${gap.competitors.join(", ") || "unknown"}\n` +
            `Sources the engines cited: ${gap.winningUrls.join(", ") || "none"}`,
        },
      ],
    }),
  );
  return textContent(message).trim();
}
