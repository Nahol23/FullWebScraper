import type { IScrapingConfigRepository } from "../../../domain/ports/scraping/IScrapingConfigRepository";
import { ConfigNotFoundError } from "../../../domain/errors/AppError";

export class DeleteScrapingConfigUseCase {
  constructor(
    private readonly scrapingConfigRepository: IScrapingConfigRepository,
  ) {}

  
  async execute(configId: string): Promise<void> {
    if (!configId) {
      throw new ConfigNotFoundError(configId);
    }
    await this.scrapingConfigRepository.delete(configId);
  }
}