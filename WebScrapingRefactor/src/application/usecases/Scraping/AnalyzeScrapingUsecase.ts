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
  sampleData: unknown;
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

      // 2) Sample — regola più rappresentativa, niente paginazione
      const primaryRule =
        rules.find((r) => /title|name/i.test(r.fieldName)) ?? rules[0];
      const sampleRules = primaryRule
        ? [{ ...primaryRule, multiple: false }]
        : rules.map((r) => ({ ...r, multiple: false }));

      const baseOptions = {
        url,
        method: options?.method,
        headers: options?.headers,
        body: options?.body,
        useJavaScript: options?.useJavaScript,
        waitForSelector: options?.waitForSelector,
        rules: sampleRules,
        // Nessuna pagination per il sample: vogliamo solo la prima pagina
      };

      // items è Record<string, unknown>[]
      let { items } = await this.scraper.scrape({
        ...baseOptions,
        containerSelector,
      });

      // 3) Fallback se items è vuoto
      if (items.length === 0 && containerSelector) {
        ({ items } = await this.scraper.scrape(baseOptions));
      }

      // 4) sampleData: già un array tipizzato, nessun cast necessario
      const sampleData: unknown[] =
        items.length > 0 ? items : [];

      // 5) Raw preview per debugging
      const rawPreview = JSON.stringify(sampleData, null, 2).slice(0, 2000);

      const result: ScrapingAnalysisResult = {
        url,
        title: analysis.title,
        suggestedRules: rules,
        sampleData,
        detectedListSelectors: analysis.listSelectors,
        rawPreview,
      };

      // 6) Salvataggio analisi
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