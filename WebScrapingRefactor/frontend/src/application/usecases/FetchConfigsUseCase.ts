import type { ConfigRepository } from "../../domain/ports/ConfigRepository";
import type { ApiConfig } from "../../types/ApiConfig";

export type ConfigFilters = {
  search?: string;
  method?: string;
};

export class FetchConfigsUseCase {
  private readonly repo: ConfigRepository;

  constructor(repo: ConfigRepository) {
    this.repo = repo;
  }

  async execute(params?: ConfigFilters): Promise<ApiConfig[]> {
    const { search, method } = params || {};

    const configs = await this.repo.getAll();
    let result = [...configs];

    if (search && search.trim() !== "") {
      const term = search.trim().toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(term));
    }

    if (method && method !== "ALL") {
      result = result.filter(c => c.method === method);
    }

    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }
}
