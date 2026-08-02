import type { VerticalConfig } from "./types";

// Placeholder. Se completa al lockear el wedge (fin de Semana 2).
// Ver PROPOSAL.md § "Secuencia de lanzamiento".
export const ecommerce: VerticalConfig = {
  id: "ecommerce",
  lang: "en",
  category: "e-commerce brands and products",
  icp: "online shopper comparing products before buying",
  promptArchetypes: [
    "best {category} for {use_case}",
    "{brand} vs {competitor}",
    "is {brand} worth it",
    "top {category} brands in {year}",
  ],
  contentTemplates: [
    "comparison-table",
    "buyer-guide-qa",
    "product-claims-sheet",
  ],
  distribution: "Shopify App Store",
};
