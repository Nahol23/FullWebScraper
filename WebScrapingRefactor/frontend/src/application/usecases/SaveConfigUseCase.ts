import type { ConfigRepository } from "../../domain/ports/ConfigRepository";
import type { ApiConfig } from "../../types/ApiConfig";

export class SaveConfigUseCase {
  private readonly repo: ConfigRepository;
  constructor(repo: ConfigRepository) {
    this.repo = repo;
  }
  async execute(config: Partial<ApiConfig>): Promise<void> {
    if (!config.name?.trim()) {
      throw new Error("Configuration name is required");
    }
    if (!config.baseUrl?.trim()) {
      throw new Error("Base URL is required");
    }
    if (!config.endpoint?.trim()) {
      throw new Error("Endpoint is required");
    }

    await this.repo.save(config);
  }
}
