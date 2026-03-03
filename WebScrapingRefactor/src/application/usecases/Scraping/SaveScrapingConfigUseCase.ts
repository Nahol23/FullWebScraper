
import type { IScrapingConfigRepository } from "../../../domain/ports/ScrapingConfig/IScrapingConfigRepository";
import type { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";
import { ValidationError } from "../../../domain/errors/AppError";

export class SaveScrapingConfigUseCase {
  constructor(private readonly scrapingConfigRepository: IScrapingConfigRepository) {}

  async execute(config: Omit<ScrapingConfig, "id">): Promise<ScrapingConfig> {
    this.validateConfig(config);

    // Assegna un ID univoco (se non già presente, ma qui è Omit, quindi lo aggiungiamo)
    const newConfig: ScrapingConfig = {
      ...config,
      id: crypto.randomUUID(), // o un generatore di ID appropriato
    };

    return await this.scrapingConfigRepository.save(newConfig);
  }

  private validateConfig(config: Omit<ScrapingConfig, "id">): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new ValidationError("Configuration name is required", "name");
    }

    if (!config.url || config.url.trim().length === 0) {
      throw new ValidationError("URL is required", "url");
    }

    // Validazione URL
    try {
      new URL(config.url);
    } catch {
      throw new ValidationError("Invalid URL format", "url");
    }

    // Validazione delle regole di estrazione
    if (!config.rules || config.rules.length === 0) {
      throw new ValidationError("At least one extraction rule is required", "rules");
    }

    // Ogni regola deve avere fieldName e selector
    config.rules.forEach((rule, index) => {
      if (!rule.fieldName || rule.fieldName.trim().length === 0) {
        throw new ValidationError(`Rule at index ${index} missing fieldName`, `rules[${index}].fieldName`);
      }
      if (!rule.selector || rule.selector.trim().length === 0) {
        throw new ValidationError(`Rule at index ${index} missing selector`, `rules[${index}].selector`);
      }
    });
  }
}