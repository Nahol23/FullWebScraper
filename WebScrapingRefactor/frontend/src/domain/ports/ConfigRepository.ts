import type { ApiConfig } from "../../types/ApiConfig";

export interface ConfigRepository {
  getAll(): Promise<ApiConfig[]>;
  getByName(name: string): Promise<ApiConfig>;
  save(config: Partial<ApiConfig>): Promise<void>;
  delete(id: string): Promise<void>;
  patch(name: string, updates: Partial<ApiConfig>): Promise<void>;
}
