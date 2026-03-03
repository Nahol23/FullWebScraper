import type { IScrapingConfigRepository } from "../../../domain/ports/ScrapingConfig/IScrapingConfigRepository";
import type { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";

export class GetScrapingConfigByIdUseCase {
  constructor(private readonly scrapingConfigRepository: IScrapingConfigRepository) {}

  async execute(id: string): Promise<ScrapingConfig | null> {
    return await this.scrapingConfigRepository.getById(id);
  }
}