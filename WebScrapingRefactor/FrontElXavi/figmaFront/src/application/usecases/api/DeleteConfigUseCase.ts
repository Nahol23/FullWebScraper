/**
 * Application Use Case: DeleteConfigUseCase
 * Business logic for deleting API configurations
 * Pure TypeScript - No React, No Axios dependencies
 */

import type { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import { ConfigNotFoundError } from "../../../domain/errors/AppError";

export class DeleteConfigUseCase {
  constructor(private readonly configRepository: IConfigRepository) {}

  async execute(configId: string): Promise<void> {
    // Check if config exists
    const config = await this.configRepository.getById(configId);
    if (!config) {
      throw new ConfigNotFoundError(configId);
    }

    // Delete configuration
    await this.configRepository.delete(configId);
  }
}
