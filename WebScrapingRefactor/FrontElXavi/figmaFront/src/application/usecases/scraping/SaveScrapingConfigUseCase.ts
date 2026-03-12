import type { IScrapingConfigRepository } from "../../../domain/ports/scraping/IScrapingConfigRepository";
import type { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";
import { ValidationError } from "../../../domain/errors/AppError";

export class SaveScrapingConfigUseCase {
  constructor(
    private readonly scrapingConfigRepository: IScrapingConfigRepository,
  ) {}

  async execute(config: Omit<ScrapingConfig, "id">): Promise<ScrapingConfig> {
    this.validateConfig(config);
    return await this.scrapingConfigRepository.save(config);
  }

  private validateConfig(config: Omit<ScrapingConfig, "id">): void {
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
