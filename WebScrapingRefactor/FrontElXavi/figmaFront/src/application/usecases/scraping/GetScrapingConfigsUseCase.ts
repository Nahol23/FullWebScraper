import type { IScrapingConfigRepository } from "../../../domain/ports/scraping/IScrapingConfigRepository";
import type { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";

export class GetScrapingConfigsUseCase {
  constructor(private readonly scrapingConfigRepository: IScrapingConfigRepository) {}

  async execute(): Promise<ScrapingConfig[]> {
    return await this.scrapingConfigRepository.getAll();
  }
}