import { ApiConfig } from "../../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../../domain/ports/IConfigRepository";

export class GetConfigByNameUseCase {
  constructor(private configRepo: IConfigRepository) {}

  async execute(name: string): Promise<ApiConfig | null> {
    return this.configRepo.findByName(name);
  }
}