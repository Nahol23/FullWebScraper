import type { IScrapingPort } from "../../../domain/ports/IScrapingPort";
import type {
  ScrapingConfig,
  ScrapingRuntimeParams,
} from "../../../domain/entities/ScrapingConfig";
import type { IScrapingExecutionRepository } from "../../../domain/ports/ScrapingConfig/IScrapingExecutionRepository";
import type { IScrapingConfigRepository } from "../../../domain/ports/ScrapingConfig/IScrapingConfigRepository";
import { ConfigNotFoundError } from "../../../domain/errors/AppError";
import { ScrapingDataNormalizer } from "../../../domain/services/ScrapingDataNormalizer";
import { randomUUID } from "crypto";

export interface ExecuteScrapingResult {
  data: Record<string, unknown>[];
  /** null = scraping completato | stringa = URL per il resume */
  nextPageUrl: string | null;
  meta: {
    pagesScraped: number;
    totalItems: number;
  };
}

export class ExecuteScrapingUseCase {
  private readonly normalizer = new ScrapingDataNormalizer();

  constructor(
    private readonly scrapingConfigRepository: IScrapingConfigRepository,
    private readonly scrapingExecutionRepository: IScrapingExecutionRepository,
    private readonly scrapingAdapter: IScrapingPort,
  ) {}

  async execute(
    configId: string,
    runtimeParams?: ScrapingRuntimeParams,
  ): Promise<ExecuteScrapingResult> {
    const config = await this.scrapingConfigRepository.getById(configId);
    if (!config) {
      throw new ConfigNotFoundError(configId, "Scraping configuration");
    }

    const mergedConfig = this.mergeRuntimeParams(config, runtimeParams);
    const startTime = Date.now();

    try {
      const result = await this.runScraping(mergedConfig);

      await this.scrapingExecutionRepository.save({
        id: randomUUID(),
        configId,
        timestamp: new Date(),
        url: mergedConfig.url,
        rulesUsed: mergedConfig.rules,
        result,
        resultCount: result.data.length,
        status: "success",
        duration: Date.now() - startTime,
        totalItems: 0,
        nextPageUrl: result.nextPageUrl,
        pagesScraped: result.meta.pagesScraped,
      });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";

      await this.scrapingExecutionRepository.save({
        id: randomUUID(),
        configId,
        timestamp: new Date(),
        url: mergedConfig.url,
        rulesUsed: mergedConfig.rules,
        result: { error: message },
        resultCount: 0,
        status: "error",
        errorMessage: message,
        duration: Date.now() - startTime,
        totalItems: 0,
        nextPageUrl: null,
        pagesScraped: 0,
      });

      throw error;
    }
  }

  /**
   * L'adapter gestisce interamente il loop di paginazione e il resume.
   * Il use case chiama scrape() una sola volta con la config completa.
   */
  private async runScraping(
    config: ScrapingConfig,
  ): Promise<ExecuteScrapingResult> {
    const { items, nextPageUrl, pagesScraped } =
      await this.scrapingAdapter.scrape({
        url: config.url,
        method: config.method,
        headers: config.headers,
        body: config.body,
        waitForSelector: config.waitForSelector,
        rules: config.rules,
        useJavaScript: !!(
          config.waitForSelector || config.pagination?.type === "nextSelector"
        ),
        containerSelector: config.containerSelector,
        pagination: config.pagination,
      });

    const data = this.normalizer.normalize(
      items,
      config.rules,
      config.containerSelector,
    );

    return {
      data,
      nextPageUrl,
      meta: {
        pagesScraped,
        totalItems: data.length,
      },
    };
  }

  /**
   * Fonde la config salvata con i runtimeParams della singola esecuzione.
   * startPage e resumeFromUrl vengono propagati nella pagination config
   * in modo che ScrapingAdapter.resolveStartUrl() li legga correttamente.
   */
  private mergeRuntimeParams(
    config: ScrapingConfig,
    runtimeParams?: ScrapingRuntimeParams,
  ): ScrapingConfig {
    if (!runtimeParams) return config;

    const maxPages =
      runtimeParams.maxPages ?? config.defaultRuntimeParams?.maxPages;

    const basePagination = config.pagination;
    const mergedPagination: ScrapingConfig["pagination"] = basePagination
      ? {
          type: basePagination.type,
          selector: basePagination.selector,
          paramName: basePagination.paramName,
          maxPages: maxPages ?? basePagination.maxPages,
          // resume fields
          startPage: runtimeParams.startPage,
          resumeFromUrl: runtimeParams.resumeFromUrl,
        }
      : maxPages !== undefined
        ? { type: "urlParam", maxPages }
        : undefined;

    return {
      ...config,
      waitForSelector:
        runtimeParams.waitForSelector ??
        config.defaultRuntimeParams?.waitForSelector ??
        config.waitForSelector,
      rules:
        runtimeParams.rules ??
        config.defaultRuntimeParams?.rules ??
        config.rules,
      containerSelector:
        runtimeParams.containerSelector ??
        config.defaultRuntimeParams?.containerSelector ??
        config.containerSelector,
      pagination: mergedPagination,
    };
  }
}
