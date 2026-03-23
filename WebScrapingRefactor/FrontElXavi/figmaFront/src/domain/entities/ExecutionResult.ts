export interface ExecutionResult {
  status: number;
  statusText: string;
  duration: number;
  data: unknown;
  contentType?: string;
  nextPageUrl?: string | null;
  pagesScraped?: number;
}