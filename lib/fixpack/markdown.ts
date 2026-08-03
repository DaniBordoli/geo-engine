import type { FixItem, FixPack } from "./types";

const LABEL: Record<FixItem["category"], string> = {
  "citable-content": "Citable content",
  "schema-markup": "Schema markup",
  "off-site-action": "Off-site actions",
};

// Export del fix pack a Markdown (entregable / listo para PR).
export function fixPackToMarkdown(pack: FixPack, domain: string): string {
  const lines: string[] = [
    `# Fix pack — ${domain}`,
    ``,
    `Generated: ${pack.generatedAt} · ${pack.items.length} prioritized actions.`,
    ``,
  ];
  pack.items.forEach((item, i) => {
    lines.push(
      `## ${i + 1}. ${item.title}`,
      ``,
      `**Type:** ${LABEL[item.category]} · **Priority:** ${item.priority}`,
      ``,
      `**Gap:** ${item.gap}`,
      ``,
      `**Cause:** ${item.cause}`,
      ``,
      item.body,
      ``,
    );
  });
  return lines.join("\n");
}
