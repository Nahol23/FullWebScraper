import type { Analysis } from "../entities/Analysis";

export interface IAnalysisRepository {
  
  analyze(options: {
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: any;
  }): Promise<Analysis>;

}