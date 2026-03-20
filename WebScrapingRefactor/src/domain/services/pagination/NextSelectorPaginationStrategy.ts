import * as cheerio from "cheerio";
import type { IPaginationStrategy } from "../../../domain/ports/IPaginationPort";

export class NextSelectorPaginationStrategy implements IPaginationStrategy {
  constructor(private readonly selector: string) {}

  async getNextUrl(currentUrl: string, html?: string): Promise<string | null> {
    if (!html) return null;

    const $ = cheerio.load(html);
    const href = $(this.selector).attr("href");
    if (!href) return null;

    try {
      return new URL(href, currentUrl).toString();
    } catch {
      return null;
    }
  }
}
