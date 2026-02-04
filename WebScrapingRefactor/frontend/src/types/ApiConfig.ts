import type { ApiParam } from "./ApiParam";
export interface ApiConfig {
  id: string;
  name: string;
  baseUrl: string;
  endpoint: string;
  method: "GET" | "POST";
  queryParams?: ApiParam[];
  headers?: Record<string, string>;
  body?: unknown;
  defaultLimit?: number;
  supportsPagination?: boolean;
  paginationField?: string;
  dataPath?: string;
  filter?: {
    field: string;
    value: unknown;
  };
  selectedFields?: string[];
}
