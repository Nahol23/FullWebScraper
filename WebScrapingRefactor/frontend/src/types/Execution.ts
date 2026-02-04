export interface Execution {
  id: string;
  configId: string;
  timestamp: string; 
  parametersUsed: Record<string, unknown>;
  resultCount: number;
  status: "success" | "error";
  errorMessage?: string;
}