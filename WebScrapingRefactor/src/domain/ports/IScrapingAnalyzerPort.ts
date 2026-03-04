import type { ExtractionRule } from "../entities/ScrapingConfig";

export interface AnalyzeOptions {
  useJavaScript?: boolean;
  waitForSelector?: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
}

export interface DomAnalysisResult {
  title: string;
  suggestedRules: ExtractionRule[];
  listSelectors: string[];
}

/**
 * Port dedicato all'analisi DOM di una pagina.
 * Incapsula fetch + parsing HTML — nessun use case
 * conosce Cheerio, fetch o Puppeteer.
 */
export interface IScrapingAnalyzerPort {
  fetchAndAnalyze(url: string, options?: AnalyzeOptions): Promise<DomAnalysisResult>;
}