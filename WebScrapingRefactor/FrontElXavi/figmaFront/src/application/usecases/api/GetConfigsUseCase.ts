/**
 * Application Use Case: GetConfigsUseCase
 * Business logic for retrieving API configurations
 * Pure TypeScript - No React, No Axios dependencies
 */

import type { ApiConfig } from "../../../domain/entities/ApiConfig";
import type { IConfigRepository } from "../../../domain/ports/IConfigRepository";

export class GetConfigsUseCase {
  constructor(private readonly configRepository: IConfigRepository) {}

  async execute(): Promise<ApiConfig[]> {
    return await this.configRepository.getAll();
  }

  async executeById(id: string): Promise<ApiConfig | null> {
    return await this.configRepository.getById(id);
  }
}
