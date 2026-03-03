import { ScrapingExecution } from "../../entities/ScrapingExecution";


export interface IScrapingExecutionRepository {
  save(execution: ScrapingExecution): Promise<void>;
  findById(id: string): Promise<ScrapingExecution | null>;
  findByConfigId(configId: string): Promise<ScrapingExecution[]>;
  findAll(): Promise<ScrapingExecution[]>;
  delete(id: string): Promise<void>;
}
