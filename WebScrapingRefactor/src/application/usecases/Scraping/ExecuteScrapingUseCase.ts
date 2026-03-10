import { ScrapingAdapter } from "../../../infrastructure/adapters/Scraping/ScrapingAdapter";
import type {
  ScrapingConfig,
  ExtractionRule,
} from "../../../domain/entities/ScrapingConfig";
import { ConfigNotFoundError } from "../../../domain/errors/AppError";
import { randomUUID } from "crypto";
import { IScrapingExecutionRepository } from "../../../domain/ports/ScrapingConfig/IScrapingExecutionRepository";
import { IScrapingConfigRepository } from "../../../domain/ports/ScrapingConfig/IScrapingConfigRepository";

export interface ExecuteScrapingResult {
  data: Record<string, any>[];
  meta: {
    totalPages?: number;
    currentPage?: number;
    itemsPerPage?: number;
    totalItems?: number;
  };
}

export class ExecuteScrapingUseCase {
  constructor(
    private readonly scrapingConfigRepository: IScrapingConfigRepository,
    private readonly scrapingExecutionRepository: IScrapingExecutionRepository,
    private readonly scrapingAdapter: ScrapingAdapter,
  ) {}

  async execute(
    configId: string,
    runtimeParams?: any,
  ): Promise<ExecuteScrapingResult> {
    const config = await this.scrapingConfigRepository.getById(configId);
    if (!config) {
      throw new ConfigNotFoundError(configId, "Scraping configuration");
    }

    const mergedConfig = this.mergeRuntimeParams(config, runtimeParams);
    const startTime = Date.now();

    try {
      let allData: Record<string, any>[] = [];
      let currentPage = 1;
      const maxPages = mergedConfig.pagination?.maxPages || 1;
      let nextUrl: string | null = mergedConfig.url;

      while (nextUrl && currentPage <= maxPages) {
        const options = {
          url: nextUrl,
          method: mergedConfig.method,
          headers: mergedConfig.headers,
          body: mergedConfig.body,
          waitForSelector: mergedConfig.waitForSelector,
          rules: mergedConfig.rules,
          useJavaScript: !!(
            mergedConfig.waitForSelector ||
            mergedConfig.pagination?.type === "nextSelector"
          ),
          containerSelector: mergedConfig.containerSelector,
        };

        const pageData = await this.scrapingAdapter.scrape(options);
        const items = this.normalizeData(
          pageData,
          mergedConfig.rules,
          mergedConfig.containerSelector,
        );

        allData = allData.concat(items);
        nextUrl = await this.getNextUrl(mergedConfig, options.url, pageData);
        currentPage++;
      }

      const result: ExecuteScrapingResult = {
        data: allData,
        meta: {
          totalPages: currentPage - 1,
          currentPage: 1,
          itemsPerPage: allData.length,
          totalItems: allData.length,
        },
      };

      await this.scrapingExecutionRepository.save({
        id: randomUUID(),
        configId,
        timestamp: new Date(),
        url: mergedConfig.url,
        rulesUsed: mergedConfig.rules,
        result,
        resultCount: allData.length,
        status: "success" as const,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      await this.scrapingExecutionRepository.save({
        id: randomUUID(),
        configId,
        timestamp: new Date(),
        url: mergedConfig.url,
        rulesUsed: mergedConfig.rules,
        result: { error: (error as Error).message },
        resultCount: 0,
        status: "error" as const,
        errorMessage: (error as Error).message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  private mergeRuntimeParams(
    config: ScrapingConfig,
    runtimeParams?: any,
  ): ScrapingConfig {
    if (!runtimeParams) return config;

    const merged: ScrapingConfig = {
      ...config,
      url: runtimeParams.url ?? config.url,
      method: runtimeParams.method ?? config.method,
      headers: { ...config.headers, ...runtimeParams.headers },
      body: runtimeParams.body ?? config.body,
      waitForSelector: runtimeParams.waitForSelector ?? config.waitForSelector,
      rules: runtimeParams.rules ?? config.rules,
      pagination: runtimeParams.pagination
        ? { ...config.pagination, ...runtimeParams.pagination }
        : config.pagination,
      containerSelector:
        runtimeParams.containerSelector ?? config.containerSelector,
    };

    if (config.defaultRuntimeParams) {
      merged.url =
        runtimeParams?.url ?? config.defaultRuntimeParams.url ?? config.url;
      merged.waitForSelector =
        runtimeParams?.waitForSelector ??
        config.defaultRuntimeParams.waitForSelector ??
        config.waitForSelector;
      merged.rules =
        runtimeParams?.rules ??
        config.defaultRuntimeParams.rules ??
        config.rules;
      merged.containerSelector =
        runtimeParams?.containerSelector ??
        config.defaultRuntimeParams.containerSelector ??
        config.containerSelector;

      const maxPages =
        runtimeParams?.maxPages ?? config.defaultRuntimeParams.maxPages;
      if (maxPages !== undefined) {
        merged.pagination = {
          ...(merged.pagination || { type: "urlParam" }),
          maxPages,
        };
      }
    }

    return merged;
  }

  /**
   * Normalizes raw page data into an array of objects.
   *
   * Three cases:
   *
   * 1. containerSelector present → HtmlExtractor already returned
   *    Record<string,any>[] (one object per container). Pass through directly.
   *
   * 2. No containerSelector, rules have multiple:true → pageData is a flat
   *    object where each key holds an array of values (parallel arrays).
   *    Zip them into one object per index.
   *
   * 3. No containerSelector, no multiple rules → pageData is a single flat
   *    object. Return it as a single-element array.
   */
  private normalizeData(
    pageData: any,
    rules: ExtractionRule[],
    containerSelector?: string,
  ): Record<string, any>[] {
    if (!pageData) return [];

    // Case 1 — container mode: extractor already returned array
    if (containerSelector) {
      return Array.isArray(pageData) ? pageData : [];
    }

    if (!rules || rules.length === 0) return [];

    // Case 2 — flat mode with multiple:true rules (parallel arrays)
    const multipleRules = rules.filter((r) => r.multiple);
    if (multipleRules.length > 0) {
      // Find the longest array to drive the zip
      let maxLength = 0;
      for (const rule of multipleRules) {
        const val = pageData[rule.fieldName];
        if (Array.isArray(val) && val.length > maxLength) {
          maxLength = val.length;
        }
      }

      if (maxLength === 0) {
        // Arrays are all empty — fall through to Case 3
      } else {
        const items: Record<string, any>[] = [];
        for (let i = 0; i < maxLength; i++) {
          const item: Record<string, any> = {};
          for (const rule of rules) {
            if (rule.multiple && Array.isArray(pageData[rule.fieldName])) {
              item[rule.fieldName] = pageData[rule.fieldName][i] ?? "";
            } else {
              // Scalar fields are repeated on every row
              item[rule.fieldName] = pageData[rule.fieldName] ?? "";
            }
          }
          items.push(item);
        }
        return items;
      }
    }

    // Case 3 — single flat object
    if (typeof pageData === "object" && !Array.isArray(pageData)) {
      return [pageData];
    }

    return [];
  }

  private async getNextUrl(
    config: ScrapingConfig,
    currentUrl: string,
    pageData: any,
  ): Promise<string | null> {
    if (!config.pagination) return null;

    const { type, selector, paramName } = config.pagination;

    if (type === "nextSelector" && selector) {
      return null; // not yet implemented
    }

    if (type === "urlParam" && paramName) {
      try {
        const url = new URL(currentUrl);
        const currentPage = parseInt(
          url.searchParams.get(paramName) || "1",
          10,
        );
        url.searchParams.set(paramName, (currentPage + 1).toString());
        return url.toString();
      } catch {
        return null;
      }
    }

    return null;
  }
}