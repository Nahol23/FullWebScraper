import type { IScrapingExecutionRepository } from "../../../domain/ports/ScrapingConfig/IScrapingExecutionRepository";
import type { IScrapingConfigRepository } from "../../../domain/ports/ScrapingConfig/IScrapingConfigRepository";
import type {
  ExecuteScrapingUseCase,
  ExecuteScrapingResult,
} from "./ExecuteScrapingUseCase";

export interface ResumeScrapingResult extends ExecuteScrapingResult {
  alreadyComplete: boolean;
}

export class ResumeScrapingUseCase {
  constructor(
    private readonly configRepo: IScrapingConfigRepository,
    private readonly executionRepo: IScrapingExecutionRepository,
    private readonly executeUseCase: ExecuteScrapingUseCase,
  ) {}

  async execute(
    configId: string,
    maxPages?: number,
  ): Promise<ResumeScrapingResult> {
    // 1. Ultima execution per questa config
    const executions = await this.executionRepo.findByConfigId(configId, 1, 0);
    const last = executions[0];

    if (!last) {
      throw new Error(`Nessuna execution trovata per configId "${configId}"`);
    }

    // 2. Scraping già completato
    if (last.nextPageUrl === null) {
      return {
        alreadyComplete: true,
        data: [],
        nextPageUrl: null,
        meta: { pagesScraped: 0, totalItems: 0 },
      };
    }

    // 3. Legge config per sapere il tipo di paginazione
    const config = await this.configRepo.getById(configId);
    if (!config) {
      throw new Error(`Configurazione "${configId}" non trovata`);
    }

    // 4. Costruisce runtimeParams dal nextPageUrl salvato
    const runtimeParams =
      config.pagination?.type === "urlParam"
        ? {
            maxPages,
            startPage: this.extractPageNumber(
              last.nextPageUrl,
              config.pagination.paramName,
            ),
          }
        : {
            maxPages,
            resumeFromUrl: last.nextPageUrl,
          };

    // 5. Delega all'ExecuteScrapingUseCase
    const result = await this.executeUseCase.execute(configId, runtimeParams);

    return { ...result, alreadyComplete: false };
  }

  private extractPageNumber(url: string, paramName?: string): number {
    if (!paramName) return 1;
    try {
      return parseInt(new URL(url).searchParams.get(paramName) ?? "1", 10);
    } catch {
      return 1;
    }
  }
}
