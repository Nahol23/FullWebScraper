import { ApiConfig } from "../../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../../domain/ports/IConfigRepository";

export class UpdateConfigUseCase {
  constructor(private configRepo: IConfigRepository) {}

  async execute(name: string, newConfig: Partial<ApiConfig>): Promise<void> {
    const existingConfig = await this.configRepo.findByName(name);
    
    if (!existingConfig) {
      throw new Error(`Configurazione '${name}' non trovata`);
    }
    const updatedConfig: ApiConfig = {
      ...existingConfig,
      ...newConfig,
      name 
    };
    await this.configRepo.update(name, updatedConfig);
  }
}