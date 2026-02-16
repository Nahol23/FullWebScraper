import type { IAnalysisRepository } from "../../domain/ports/IAnalysisRepository";
import type { Analysis } from "../../domain/entities/Analysis";
import { HttpClient } from "../http/httpClient";
import { ApiExecutionError } from "../../domain/errors/AppError";

export class AnalysisRepository implements IAnalysisRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async analyze(options: {
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: any;
  }): Promise<Analysis> {
    try {
      const response = await this.httpClient.post<Analysis>('/executions/analyze', options);
      return response.data;
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message || 'Analysis failed',
        error.response?.status
      );
    }
  }
}