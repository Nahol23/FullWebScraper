import type { ScrapingAnalysisResponse } from "../../entities/ScrapingAnalysisResult"; 

export interface IScrapingAnalysisRepository {
  analyze(options: {
    url: string;
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: any;
    useJavaScript?: boolean;
    waitForSelector?: string;
  }): Promise<ScrapingAnalysisResponse>;

  analyzeById(
    configId: string,
    options?: {
      useJavaScript?: boolean;
      waitForSelector?: string;
    }
  ): Promise<ScrapingAnalysisResponse>;
}