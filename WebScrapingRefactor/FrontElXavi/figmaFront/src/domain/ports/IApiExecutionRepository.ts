import type {  ExecutionHistory } from "../entities/ApiConfig";
import type { ExecutionResult } from "../entities/ExecutionResult";
import type { RuntimeParams } from "../entities/RuntimeParams";

// src/domain/ports/IApiExecutionRepository.ts
export interface IApiExecutionRepository {
  execute(id: string, params?: RuntimeParams): Promise<ExecutionResult>;
  getLogsByConfig(
    configId: string,
    limit?: number,
  ): Promise<ExecutionHistory[]>;
  deleteLog(configId: string, executionId: string): Promise<void>;
  downloadLogs(configName: string, format: string): Promise<Blob>;
}
