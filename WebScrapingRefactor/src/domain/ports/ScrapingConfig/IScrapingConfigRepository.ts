import { ScrapingConfig } from "../../entities/ScrapingConfig";

export interface IScrapingConfigRepository {
  getAll(): Promise<ScrapingConfig[]>;
  getById(id: string): Promise<ScrapingConfig | null>;
  save(config: ScrapingConfig): Promise<ScrapingConfig>;
  update(id: string, updates: Partial<ScrapingConfig>): Promise<void>;
  delete(id: string): Promise<void>;
}
