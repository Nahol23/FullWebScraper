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

      // 2) Estrazione SAMPLE — max 5 elementi, niente array paralleli

      // Per il sample usiamo solo la rule più rappresentativa (title/name o la prima)
      // e forziamo multiple:false per avere valori scalari, non array.
      const primaryRule =
        rules.find((r) => /title|name/i.test(r.fieldName)) ?? rules[0];
      const sampleRules = primaryRule
        ? [{ ...primaryRule, multiple: false }]
        : rules.map((r) => ({ ...r, multiple: false }));

      let rawData: any = await this.scraper.scrape({
        url,
        method: options?.method,
        headers: options?.headers,
        body: options?.body,
        useJavaScript: options?.useJavaScript,
        waitForSelector: options?.waitForSelector,
        rules: sampleRules,
        containerSelector,
      });

      // 3) Fallback se rawData è vuoto
      if (
        (!rawData || (Array.isArray(rawData) && rawData.length === 0)) &&
        containerSelector
      ) {
        rawData = await this.scraper.scrape({
          url,
          method: options?.method,
          headers: options?.headers,
          body: options?.body,
          useJavaScript: options?.useJavaScript,
          waitForSelector: options?.waitForSelector,
          rules: sampleRules,
        });
      }

      // Tronca a SAMPLE_LIMIT
      let sampleData: any;
      if (Array.isArray(rawData)) {
        sampleData = rawData.slice(0);
      } else if (
        rawData !== null &&
        typeof rawData === "object" &&
        !Array.isArray(rawData)
      ) {
        // Oggetto singolo o con chiavi numeriche — wrap in array e tronca
        const values = Object.keys(rawData).every((k) => !isNaN(Number(k)))
          ? (Object.values(rawData) as any[]).slice(0)
          : [rawData];
        sampleData = values;
      } else {
        sampleData = rawData;
      }

      // 4) Raw preview per debugging
      const rawPreview =
        typeof rawData === "string"
          ? rawData.slice(0, 2000)
          : JSON.stringify(rawData, null, 2).slice(0, 2000);

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
