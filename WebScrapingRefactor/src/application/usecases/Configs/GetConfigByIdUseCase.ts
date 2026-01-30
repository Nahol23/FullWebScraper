import { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import { ApiConfig } from "../../../domain/entities/ApiConfig";
export class GetConfigByIdUseCase {
  constructor(private repo: IConfigRepository) {}

  async execute(id: string): Promise<ApiConfig | null> {
    return this.repo.findById(id);
  }
}