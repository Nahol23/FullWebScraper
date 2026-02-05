/**
 * Application Use Case: SaveConfigUseCase
 * Business logic for saving API configurations
 * Pure TypeScript - No React, No Axios dependencies
 */

import type { ApiConfig } from "../../domain/entities/ApiConfig";
import type { IConfigRepository } from "../../domain/ports/IConfigRepository";
import { ValidationError } from "../../domain/errors/AppError";

export class SaveConfigUseCase {
  constructor(private readonly configRepository: IConfigRepository) {}

  async execute(config: Omit<ApiConfig, "id">): Promise<ApiConfig> {
    // Validate configuration
    this.validateConfig(config);

    // Create new config with ID
    const newConfig: ApiConfig = {
      ...config,
      id: Date.now().toString(),
    };

    // Save configuration
    return await this.configRepository.save(newConfig);
  }

  private validateConfig(config: Omit<ApiConfig, "id">): void {
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
