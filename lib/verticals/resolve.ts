import type { VerticalConfig } from "./types";
import { getVertical } from "./index";
import { ecommerce } from "./ecommerce";
import { fetchSiteText } from "@/lib/fixpack/crawl";
import { detectVertical } from "@/lib/agents/detect-vertical";

export type ResolveOpts = {
  /** Fuerza el modo teardown/estático (ej. "skincare" con fixedPrompts). */
  verticalId?: string;
  /** Overrides de la UI cuando la auto-detección no alcanza. */
  lang?: string;
  category?: string;
};

// Decide el config del vertical para un scan:
//  - verticalId conocido → config ESTÁTICO (modo teardown, sin tocar).
//  - si no → DINÁMICO: crawlea la web, detecta rubro+idioma y genera los prompts
//    de compra (brand-agnósticos) que van como `fixedPrompts` — así el generador
//    los usa verbatim (una sola llamada, sin brand-tailoring) y el SoV es comparable.
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

  const crawlData = await fetchSiteText(domain);
  const d = await detectVertical(crawlData, domain, {
    lang: opts?.lang,
    category: opts?.category,
  });

  return {
    id: "auto",
    lang: d.lang || "en",
    category: d.category,
    icp: d.icp,
    // En dinámico no usamos plantillas (los prompts ya vienen concretos).
    promptArchetypes: [],
    // Reutiliza el short-circuit del generador → prompts verbatim, brand-agnósticos.
    fixedPrompts: d.prompts,
    contentTemplates: ["comparison-table", "buyer-guide-qa", "product-claims-sheet"],
    distribution: "",
  };
}
