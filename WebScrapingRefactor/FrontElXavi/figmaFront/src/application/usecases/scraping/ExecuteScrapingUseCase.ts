import type { IScrapingExecutionRepository } from "../../../domain/ports/scraping/IScrapingExecutionRepository";

export class ExecuteScrapingUseCase {
  constructor(private readonly scrapingExecutionRepository: IScrapingExecutionRepository) {}

  async execute(configId: string, runtimeParams?: any): Promise<any> {
    return await this.scrapingExecutionRepository.execute(configId, runtimeParams);
  }
}