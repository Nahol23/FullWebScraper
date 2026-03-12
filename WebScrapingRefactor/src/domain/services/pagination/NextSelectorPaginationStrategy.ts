import type { IPaginationStrategy } from "../../ports/IPaginationPort";

/**
 * Stub — estrazione URL dal selettore "next" non ancora implementata.
 * In futuro dovrà ricevere il pageData dall'adapter e estrarre l'href dal selettore.
 */
export class NextSelectorPaginationStrategy implements IPaginationStrategy {
  constructor(private readonly selector: string) {}

  async getNextUrl(_currentUrl: string): Promise<string | null> {
    console.warn(`[NextSelectorPaginationStrategy] selettore "${this.selector}" non ancora implementato.`);
    return null;
  }
}