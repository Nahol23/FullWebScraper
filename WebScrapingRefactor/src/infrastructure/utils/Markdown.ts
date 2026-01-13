export function toMarkdownTable(data: any[], fields: string[]): string {
  if (data.length === 0) return "Nessun risultato trovato.";

  const header = `| ${fields.join(" | ")} |`;
  const separator = `| ${fields.map(() => "---").join(" | ")} |`;

  const rows = data.map(item =>
    `| ${fields.map(f => item[f] ?? "").join(" | ")} |`
  );

  return [header, separator, ...rows].join("\n");
}
