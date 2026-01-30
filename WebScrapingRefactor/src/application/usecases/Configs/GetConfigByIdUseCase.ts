import { ApiConfig } from "../../../config/ApiConfigLoader";
import { IConfigRepository } from "../../../domain/ports/IConfigRepository";

export class GetConfigByIdUseCase {
  constructor(private repo: IConfigRepository) {}

  async execute(id: string): Promise<ApiConfig | null> {
    return this.repo.findById(id);
  }
}