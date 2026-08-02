import { ANALYZER_MODEL, getAnthropic, textContent } from "@/lib/agents/anthropic";
import { withRetry } from "@/lib/util/retry";
import type { Gap } from "./types";

// Lista priorizada de acciones off-site para ganar menciones en las fuentes que
// el LLM lee (hilos de Reddit, sitios de comparación, directorios). Sin
// automatización: el humano ejecuta. Devuelve Markdown.
export async function generateOffsite(gap: Gap, brand: string): Promise<string> {
  const message = await withRetry(() =>
    getAnthropic().messages.create({
      model: ANALYZER_MODEL,
      max_tokens: 2048,
      system:
        "You list concrete off-site actions to get a brand mentioned in the " +
        "sources AI engines cite: specific subreddits/threads, comparison sites, " +
        "directories, and review platforms. Output a Markdown bullet list, most " +
        "impactful first. No automation — a human will do these.",
      messages: [
        {
          role: "user",
          content:
            `Brand: ${brand}\nPrompt: "${gap.prompt}"\n` +
            `Sources currently winning: ${gap.winningUrls.join(", ") || "unknown"}`,
        },
      ],
    }),
  );
  return textContent(message).trim();
}
