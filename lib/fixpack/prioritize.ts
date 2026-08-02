import type { FixCategory, FixItem } from "./types";

// Esfuerzo relativo por tipo de fix (menor = más fácil de ejecutar).
const EFFORT: Record<FixCategory, number> = {
  "schema-markup": 1,
  "off-site-action": 2,
  "citable-content": 3,
};

// Score impacto/esfuerzo → priority (mayor = hacer antes). El impacto sube con
// la cantidad de competidores que ganan ese gap (más para recuperar).
export function scorePriority(category: FixCategory, competitorCount: number): number {
  const impact = 5 + Math.min(competitorCount, 5); // 5..10
  return impact * 2 - EFFORT[category];
}

export function prioritize(items: FixItem[]): FixItem[] {
  return [...items].sort((a, b) => b.priority - a.priority);
}
