import type { IScrapingPort } from "../../../domain/ports/IScrapingPort";
import type { IScrapingAnalyzerPort, AnalyzeOptions } from "../../../domain/ports/IScrapingAnalyzerPort";
import type { IScrapingAnalysisRepository } from "../../../domain/ports/ScrapingConfig/IScrapingAnalysisRepository";
import type { ExtractionRule } from "../../../domain/entities/ScrapingConfig";
import { randomUUID } from "crypto";

export interface ScrapingAnalysisResult {
  url: string;
  title: string;
  suggestedRules: ExtractionRule[];
  sampleData: Record<string, any>;
  detectedListSelectors: string[];
  rawPreview?: string;
}

export { AnalyzeOptions };

/**
 * Non conosce Cheerio, fetch, Puppeteer o HTML grezzo.
 * Dipende solo da tre port del dominio.
 */
export class AnalyzeScrapingUseCase {
  constructor(
    private readonly scraper: IScrapingPort,
    private readonly domAnalyzer: IScrapingAnalyzerPort,
    private readonly analysisRepository: IScrapingAnalysisRepository,
  ) {}

  async execute(url: string, options?: AnalyzeOptions): Promise<ScrapingAnalysisResult> {
    try {
      // 1. Fetch + analisi DOM — nessuna conoscenza di Cheerio o HTML grezzo
      const analysis = await this.domAnalyzer.fetchAndAnalyze(url, options);
      const sampleRules = analysis.suggestedRules.slice(0, 5);

      // 2. Estrazione campione con le regole suggerite
      const sampleData = await this.scraper.scrape({
        url,
        method: options?.method,
        headers: options?.headers,
        body: options?.body,
        useJavaScript: options?.useJavaScript,
        waitForSelector: options?.waitForSelector,
        rules: sampleRules,
      });

      const result: ScrapingAnalysisResult = {
        url,
        title: analysis.title,
        suggestedRules: analysis.suggestedRules,
        sampleData,
        detectedListSelectors: analysis.listSelectors,
      };

      await this.analysisRepository.save({
        id: randomUUID(),
        url,
        timestamp: new Date(),
        options,
        result,
        status: "completed",
      });

      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      await this.analysisRepository.save({
        id: randomUUID(),
        url,
        timestamp: new Date(),
        options,
        result: { error: errorMessage },
        status: "failed",
        errorMessage,
      });
      throw error;
    }
  }
}