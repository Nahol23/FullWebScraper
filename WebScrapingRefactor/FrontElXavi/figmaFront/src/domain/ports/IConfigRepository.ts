import { ApiConfig } from "../entities/ApiConfig";

export interface IConfigRepository {
  getAll(): Promise<ApiConfig[]>;
  getById(id: string): Promise<ApiConfig | null>;
  save(config: ApiConfig): Promise<void>;
  update(id: string, updates: Partial<ApiConfig>): Promise<void>;
  delete(id: string): Promise<void>;
}