import type { ScrapingExecution } from "../../entities/ScrapingExecution";

export interface IScrapingExecutionRepository {
  executeByName(configName: string, runtimeParams?: any): Promise<any>;
  getLogsByConfig(configName: string, limit?: number): Promise<ScrapingExecution[]>;
  deleteLog(configId: string, executionId: string): Promise<void>;
  downloadLogs(configName: string, format: "json" | "markdown"): Promise<Blob>;
}