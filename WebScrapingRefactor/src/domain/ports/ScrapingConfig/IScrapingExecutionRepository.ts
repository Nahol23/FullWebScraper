import type { ScrapingExecution } from "../../entities/ScrapingExecution";

export interface IScrapingExecutionRepository {
  execute(configId: string, params?: any): Promise<any>;
  findByConfigId(configId: string, limit?: number, offset?: number): Promise<ScrapingExecution[]>;
  findById(id: string): Promise<ScrapingExecution | null>;
  findAll(): Promise<ScrapingExecution[]>;
  save(execution: ScrapingExecution): Promise<void>;
  delete(id: string): Promise<void>;
  downloadLogs(configName: string, format: string): Promise<Blob>;
}