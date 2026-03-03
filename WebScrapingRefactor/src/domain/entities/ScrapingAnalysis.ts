export interface ScrapingAnalysis {
  id: string;
  url: string;
  timestamp: Date;
  options?: any;
  result: any;
  status: 'completed' | 'failed';
  errorMessage?: string;
}