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
  /** Formatos del fix pack por vertical. */
  contentTemplates: string[];
  /** Canal (Shopify App Store, comunidad LatAm, Semrush App Center). */
  distribution: string;
};
