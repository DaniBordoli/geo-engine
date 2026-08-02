import { describe, expect, it } from "vitest";
import type { ResponseAnalysis } from "@/lib/agents/types";
import { scoreScan } from "./index";

// Fábrica: un análisis con defaults "invisible" que se sobrescriben por caso.
function analysis(over: Partial<ResponseAnalysis>): ResponseAnalysis {
  return {
    mentioned: false,
    cited: false,
    position: null,
    sentiment: null,
    citedUrls: [],
    competitors: [],
    ...over,
  };
}

describe("scoreScan", () => {
  it("marca invisible en el 100% de prompts cuando nunca aparece", () => {
    // Importa porque 'invisible en X%' es el titular del reporte: si la marca
    // no aparece, invisibleRate DEBE ser 1, no un valor suavizado.
    const score = scoreScan([
      analysis({ competitors: ["Rival A"] }),
      analysis({ competitors: ["Rival A", "Rival B"] }),
    ]);
    expect(score.invisibleRate).toBe(1);
    expect(score.shareOfVoice).toBe(0);
    expect(score.citationRate).toBe(0);
  });

  it("share-of-voice pondera marca contra el total de menciones (marca + competidores)", () => {
    // 1 mención de marca + 3 de competidores = 4 voces → SoV = 1/4.
    // Si el cálculo ignorara a los competidores, daría 1/1 y mentiría.
    const score = scoreScan([
      analysis({ mentioned: true, competitors: ["Rival A", "Rival B"] }),
      analysis({ competitors: ["Rival A"] }),
    ]);
    expect(score.shareOfVoice).toBeCloseTo(0.25);
  });

  it("tasa de citación cuenta solo prompts con citación real (URL), no menciones sueltas", () => {
    // La diferencia mención vs citación es la tesis del producto: aparecer
    // mencionado no es lo mismo que ser citado como fuente.
    const score = scoreScan([
      analysis({ mentioned: true, cited: true }),
      analysis({ mentioned: true, cited: false }),
    ]);
    expect(score.citationRate).toBe(0.5);
  });

  it("leaderboard ordena competidores por share-of-voice descendente", () => {
    // El reporte muestra 'quién te está ganando'; el orden es la información.
    const score = scoreScan([
      analysis({ competitors: ["Líder", "Segundo"] }),
      analysis({ competitors: ["Líder"] }),
      analysis({ competitors: ["Líder"] }),
    ]);
    expect(score.leaderboard.map((c) => c.name)).toEqual(["Líder", "Segundo"]);
    expect(score.leaderboard[0].mentions).toBe(3);
  });

  it("no divide por cero con cero análisis", () => {
    const score = scoreScan([]);
    expect(score).toEqual({
      shareOfVoice: 0,
      citationRate: 0,
      invisibleRate: 0,
      leaderboard: [],
    });
  });
});
