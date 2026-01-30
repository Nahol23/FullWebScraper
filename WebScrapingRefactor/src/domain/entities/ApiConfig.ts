import { ApiParam } from "../value-objects/ApiParam";
export interface ApiConfig {
  name: string;
  baseUrl: string;
  endpoint: string;
  method: "GET" | "POST";
  queryParams?: ApiParam[];
  headers?: Record<string, string>;
  body?: any;
  defaultLimit?: number;
  supportsPagination?: boolean;
  paginationField?: string;
  dataPath?: string;
  filter?: {
    field: string;
    value: any;
  };
  selectedFields?: string[];
}
