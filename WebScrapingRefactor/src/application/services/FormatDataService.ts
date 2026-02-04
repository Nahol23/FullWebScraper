import { flattenObject } from '../../infrastructure/utils/ObjectUtils';

export class FormatDataService {
  
  /**
   * Genera l'Header della tabella Markdown (le prime due righe)
   */
  getMarkdownHeader(data: any[], selectedFields: string[] = []): string {
    if (!data.length) return "";
    
    // Se l'utente non ha selezionato campi, prendiamo tutte le chiavi del primo oggetto appiattito
    const flatItem = flattenObject(data[0]);
    const headers = selectedFields.length > 0 ? selectedFields : Object.keys(flatItem);
    
    const headerRow = `| ${headers.join(" | ")} |`;
    const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;
    
    return `${headerRow}\n${separatorRow}\n`;
  }

  toMarkdown(data: any[], selectedFields: string[] = []): string {
    if (!data.length) return "";

    const flatData = data.map(item => flattenObject(item));
    
    // Determina le colonne (devono essere coerenti con l'header)
    const headers = selectedFields.length > 0 
      ? selectedFields 
      : Object.keys(flatData[0] || {});

    return flatData.map(item => {
      return `| ${headers.map(h => {
        // Gestione valori null/undefined e escape caratteri speciali
        const val = item[h] ?? "-";
        return String(val)
            .replace(/\n/g, " ")  // Rimuove a capo
            .replace(/\|/g, "\\|"); // Escapa i pipe |
      }).join(" | ")} |`;
    }).join("\n");
  }
}