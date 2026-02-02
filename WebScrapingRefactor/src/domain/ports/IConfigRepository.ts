import { ApiConfig } from "../entities/ApiConfig";

export interface IConfigRepository {
  findAll(): Promise<ApiConfig[]>;
  findById(id: string): Promise<ApiConfig | null>;
  findByName(name: string): Promise<ApiConfig | null>;
  findById(id: string) : Promise <ApiConfig | null>;
  save(config: ApiConfig): Promise<void>;
  delete(id: string): Promise<void>;
  update(id: string, newConfig: ApiConfig): Promise<void>;
}
