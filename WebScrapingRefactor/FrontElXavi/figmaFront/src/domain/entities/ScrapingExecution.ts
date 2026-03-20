export interface ScrapingExecution {
  id: string;
  configId: string;
  timestamp: Date;
  url: string;
  rulesUsed: unknown[];
  result: unknown;
  resultCount: number;
  status: "success" | "error";
  errorMessage?: string;
  duration?: number;
  nextPageUrl: string | null;
  pagesScraped: number;
}
