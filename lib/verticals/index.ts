import type { VerticalConfig } from "./types";
import { ecommerce } from "./ecommerce";
import { skincare } from "./skincare";

export type { VerticalConfig } from "./types";

// Registro de verticales disponibles. Se suma un archivo por wedge.
export const verticals: Record<string, VerticalConfig> = {
  [ecommerce.id]: ecommerce,
  [skincare.id]: skincare,
};

export function getVertical(id: string): VerticalConfig | undefined {
  return verticals[id];
}
