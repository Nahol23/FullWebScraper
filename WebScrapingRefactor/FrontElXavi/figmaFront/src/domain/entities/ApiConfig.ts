export interface ExecutionHistory {
  id: string;
  timestamp: string;
  status: number;
  duration: number;
  recordsExtracted?: number;
  errorMessage?: string;
  responsePreview?: any;
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
   body?: any;
  dataPath : string;
  headers: Record<string, string>;
  bodyParams: Record<string, any>;
  paginationSettings: PaginationSettings;
  selectedFields: string[];
  executionHistory: ExecutionHistory[];
}
