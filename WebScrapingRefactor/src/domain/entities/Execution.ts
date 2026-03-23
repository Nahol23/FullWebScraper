export interface Execution {
  id: string;
  configId: string; 
  timestamp: Date;
  parametersUsed: Record<string, any>;
  resultCount: number;
  status: "success" | "error";
  errorMessage ?: string;
  nextPageUrl: string | null;
  pagesScraped: number;
}