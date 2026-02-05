/**
 * Domain Port: IConfigRepository
 * Interface for configuration persistence
 * Pure TypeScript - No React, No Axios dependencies
 */

import type { ApiConfig } from "../entities/ApiConfig";

export interface IConfigRepository {
  getAll(): Promise<ApiConfig[]>;
  getById(id: string): Promise<ApiConfig | null>;
  save(config: ApiConfig): Promise<ApiConfig>;
  update(config: ApiConfig): Promise<ApiConfig>;
  delete(id: string): Promise<void>;
}
