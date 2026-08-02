// Contratos del fix pack (Semana 2, lo que se cobra).
// Ver PROPOSAL.md § Tasks Semana 2.

export type FixCategory =
  | "citable-content"
  | "schema-markup"
  | "off-site-action";

export type FixItem = {
  category: FixCategory;
  /** El prompt/gap perdido que este fix ataca. */
  gap: string;
  /** Causa diagnosticada (sin contenido, ausente en fuentes, falta schema…). */
  cause: string;
  title: string;
  /** Draft accionable: contenido citable, schema, o acción off-site. */
  body: string;
  /** Prioridad por impacto/esfuerzo (más alto = antes). */
  priority: number;
};

export type FixPack = {
  scanId: string;
  items: FixItem[];
  generatedAt: string;
};
