import type { ResponseAnalysis } from "@/lib/agents/types";
import type { CompetitorScore, ScanScore } from "./types";

export type { CompetitorScore, ScanScore } from "./types";

// Calcula el scoring del scan a partir de los análisis de cada respuesta.
// El núcleo del producto: el "cachetazo de realidad".
export function scoreScan(analyses: ResponseAnalysis[]): ScanScore {
  const total = analyses.length;
  if (total === 0) {
    return { shareOfVoice: 0, citationRate: 0, invisibleRate: 0, leaderboard: [] };
  }

  const brandMentions = analyses.filter((a) => a.mentioned).length;
  const brandCitations = analyses.filter((a) => a.cited).length;
  const invisible = analyses.filter((a) => !a.mentioned).length;

  // Menciones por competidor a lo largo de todas las respuestas.
  const competitorMentions = new Map<string, number>();
  for (const a of analyses) {
    for (const name of a.competitors) {
      competitorMentions.set(name, (competitorMentions.get(name) ?? 0) + 1);
    }
  }

  // Share-of-voice: menciones de la marca sobre el total de menciones
  // (marca + competidores) en el conjunto de respuestas.
  const totalCompetitorMentions = [...competitorMentions.values()].reduce(
    (sum, n) => sum + n,
    0,
  );
  const totalVoice = brandMentions + totalCompetitorMentions;

  const leaderboard: CompetitorScore[] = [...competitorMentions.entries()]
    .map(([name, mentions]) => ({
      name,
      mentions,
      shareOfVoice: totalVoice === 0 ? 0 : mentions / totalVoice,
    }))
    .sort((a, b) => b.shareOfVoice - a.shareOfVoice);

  return {
    shareOfVoice: totalVoice === 0 ? 0 : brandMentions / totalVoice,
    citationRate: brandCitations / total,
    invisibleRate: invisible / total,
    leaderboard,
  };
}
