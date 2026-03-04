import type { ExtractionRule } from "../entities/ScrapingConfig";

export interface IHtmlExtractorPort {
  extract(
    html: string,
    rules: ExtractionRule[],
    containerSelector?: string,
  ): Record<string, any> | Record<string, any>[];
}