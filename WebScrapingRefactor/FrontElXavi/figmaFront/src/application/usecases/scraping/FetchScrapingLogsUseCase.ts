import type { IScrapingExecutionRepository } from "../../../domain/ports/scraping/IScrapingExecutionRepository";
import type { ScrapingExecution } from "../../../domain/entities/ScrapingExecution";

export class FetchScrapingLogsUseCase {
  constructor(private readonly scrapingExecutionRepository: IScrapingExecutionRepository) {}

  async execute(configId: string, limit?: number): Promise<ScrapingExecution[]> {
    return await this.scrapingExecutionRepository.getLogsByConfig(configId, limit);
  }
}