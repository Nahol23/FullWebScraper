import { IConfigRepository } from "../../../domain/repositories/IConfigRepository";
import { ApiConfig } from "../../../domain/entities/ApiConfig";

export class UpdateConfigUseCase {
  constructor(private repository: IConfigRepository) {}

  async execute(config: ApiConfig): Promise<ApiConfig> {
    // Validazione di base
    if (!config.name || !config.baseUrl || !config.endpoint || !config.method) {
      throw new Error("Missing required fields: name, baseUrl, endpoint, method");
    }

    // Controlla se esiste
    const existing = await this.repository.findByName(config.name);
    if (!existing) {
      throw new Error(`Config with name "${config.name}" not found`);
    }

    await this.repository.save(config);
    return config;
  }
}