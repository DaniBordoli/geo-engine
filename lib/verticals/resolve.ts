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
//  - dominio ya cacheado (sin override) → REUSA las mismas preguntas (trend real),
//    sin crawl ni detección.
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

  const key = domainKey(domain);
  const hasOverride = Boolean(opts?.lang || opts?.category);

  // Reuso: mismo dominio, sin override → mismas preguntas que la primera vez.
  if (!hasOverride) {
    const cached = await getCachedVertical(key);
    if (cached) return dynamicConfig(cached.category, cached.lang, cached.prompts);
  }

  const crawlData = await fetchSiteText(domain);
  const d = await detectVertical(crawlData, domain, {
    lang: opts?.lang,
    category: opts?.category,
  });
  const lang = d.lang || "en";

  // Cachea SOLO la detección canónica (sin override) y SOLO si el crawl trajo
  // contenido real: un shell vacío da detección poco fiable, y como el cache es
  // write-once no querés fijar basura permanente — dejá que un re-scan reintente.
  const MIN_CRAWL = 300; // mismo umbral "thin" que crawl.ts
  if (!hasOverride && d.prompts.length && crawlData.length >= MIN_CRAWL) {
    await cacheVertical(key, { category: d.category, lang, prompts: d.prompts });
  }

  return dynamicConfig(d.category, lang, d.prompts);
}
