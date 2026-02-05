/**
 * Application Use Case: ExecuteApiUseCase
 * Business logic for executing API calls
 * Pure TypeScript - No React, No Axios dependencies
 */

import type { ApiConfig } from "../../domain/entities/ApiConfig";
import type { ExecutionResult } from "../../domain/entities/ExecutionResult";
import type { RuntimeParams } from "../../domain/entities/RuntimeParams";
import type { ExecutionHistory } from "../../domain/entities/ApiConfig";
import type { IApiExecutionRepository } from "../../domain/ports/IApiExecutionRepository";
import type { IConfigRepository } from "../../domain/ports/IConfigRepository";
import { ApiExecutionError } from "../../domain/errors/AppError";

export class ExecuteApiUseCase {
  constructor(
    private readonly apiExecutionRepository: IApiExecutionRepository,
    private readonly configRepository: IConfigRepository
  ) {}

  async execute(
    configId: string,
    runtimeParams?: RuntimeParams
  ): Promise<{ result: ExecutionResult; updatedConfig: ApiConfig }> {
    // Get configuration
    const config = await this.configRepository.getById(configId);
    if (!config) {
      throw new Error(`Configuration with id ${configId} not found`);
    }

    // Execute API call
    const startTime = Date.now();
    let result: ExecutionResult;
    
    try {
      result = await this.apiExecutionRepository.execute(config, runtimeParams);
    } catch (error) {
      if (error instanceof ApiExecutionError) {
        throw error;
      }
      throw new ApiExecutionError(
        error instanceof Error ? error.message : "Unknown error occurred",
        undefined,
        error
      );
    }

    const duration = Date.now() - startTime;
    result.duration = duration;

    // Create execution history entry
    const historyEntry: ExecutionHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: result.status >= 200 && result.status < 300 ? "success" : "error",
      recordsExtracted: Array.isArray(result.data?.data)
        ? result.data.data.length
        : undefined,
      errorMessage:
        result.status >= 400
          ? `${result.status} ${result.statusText}`
          : undefined,
    };

    // Update config with execution history
    const updatedConfig: ApiConfig = {
      ...config,
      executionHistory: [historyEntry, ...config.executionHistory],
    };

    await this.configRepository.update(updatedConfig);

    return { result, updatedConfig };
  }
}
