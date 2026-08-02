// Salidas de scoring — el "cachetazo de realidad" del reporte.
// Ver PROPOSAL.md § Tasks Semana 1 "Scoring".

export type CompetitorScore = {
  name: string;
  /** Share-of-voice del competidor (0–1). */
  shareOfVoice: number;
  mentions: number;
};

export type ScanScore = {
  /** Share-of-voice de la marca (0–1). */
  shareOfVoice: number;
  /** Tasa de citación (0–1): prompts donde la marca fue citada. */
  citationRate: number;
  /** Fracción de prompts donde la marca es invisible (0–1). */
  invisibleRate: number;
  /** Leaderboard de competidores, ordenado desc por shareOfVoice. */
  leaderboard: CompetitorScore[];
};
