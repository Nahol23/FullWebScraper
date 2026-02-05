/**
 * Infrastructure: ConfigRepository Implementation
 * Implements IConfigRepository using in-memory storage (can be replaced with API calls)
 */

import type { ApiConfig } from "../../domain/entities/ApiConfig";
import type { IConfigRepository } from "../../domain/ports/IConfigRepository";


const MOCK_CONFIGS: ApiConfig[] = [
  {
    id: "1",
    name: "User Management API",
    baseUrl: "https://api.example.com",
    endpoint: "/v1/users",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer token123"
    },
    bodyParams: {},
    paginationSettings: {
      offsetParam: "offset",
      limitParam: "limit",
      initialOffset: 0,
      limitPerPage: 50
    },
    selectedFields: ["id", "name", "email", "created_at"],
    executionHistory: []
  },
  {
    id: "2",
    name: "Product Catalog",
    baseUrl: "https://shop.api.io",
    endpoint: "/products",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "key_prod_xyz"
    },
    bodyParams: {},
    paginationSettings: {
      offsetParam: "page",
      limitParam: "per_page",
      initialOffset: 1,
      limitPerPage: 100
    },
    selectedFields: ["id", "name", "price", "stock", "category"],
    executionHistory: []
  },
  {
    id: "3",
    name: "Analytics Events",
    baseUrl: "https://analytics.service.com",
    endpoint: "/events",
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    bodyParams: {
      event_type: "pageview",
      timestamp: "auto"
    },
    paginationSettings: {
      offsetParam: "offset",
      limitParam: "count",
      initialOffset: 0,
      limitPerPage: 200
    },
    selectedFields: ["event_id", "user_id", "timestamp", "properties"],
    executionHistory: []
  }
];

export class ConfigRepository implements IConfigRepository {
  private configs: ApiConfig[] = [...MOCK_CONFIGS];

  constructor(initialConfigs: ApiConfig[] = []) {
    this.configs = [...initialConfigs];
  }

  async getAll(): Promise<ApiConfig[]> {
    // Simulate async operation
    return Promise.resolve([...this.configs]);
  }

  async getById(id: string): Promise<ApiConfig | null> {
    const config = this.configs.find((c) => c.id === id);
    return Promise.resolve(config || null);
  }

  async save(config: ApiConfig): Promise<ApiConfig> {
    this.configs.push(config);
    return Promise.resolve(config);
  }

  async update(config: ApiConfig): Promise<ApiConfig> {
    const index = this.configs.findIndex((c) => c.id === config.id);
    if (index === -1) {
      throw new Error(`Configuration with id ${config.id} not found`);
    }
    this.configs[index] = config;
    return Promise.resolve(config);
  }

  async delete(id: string): Promise<void> {
    const index = this.configs.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Configuration with id ${id} not found`);
    }
    this.configs.splice(index, 1);
    return Promise.resolve();
  }
}
