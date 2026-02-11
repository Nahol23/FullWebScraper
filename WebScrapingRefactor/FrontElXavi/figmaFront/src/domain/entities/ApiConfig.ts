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
  status: number;
  duration: number;
  recordsExtracted?: number;
  errorMessage?: string;
  responsePreview?: any;
}

export interface ApiConfig {
  id: string;
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
  // Mantieni executionHistory solo lato frontend se serve per UI
  executionHistory?: ExecutionHistory[];
}