/**
 * Domain Entity: ApiConfig
 * Pure TypeScript - No React, No Axios dependencies
 */

export interface ExecutionHistory {
  id: string;
  timestamp: string;
  status: "success" | "error";
  recordsExtracted?: number;
  errorMessage?: string;
}

export interface PaginationSettings {
  offsetParam: string;
  limitParam: string;
  initialOffset: number;
  limitPerPage: number;
}

export interface ApiConfig {
  id: string;
  name: string;
  baseUrl: string;
  endpoint: string;
  method: "GET" | "POST";
  headers: Record<string, string>;
  bodyParams: Record<string, any>;
  paginationSettings: PaginationSettings;
  selectedFields: string[];
  executionHistory: ExecutionHistory[];
}
