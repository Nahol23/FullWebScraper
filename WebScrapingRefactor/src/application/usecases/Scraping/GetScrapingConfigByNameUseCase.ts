import type { IScrapingConfigRepository } from "../../../domain/ports/ScrapingConfig/IScrapingConfigRepository";
import type { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";

export class GetScrapingConfigByNameUseCase {
  constructor(private readonly scrapingConfigRepository: IScrapingConfigRepository) {}

  async execute(name: string): Promise<ScrapingConfig | null> {
    return await this.scrapingConfigRepository.getByName(name);
  }
}