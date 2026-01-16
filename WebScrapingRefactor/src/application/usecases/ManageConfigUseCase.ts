import { ApiConfig } from "../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../domain/ports/IConfigRepository";

export class ManageConfigUseCase {
  constructor(private configRepo: IConfigRepository) {}

  async getAllConfigs(): Promise<ApiConfig[]> {
    return this.configRepo.findAll();
  }

  async getConfigByName(name: string): Promise<ApiConfig | null> {
    return this.configRepo.findByName(name);
  }

  async saveConfig(config: ApiConfig): Promise<void> {
    if (!config.name) {
      throw new Error("Nome obbligatorio");
    }
    await this.configRepo.save(config);
  }

  async deleteConfig(name: string): Promise<void> {
    const existing = await this.configRepo.findByName(name);
    if (!existing) {
      throw new Error("Configurazione non trovata");
    }
    await this.configRepo.delete(name);
  }
}