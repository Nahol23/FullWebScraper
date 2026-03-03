import { ScrapingAdapter } from "../../../infrastructure/adapters/Scraping/ScrapingAdapter";
import type { ScrapingConfig, ExtractionRule } from "../../../domain/entities/ScrapingConfig";
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

  async execute(configId: string, runtimeParams?: any): Promise<ExecuteScrapingResult> {
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
          useJavaScript: !!(mergedConfig.waitForSelector || mergedConfig.pagination?.type === 'nextSelector'),
          containerSelector: mergedConfig.containerSelector, // passiamo il containerSelector all'adapter
        };

        const pageData = await this.scrapingAdapter.scrape(options);
        const items = this.normalizeData(pageData, mergedConfig.rules, mergedConfig.containerSelector);
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

      // Salva esecuzione riuscita
      const executionEntity = {
        id: randomUUID(),
        configId,
        timestamp: new Date(),
        url: mergedConfig.url,
        rulesUsed: mergedConfig.rules,
        result,
        resultCount: allData.length,
        status: 'success' as const,
        duration: Date.now() - startTime,
      };
      await this.scrapingExecutionRepository.save(executionEntity);

      return result;
    } catch (error) {
      // Salva esecuzione fallita
      const executionEntity = {
        id: randomUUID(),
        configId,
        timestamp: new Date(),
        url: mergedConfig.url,
        rulesUsed: mergedConfig.rules,
        result: { error: (error as Error).message },
        resultCount: 0,
        status: 'error' as const,
        errorMessage: (error as Error).message,
        duration: Date.now() - startTime,
      };
      await this.scrapingExecutionRepository.save(executionEntity);
      throw error;
    }
  }

  /**
   * Unisce i parametri runtime con la configurazione base, tenendo conto anche dei defaultRuntimeParams.
   */
  private mergeRuntimeParams(config: ScrapingConfig, runtimeParams?: any): ScrapingConfig {
    if (!runtimeParams) return config;

    const merged: ScrapingConfig = {
      ...config,
      url: runtimeParams.url ?? config.url,
      method: runtimeParams.method ?? config.method,
      headers: { ...config.headers, ...runtimeParams.headers },
      body: runtimeParams.body ?? config.body,
      waitForSelector: runtimeParams.waitForSelector ?? config.waitForSelector,
      rules: runtimeParams.rules ?? config.rules,
      pagination: runtimeParams.pagination ? { ...config.pagination, ...runtimeParams.pagination } : config.pagination,
      containerSelector: runtimeParams.containerSelector ?? config.containerSelector,
    };

    // Sovrascrittura con defaultRuntimeParams se presenti (ma solo se non già sovrascritti da runtimeParams)
    if (config.defaultRuntimeParams) {
      merged.url = runtimeParams?.url ?? config.defaultRuntimeParams.url ?? config.url;
      merged.waitForSelector = runtimeParams?.waitForSelector ?? config.defaultRuntimeParams.waitForSelector ?? config.waitForSelector;
      merged.rules = runtimeParams?.rules ?? config.defaultRuntimeParams.rules ?? config.rules;
      merged.containerSelector = runtimeParams?.containerSelector ?? config.defaultRuntimeParams.containerSelector ?? config.containerSelector;

      const maxPages = runtimeParams?.maxPages ?? config.defaultRuntimeParams.maxPages;
      if (maxPages !== undefined) {
        merged.pagination = {
          ...(merged.pagination || { type: 'urlParam' }),
          maxPages,
        };
      }
    }

    return merged;
  }

  /**
   * Normalizza i dati estratti in un array di oggetti.
   * Se è stato usato un containerSelector, ci aspettiamo che pageData sia già un array di oggetti.
   * Altrimenti, se le regole hanno campi multipli, li trasforma in array paralleli.
   */
  private normalizeData(
    pageData: any,
    rules: ExtractionRule[],
    containerSelector?: string
  ): Record<string, any>[] {
    if (!pageData) return [];

    // Se abbiamo usato un containerSelector, l'adapter ha già restituito un array di oggetti
    if (containerSelector) {
      return Array.isArray(pageData) ? pageData : [];
    }

    // Altrimenti, gestiamo il caso di regole multiple (array paralleli)
    if (rules.length === 0) return [];

    const hasMultiple = rules.some(r => r.multiple);
    if (hasMultiple) {
      const firstMultipleField = rules.find(r => r.multiple)?.fieldName;
      if (firstMultipleField && Array.isArray(pageData[firstMultipleField])) {
        const length = pageData[firstMultipleField].length;
        const items: Record<string, any>[] = [];
        for (let i = 0; i < length; i++) {
          const item: Record<string, any> = {};
          for (const rule of rules) {
            if (rule.multiple && Array.isArray(pageData[rule.fieldName])) {
              item[rule.fieldName] = pageData[rule.fieldName][i];
            } else {
              // Campi singoli vengono ripetuti per ogni elemento
              item[rule.fieldName] = pageData[rule.fieldName];
            }
          }
          items.push(item);
        }
        return items;
      }
    }

    // Se non ci sono multipli, restituiamo un array con un singolo oggetto
    return [pageData];
  }

  /**
   * Calcola la prossima URL per la paginazione, se configurata.
   */
  private async getNextUrl(config: ScrapingConfig, currentUrl: string, pageData: any): Promise<string | null> {
    if (!config.pagination) return null;

    const { type, selector, paramName } = config.pagination;

    // Paginazione tramite selettore del link "successivo" (non implementata)
    if (type === 'nextSelector' && selector) {
      // Per ora non implementata; in futuro potremmo estrarre l'URL dalla pagina
      return null;
    }

    // Paginazione tramite parametro URL (es. ?page=2)
    if (type === 'urlParam' && paramName) {
      try {
        const url = new URL(currentUrl);
        const currentPage = parseInt(url.searchParams.get(paramName) || '1', 10);
        url.searchParams.set(paramName, (currentPage + 1).toString());
        return url.toString();
      } catch {
        // Se l'URL non è valido, restituiamo null
        return null;
      }
    }

    return null;
  }
}