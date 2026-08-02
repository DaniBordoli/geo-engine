import type { VerticalConfig } from "./types";
import { ecommerce } from "./ecommerce";

export type { VerticalConfig } from "./types";

// Registro de verticales disponibles. Se suma un archivo por wedge.
export const verticals: Record<string, VerticalConfig> = {
  [ecommerce.id]: ecommerce,
};

export function getVertical(id: string): VerticalConfig | undefined {
  return verticals[id];
}
