import { ApiConfig } from "../entities/ApiConfig";

export interface IConfigRepository {
  findAll(): Promise<ApiConfig[]>;
  findByName(name: string): Promise<ApiConfig | null>;
  save(config: ApiConfig): Promise<void>;
  delete(name: string): Promise<void>;
}