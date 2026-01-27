import { ApiParam } from "../value-objects/ApiParam";
export interface ApiConfig {
  name: string;
  baseUrl: string;
  endpoint: string;
  method: "GET" | "POST";
  queryParams?: ApiParam[];
  defaultLimit?: number;
  supportsPagination?: boolean;
  paginationField?: string;
  dataPath?: string;
  body?: any;
  filter?: {
    field: string;
    value: any;
  };
  selectedFields?: string[];
}
