import { ApiParam } from "../value-objects/ApiParam";

export interface PaginationConfig {
  type: 'page' | 'offset'; // Dice al loop come calcolare i numeri
  paramName: string;       // Es: "page" oppure "offset"
  limitParam: string;      // Es: "limit" oppure "per_page"
  defaultLimit: number;    // Es: 50
}
export interface ApiConfig {

  id:string;
  name: string;
  baseUrl: string;
  endpoint: string;
  method: "GET" | "POST";
  queryParams?: ApiParam[];
  headers?: Record<string, string>;
  body?: any;
  dataPath?: string;
  pagination?: PaginationConfig;
  filter?: {
    field: string;
    value: any;
  };
  selectedFields?: string[];
}
