export interface ScrapingExecution {
  id: string;
  configId: string;
  timestamp: Date;
  url: string;
  rulesUsed: any[];
  result: any;
  resultCount: number;
  status: 'success' | 'error';
  errorMessage?: string;
  duration?: number;
}