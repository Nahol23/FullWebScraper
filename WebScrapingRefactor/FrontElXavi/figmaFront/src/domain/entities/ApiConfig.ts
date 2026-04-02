export interface ApiParam {
  key: string;
  value: string;
}

export interface PaginationConfig {
  type: "page" | "offset";
  paramName: string;
  limitParam: string;
  defaultLimit: number;
}

export interface ExecutionHistory {
  id: string;
  timestamp: string;
  status: number | "success" | "error"; // numero HTTP o stringa dal backend
  duration?: number;
  recordsExtracted?: number;
  pagesScraped?: number;
  totalItems?: number;
  nextPageUrl?: string | null;
  errorMessage?: string;
  responsePreview?: unknown;
  data?: string;
}

export interface ApiConfig {
  id: string;
  name: string;
  baseUrl: string;
  endpoint: string;
  method: "GET" | "POST";
  queryParams?: ApiParam[];
  headers?: Record<string, string>;
  body?: unknown;
  dataPath?: string;
  pagination?: PaginationConfig;
  filter?: {
    field: string;
    value: unknown;
  };
  selectedFields?: string[];
  executionHistory?: ExecutionHistory[];
}
