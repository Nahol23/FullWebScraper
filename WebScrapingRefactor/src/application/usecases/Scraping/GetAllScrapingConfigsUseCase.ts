import type { IScrapingConfigRepository } from "../../../domain/ports/ScrapingConfig/IScrapingConfigRepository";
import type { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";

export class GetAllScrapingConfigsUseCase {
  constructor(private readonly scrapingConfigRepository: IScrapingConfigRepository) {}

  async execute(): Promise<ScrapingConfig[]> {
    return await this.scrapingConfigRepository.getAll();
  }
}