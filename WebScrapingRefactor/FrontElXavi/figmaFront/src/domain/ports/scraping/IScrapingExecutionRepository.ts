import type { ScrapingExecution } from "../../entities/ScrapingExecution";

export interface IScrapingExecutionRepository {
  execute(configId: string, runtimeParams?: any): Promise<any>;
  getLogsByConfig(configId: string, limit?: number): Promise<ScrapingExecution[]>;
  deleteLog(configId: string, executionId: string): Promise<void>;
  downloadLogs(configName: string, format: "json" | "markdown"): Promise<Blob>;
}