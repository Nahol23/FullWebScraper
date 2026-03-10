import type { IScrapingExecutionRepository } from "../../../domain/ports/scraping/IScrapingExecutionRepository";

export class ExecuteScrapingByNameUseCase {
  constructor(private readonly scrapingExecutionRepository: IScrapingExecutionRepository) {}

  async execute(configName: string, runtimeParams?: any): Promise<any> {
    return await this.scrapingExecutionRepository.executeByName(configName, runtimeParams);
  }
}