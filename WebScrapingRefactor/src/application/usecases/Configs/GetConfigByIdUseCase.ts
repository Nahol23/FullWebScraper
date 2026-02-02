
import { ApiConfig } from "../../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../../domain/ports/IConfigRepository";

export class GetConfigByIdUseCase {
  constructor(private configRepo: IConfigRepository) {}

  async execute(id: string): Promise<ApiConfig | null> {
    return this.configRepo.findById(id);

  }
}