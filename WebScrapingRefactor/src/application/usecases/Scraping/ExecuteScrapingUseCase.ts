import { IScrapingPort} from "../../../domain/ports/IScrapingPort";
import type { ScrapingConfig, ScrapingRuntimeParams } from "../../../domain/entities/ScrapingConfig";
import { ConfigNotFoundError } from "../../../domain/errors/AppError";
import { randomUUID } from "crypto";
import { IScrapingExecutionRepository } from "../../../domain/ports/ScrapingConfig/IScrapingExecutionRepository";
import { IScrapingConfigRepository } from "../../../domain/ports/ScrapingConfig/IScrapingConfigRepository";
import { ScrapingDataNormalizer } from "../../../domain/services/ScrapingDataNormalizer";
import { PaginationStrategyFactory } from "../../../domain/services/pagination/PaginationStrategyFactory";

export interface ExecuteScrapingResult {
  data: Record<string, unknown>[];
  meta: {
    totalPages?: number;
    currentPage?: number;
    itemsPerPage?: number;
    totalItems?: number;
  };
}

export class ExecuteScrapingUseCase {
  private readonly normalizer = new ScrapingDataNormalizer();

  constructor(
    private readonly scrapingConfigRepository: IScrapingConfigRepository,
    private readonly scrapingExecutionRepository: IScrapingExecutionRepository,
    private readonly scrapingAdapter: IScrapingPort,
  ) {}

  async execute(configId: string, runtimeParams?: ScrapingRuntimeParams): Promise<ExecuteScrapingResult> {
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
      });

      throw error;
    }
  }

  private async runScraping(config: ScrapingConfig): Promise<ExecuteScrapingResult> {
    const paginationStrategy = PaginationStrategyFactory.create(config.pagination);
    const maxPages = config.pagination?.maxPages ?? 1;

    let allData: Record<string, unknown>[] = [];
    let currentPage = 1;
    let nextUrl: string | null = config.url;

    while (nextUrl && currentPage <= maxPages) {
      const options = {
        url: nextUrl,
        method: config.method,
        headers: config.headers,
        body: config.body,
        waitForSelector: config.waitForSelector,
        rules: config.rules,
        useJavaScript: !!(config.waitForSelector || config.pagination?.type === "nextSelector"),
        containerSelector: config.containerSelector,
      };

      const pageData = await this.scrapingAdapter.scrape(options);
      console.log("=== pageData raw ===", JSON.stringify(pageData, null, 2));
      const items = this.normalizer.normalize(pageData, config.rules, config.containerSelector);
      allData = allData.concat(items);

      nextUrl = paginationStrategy ? await paginationStrategy.getNextUrl(nextUrl) : null;
      currentPage++;
    }

    return {
      data: allData,
      meta: {
        totalPages: currentPage - 1,
        currentPage: 1,
        itemsPerPage: allData.length,
        totalItems: allData.length,
      },
    };
  }

  private mergeRuntimeParams(config: ScrapingConfig, runtimeParams?: ScrapingRuntimeParams): ScrapingConfig {
    if (!runtimeParams) return config;

    const maxPages = runtimeParams.maxPages ?? config.defaultRuntimeParams?.maxPages;

    const mergedPagination: ScrapingConfig["pagination"] = config.pagination
      ? {
          type: config.pagination.type,
          selector: config.pagination.selector,
          paramName: config.pagination.paramName,
          maxPages: maxPages ?? config.pagination.maxPages,
        }
      : maxPages !== undefined
        ? { type: "urlParam", maxPages }
        : undefined;

    return {
      id: config.id,
      name: config.name,
      url: config.url,
      method: config.method,
      headers: config.headers,
      body: config.body,
      dataPath: config.dataPath,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      defaultRuntimeParams: config.defaultRuntimeParams,
      waitForSelector: runtimeParams.waitForSelector ?? config.defaultRuntimeParams?.waitForSelector ?? config.waitForSelector,
      rules: runtimeParams.rules ?? config.defaultRuntimeParams?.rules ?? config.rules,
      containerSelector: runtimeParams.containerSelector ?? config.defaultRuntimeParams?.containerSelector ?? config.containerSelector,
      pagination: mergedPagination,
    };
  }
}