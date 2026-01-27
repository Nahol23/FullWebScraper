import { IConfigRepository } from "../../../domain/repositories/IConfigRepository";
import { ApiConfig } from "../../../domain/entities/ApiConfig";

export class GetConfigByNameUseCase {
  constructor(private repository: IConfigRepository) {}

  async execute(name: string): Promise<ApiConfig> {
    const config = await this.repository.findByName(name);
    
    if (!config) {
      throw new Error(`Config with name "${name}" not found`);
    }

    return config;
  }
}