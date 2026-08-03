import type { VerticalConfig } from "./types";

// Wedge #1: skincare DTC. Usa un set FIJO de prompts de compra de categoría
// (brand-agnósticos) para que el share-of-voice sea comparable entre marcas —
// requisito del leaderboard head-to-head del teardown (ver TEARDOWN_skincare.md).
export const skincare: VerticalConfig = {
  id: "skincare",
  lang: "en",
  category: "skincare brands and products",
  icp: "shopper choosing skincare by skin concern, ingredient, or budget",
  promptArchetypes: [
    "best {product} for {skin_concern}",
    "best skincare brand for {skin_type}",
    "best {ingredient} product for {skin_concern}",
  ],
  fixedPrompts: [
    "What's the best vitamin C serum for brightening dull skin?",
    "Best affordable skincare brand for acne-prone skin under $30?",
    "Which brands make the best hyaluronic acid serum for dry, dehydrated skin?",
    "Best gentle cleanser for sensitive, easily irritated skin?",
    "What's the best retinol product for beginners worried about irritation?",
    "Best niacinamide serum to reduce large pores and oiliness?",
    "Which skincare brands are best for a simple 3-step routine for beginners?",
    "Best lightweight moisturizer for combination skin that won't feel greasy?",
    "What are the best Korean skincare brands for glass skin?",
    "Best chemical exfoliant (AHA or BHA) for clogged pores and blackheads?",
    "Which brands make the best fragrance-free skincare for reactive skin?",
    "Best anti-aging skincare for fine lines and wrinkles in your 30s?",
    "Best skincare brand for hyperpigmentation and dark spots?",
    "What's the best daily sunscreen for the face that doesn't leave a white cast?",
    "Best clean, non-toxic skincare brand for sensitive skin?",
  ],
  contentTemplates: [
    "ingredient-buyer-guide",
    "skin-concern-qa",
    "comparison-table",
  ],
  distribution: "r/SkincareAddiction, r/ecommerce, r/shopify, beauty X/Twitter",
};
