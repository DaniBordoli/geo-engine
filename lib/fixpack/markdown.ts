import type { FixItem, FixPack } from "./types";

const LABEL: Record<FixItem["category"], string> = {
  "citable-content": "Contenido citable",
  "schema-markup": "Schema markup",
  "off-site-action": "Acciones off-site",
};

// Export del fix pack a Markdown (entregable / listo para PR).
export function fixPackToMarkdown(pack: FixPack, domain: string): string {
  const lines: string[] = [
    `# Fix pack — ${domain}`,
    ``,
    `Generado: ${pack.generatedAt} · ${pack.items.length} acciones priorizadas.`,
    ``,
  ];
  pack.items.forEach((item, i) => {
    lines.push(
      `## ${i + 1}. ${item.title}`,
      ``,
      `**Tipo:** ${LABEL[item.category]} · **Prioridad:** ${item.priority}`,
      ``,
      `**Gap:** ${item.gap}`,
      ``,
      `**Causa:** ${item.cause}`,
      ``,
      item.body,
      ``,
    );
  });
  return lines.join("\n");
}
