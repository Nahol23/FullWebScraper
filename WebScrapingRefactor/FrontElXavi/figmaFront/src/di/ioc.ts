/**
 * Dependency Injection Container
 * Wires up all dependencies following Clean Architecture
 */

import { ConfigRepository } from "../infrastructure/api/ConfigRepository";
import { ApiExecutionRepository } from "../infrastructure/api/ApiExecutionRepository";
import { HttpClient } from "../infrastructure/http/httpClient";
import { ExecuteApiUseCase } from "../application/usecases/ExecuteApiUseCase";
import { SaveConfigUseCase } from "../application/usecases/SaveConfigUseCase";
import { UpdateConfigUseCase } from "../application/usecases/UpdateConfigUseCase";
import { DeleteConfigUseCase } from "../application/usecases/DeleteConfigUseCase";
import { GetConfigsUseCase } from "../application/usecases/GetConfigsUseCase";
import type { ApiConfig } from "../domain/entities/ApiConfig";

// Mock initial configs (can be replaced with API call or localStorage)
const mockConfigs: ApiConfig[] = [
  {
    id: "1",
    name: "User Management API",
    baseUrl: "https://api.example.com",
    endpoint: "/v1/users",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer token123",
    },
    bodyParams: {},
    paginationSettings: {
      offsetParam: "offset",
      limitParam: "limit",
      initialOffset: 0,
      limitPerPage: 50,
    },
    selectedFields: ["id", "name", "email", "created_at"],
    executionHistory: [],
  },
  {
    id: "2",
    name: "Product Catalog",
    baseUrl: "https://shop.api.io",
    endpoint: "/products",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "key_prod_xyz",
    },
    bodyParams: {},
    paginationSettings: {
      offsetParam: "page",
      limitParam: "per_page",
      initialOffset: 1,
      limitPerPage: 100,
    },
    selectedFields: ["id", "name", "price", "stock", "category"],
    executionHistory: [],
  },
  {
    id: "3",
    name: "Analytics Events",
    baseUrl: "https://analytics.service.com",
    endpoint: "/events",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    bodyParams: {
      event_type: "pageview",
      timestamp: "auto",
    },
    paginationSettings: {
      offsetParam: "offset",
      limitParam: "count",
      initialOffset: 0,
      limitPerPage: 200,
    },
    selectedFields: ["event_id", "user_id", "timestamp", "properties"],
    executionHistory: [],
  },
  {
    id: "4",
    name: "Payment Transactions",
    baseUrl: "https://payment.gateway.com",
    endpoint: "/api/transactions",
    method: "GET",
    headers: {
      Authorization: "Bearer sk_live_abc123",
      "Content-Type": "application/json",
    },
    bodyParams: {},
    paginationSettings: {
      offsetParam: "starting_after",
      limitParam: "limit",
      initialOffset: 0,
      limitPerPage: 100,
    },
    selectedFields: ["id", "amount", "currency", "status", "created"],
    executionHistory: [],
  },
  {
    id: "5",
    name: "Inventory Sync",
    baseUrl: "https://warehouse.api.com",
    endpoint: "/inventory/items",
    method: "GET",
    headers: {
      "X-Warehouse-Key": "wh_key_456",
    },
    bodyParams: {},
    paginationSettings: {
      offsetParam: "offset",
      limitParam: "limit",
      initialOffset: 0,
      limitPerPage: 75,
    },
    selectedFields: ["sku", "quantity", "location", "last_updated"],
    executionHistory: [],
  },
  {
    id: "6",
    name: "Customer Reviews",
    baseUrl: "https://reviews.platform.io",
    endpoint: "/v2/reviews",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    bodyParams: {},
    paginationSettings: {
      offsetParam: "offset",
      limitParam: "limit",
      initialOffset: 0,
      limitPerPage: 50,
    },
    selectedFields: ["id", "rating", "comment", "reviewer_name", "date"],
    executionHistory: [],
  },
];

// Infrastructure Layer
const httpClient = new HttpClient();
const configRepository = new ConfigRepository(mockConfigs);
const apiExecutionRepository = new ApiExecutionRepository(httpClient);

// Application Layer (Use Cases)
export const executeApiUseCase = new ExecuteApiUseCase(
  apiExecutionRepository,
  configRepository
);

export const saveConfigUseCase = new SaveConfigUseCase(configRepository);
export const updateConfigUseCase = new UpdateConfigUseCase(configRepository);
export const deleteConfigUseCase = new DeleteConfigUseCase(configRepository);
export const getConfigsUseCase = new GetConfigsUseCase(configRepository);

// Export repositories for direct access if needed (though use cases should be preferred)
export { configRepository, apiExecutionRepository };
