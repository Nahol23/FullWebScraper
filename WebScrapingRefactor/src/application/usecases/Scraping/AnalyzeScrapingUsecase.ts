import type { IScrapingPort } from "../../../domain/ports/IScrapingPort";
import type {
  IScrapingAnalyzerPort,
  AnalyzeOptions,
} from "../../../domain/ports/IScrapingAnalyzerPort";
import type { IScrapingAnalysisRepository } from "../../../domain/ports/ScrapingConfig/IScrapingAnalysisRepository";
import type { ExtractionRule } from "../../../domain/entities/ScrapingConfig";
import { randomUUID } from "crypto";

export interface ScrapingAnalysisResult {
  url: string;
  title: string;
  suggestedRules: ExtractionRule[];
  sampleData: any;
  detectedListSelectors: string[];
  rawPreview?: string;
}

export class AnalyzeScrapingUseCase {
  constructor(
    private readonly scraper: IScrapingPort,
    private readonly domAnalyzer: IScrapingAnalyzerPort,
    private readonly analysisRepository: IScrapingAnalysisRepository,
  ) {}

  async execute(
    url: string,
    options?: AnalyzeOptions,
  ): Promise<ScrapingAnalysisResult> {
    try {
      // 1) Analisi DOM generica
      const analysis = await this.domAnalyzer.fetchAndAnalyze(url, options);

      const containerSelector = analysis.listSelectors?.[0] ?? undefined;
      const rules = analysis.suggestedRules;

      // 2) Primo tentativo di estrazione
      // the scraper may return a string, array, object, etc.; use a loose type
      let sampleData: any = await this.scraper.scrape({
        url,
        method: options?.method,
        headers: options?.headers,
        body: options?.body,
        useJavaScript: options?.useJavaScript,
        waitForSelector: options?.waitForSelector,
        rules,
        containerSelector,
      });

      // 3) Fallback se sampleData è vuoto
      if (
        (!sampleData ||
          (Array.isArray(sampleData) && sampleData.length === 0)) &&
        containerSelector
      ) {
        // Prova senza containerSelector
        sampleData = await this.scraper.scrape({
          url,
          method: options?.method,
          headers: options?.headers,
          body: options?.body,
          useJavaScript: options?.useJavaScript,
          waitForSelector: options?.waitForSelector,
          rules,
        });
      }

      // 4) Raw preview per debugging
      const rawPreview =
        typeof sampleData === "string"
          ? sampleData.slice(0, 2000)
          : JSON.stringify(sampleData, null, 2).slice(0, 2000);

      const result: ScrapingAnalysisResult = {
        url,
        title: analysis.title,
        suggestedRules: rules,
        sampleData,
        detectedListSelectors: analysis.listSelectors,
        rawPreview,
      };

      // 5) Salvataggio analisi
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
