import type { IScrapingExecutionRepository } from "../../../domain/ports/scraping/IScrapingExecutionRepository";

export class DeleteScrapingExecutionUseCase {
  constructor(private readonly scrapingExecutionRepository: IScrapingExecutionRepository) {}

  async execute(configId: string, executionId: string): Promise<void> {
    await this.scrapingExecutionRepository.deleteLog(configId, executionId);
  }
}