import { IConfigRepository } from "../../../domain/repositories/IConfigRepository";
import { ApiConfig } from "../../../domain/entities/ApiConfig";

export class GetAllConfigsUseCase {
  constructor(private repository: IConfigRepository) {}

  async execute(): Promise<ApiConfig[]> {
    return await this.repository.findAll();
  }
}