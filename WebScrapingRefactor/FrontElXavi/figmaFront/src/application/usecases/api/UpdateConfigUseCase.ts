/**
 * Application Use Case: UpdateConfigUseCase
 * Business logic for updating API configurations
 * Pure TypeScript - No React, No Axios dependencies
 */

import type { ApiConfig } from "../../../domain/entities/ApiConfig";
import type { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import {
  ConfigNotFoundError,
  ValidationError,
} from "../../../domain/errors/AppError";

export class UpdateConfigUseCase {
  constructor(private readonly configRepository: IConfigRepository) {}

  async execute(config: ApiConfig): Promise<ApiConfig> {
    // Check if config exists
    const existing = await this.configRepository.getById(config.id);
    if (!existing) {
      throw new ConfigNotFoundError(config.id);
    }

    // Validate configuration
    this.validateConfig(config);

    // Update configuration
    await this.configRepository.update(config.id, config);
    return config;
  }
  private validateConfig(config: ApiConfig): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new ValidationError("Configuration name is required", "name");
    }

    if (!config.baseUrl || config.baseUrl.trim().length === 0) {
      throw new ValidationError("Base URL is required", "baseUrl");
    }

    if (!config.endpoint || config.endpoint.trim().length === 0) {
      throw new ValidationError("Endpoint is required", "endpoint");
    }

    if (!config.method || !["GET", "POST"].includes(config.method)) {
      throw new ValidationError("Method must be GET or POST", "method");
    }

    // Validate URL format
    try {
      new URL(config.baseUrl);
    } catch {
      throw new ValidationError("Invalid base URL format", "baseUrl");
    }
  }
}
