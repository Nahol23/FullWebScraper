/**
 * Domain Port: IApiExecutionRepository
 * Interface for API execution
 * Pure TypeScript - No React, No Axios dependencies
 */

import type { ApiConfig } from "../entities/ApiConfig";
import type { ExecutionResult } from "../entities/ExecutionResult";
import type { RuntimeParams } from "../entities/RuntimeParams";

export interface IApiExecutionRepository {
  execute(
    config: ApiConfig,
    runtimeParams?: RuntimeParams
  ): Promise<ExecutionResult>;
}
