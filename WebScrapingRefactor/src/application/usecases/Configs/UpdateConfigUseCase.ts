import { ApiConfig } from "../../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../../domain/ports/IConfigRepository";

export class UpdateConfigUseCase {
  constructor(private configRepo: IConfigRepository) {}

  async execute(id: string, newConfig: Partial<ApiConfig>): Promise<void> {
    const existingConfig = await this.configRepo.findById(id);
    
    if (!existingConfig) {
      throw new Error(`Configurazione '${id}' non trovata`);
    }
    const updatedConfig: ApiConfig = {
      ...existingConfig,
      ...newConfig,
      id: existingConfig.id
    };
    await this.configRepo.update(id, updatedConfig);
  }
}