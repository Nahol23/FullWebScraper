import { ApiConfig } from "../../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../../domain/ports/IConfigRepository";

export class GetAllConfigsUseCase {
  constructor(private configRepo: IConfigRepository) {}

  async execute(): Promise<ApiConfig[]> {
    return this.configRepo.findAll();
  }
}