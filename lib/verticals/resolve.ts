import type { VerticalConfig } from "./types";
import { getVertical } from "./index";
import { ecommerce } from "./ecommerce";
import { fetchSiteText } from "@/lib/fixpack/crawl";
import { detectVertical } from "@/lib/agents/detect-vertical";
import { domainKey, getCachedVertical, cacheVertical } from "./domain-prompts";

export type ResolveOpts = {
  /** Fuerza el modo teardown/estático (ej. "skincare" con fixedPrompts). */
  verticalId?: string;
  /** Overrides de la UI cuando la auto-detección no alcanza. */
  lang?: string;
  category?: string;
};

// Key del cache de prompts. Sin override → el host normalizado (set canónico del
// dominio). Con override → host + lang + category, para que overrides distintos
// tengan sets estables propios sin corromper el canónico.
function cacheKeyFor(domain: string, opts?: ResolveOpts): string {
  const base = domainKey(domain);
  if (!opts?.lang && !opts?.category) return base;
  return `${base}|${opts?.lang ?? ""}|${(opts?.category ?? "").trim().toLowerCase()}`;
}

// Config dinámico: los prompts van como `fixedPrompts` → el generador los usa
// verbatim (una llamada, sin brand-tailoring) y el SoV es comparable.
function dynamicConfig(category: string, lang: string, prompts: string[]): VerticalConfig {
  return {
    id: "auto",
    lang: lang || "en",
    category,
    icp: "",
    promptArchetypes: [],
    fixedPrompts: prompts,
    contentTemplates: ["comparison-table", "buyer-guide-qa", "product-claims-sheet"],
    distribution: "",
  };
}

// Decide el config del vertical para un scan:
//  - verticalId conocido → config ESTÁTICO (modo teardown, sin tocar).
//  - dominio ya cacheado (por dominio, u override) → REUSA las mismas preguntas
//    (trend real), sin crawl ni detección.
//  - si no → DINÁMICO: crawlea, detecta rubro+idioma, genera prompts y los cachea.
export async function resolveVertical(
  domain: string,
  opts?: ResolveOpts,
): Promise<VerticalConfig> {
  if (opts?.verticalId) {
    const v = getVertical(opts.verticalId);
    if (v) return v; // modo teardown: idéntico a hoy
  }

  // Sin key de Anthropic no hay agente → caemos al placeholder genérico (mock seam),
  // igual que el resto del pipeline sin keys.
  if (!process.env.ANTHROPIC_API_KEY) return ecommerce;

  // Key del cache: el host para el default; el host + el override cuando hay uno,
  // así un usuario que siempre fuerza el mismo lang/category también reusa su set
  // estable (trend real para él) SIN pisar el set canónico del default.
  const key = cacheKeyFor(domain, opts);

  // Reuso: mismo dominio (y mismo override, si hay) → mismas preguntas que la 1ra vez.
  const cached = await getCachedVertical(key);
  if (cached) return dynamicConfig(cached.category, cached.lang, cached.prompts);

  const crawlData = await fetchSiteText(domain);
  const d = await detectVertical(crawlData, domain, {
    lang: opts?.lang,
    category: opts?.category,
  });
  const lang = d.lang || "en";

  // Cachea si hubo detección y el crawl no falló del todo. Guard mínimo a propósito:
  // un umbral alto bloqueaba sitios reales con shell liviano (DTC moderno) — que
  // igual detectan bien — dejándolos sin trend. Solo saltamos el fallo total de
  // crawl ("" → detección sobre cero data, no confiable → que reintente el re-scan).
  if (d.prompts.length && crawlData.length > 0) {
    await cacheVertical(key, { category: d.category, lang, prompts: d.prompts });
  }

  return dynamicConfig(d.category, lang, d.prompts);
}
