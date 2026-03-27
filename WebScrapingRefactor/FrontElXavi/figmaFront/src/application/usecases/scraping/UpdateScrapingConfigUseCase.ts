import type { IScrapingConfigRepository } from "../../../domain/ports/scraping/IScrapingConfigRepository";
import type { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";
import {
  ConfigNotFoundError,
  ValidationError,
} from "../../../domain/errors/AppError";

export class UpdateScrapingConfigUseCase {
  constructor(
    private readonly scrapingConfigRepository: IScrapingConfigRepository,
  ) {}

  async execute(
    id: string,
    updates: Partial<ScrapingConfig>,
  ): Promise<ScrapingConfig> {
    const existing = await this.scrapingConfigRepository.getById(id);
    if (!existing) {
      throw new ConfigNotFoundError(id);
    }
    const updated = { ...existing, ...updates };
    this.validateConfig(updated);
    await this.scrapingConfigRepository.update(id, updated);
    return updated;
  }

  private validateConfig(config: ScrapingConfig): void {
    if (!config.name?.trim()) {
      throw new ValidationError("Configuration name is required", "name");
    }
    if (!config.url?.trim()) {
      throw new ValidationError("URL is required", "url");
    }
    try {
      new URL(config.url);
    } catch {
      throw new ValidationError("Invalid URL format", "url");
    }
    if (!config.rules || config.rules.length === 0) {
      throw new ValidationError(
        "At least one extraction rule is required",
        "rules",
      );
    }
    config.rules.forEach((rule, index) => {
      if (!rule.fieldName?.trim()) {
        throw new ValidationError(
          `Rule at index ${index} missing fieldName`,
          `rules[${index}].fieldName`,
        );
      }
      if (!rule.selector?.trim()) {
        throw new ValidationError(
          `Rule at index ${index} missing selector`,
          `rules[${index}].selector`,
        );
      }
    });
  }
}
