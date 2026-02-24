import type { ConfigRepository } from "../../domain/ports/ConfigRepository";
import type { ApiConfig } from "../../types/ApiConfig";

export class UpdateConfigUseCase {
  private readonly repo: ConfigRepository;
  constructor(repo: ConfigRepository) {
    this.repo = repo;
  }
  async execute(name: string, updates: Partial<ApiConfig>): Promise<void> {
    if (!name) {
      throw new Error("Config name is required");
    }
    await this.repo.patch(name, updates);
  }
}
