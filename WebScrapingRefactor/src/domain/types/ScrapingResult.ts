export interface ScrapingResult {
  items: Record<string, unknown>[];
  nextPageUrl: string | null;
  pagesScraped: number;
}
