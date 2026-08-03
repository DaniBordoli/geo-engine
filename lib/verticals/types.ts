// Contrato de configuración por vertical (wedge).
// Un config = un wedge: e-commerce, LatAm-español, SaaS global.
// Ver PROPOSAL.md § "Config de vertical (contrato)".

export type VerticalConfig = {
  /** "ecommerce" | "latam" | "saas" */
  id: string;
  lang: "en" | "es";
  /** Descriptor de categoría para el generador de prompts. */
  category: string;
  /** Descriptor del comprador (ICP). */
  icp: string;
  /** Plantillas: "mejor {X} para {caso}", "{marca} vs {competidor}". */
  promptArchetypes: string[];
  /**
   * Set fijo de prompts de categoría (brand-agnósticos). Si está presente, el
   * generador los usa verbatim para TODAS las marcas → share-of-voice comparable
   * head-to-head (necesario para un leaderboard honesto). Si no, se generan por marca.
   */
  fixedPrompts?: string[];
  /** Formatos del fix pack por vertical. */
  contentTemplates: string[];
  /** Canal (Shopify App Store, comunidad LatAm, Semrush App Center). */
  distribution: string;
};
