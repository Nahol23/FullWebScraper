import { ApiConfig } from "../../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../../domain/ports/IConfigRepository";

export class UpdateConfigUseCase {
  constructor(private configRepo: IConfigRepository) {}

  async execute(idOrname: string, newConfig: Partial<ApiConfig>): Promise<void> {
    const existingConfig = await this.configRepo.findByName(idOrname);
    
    if (!existingConfig) {
      throw new Error(`Configurazione '${idOrname}' non trovata`);
    }
    const updatedConfig: ApiConfig = {
      ...existingConfig,
      ...newConfig,
      id: existingConfig.id
    };
    await this.configRepo.update(existingConfig.id, updatedConfig);
  }
}