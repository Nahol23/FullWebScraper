import type { IScrapingAnalysisRepository } from "../../domain/ports/scraping/IScrapingAnalysisRepository";
import type { ScrapingAnalysisResponse } from "../../domain/entities/ScrapingAnalysisResult";
import { HttpClient } from "../http/httpClient";
import { ApiExecutionError } from "../../domain/errors/AppError";

export class ScrapingAnalysisRepository implements IScrapingAnalysisRepository {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Runs a new DOM analysis.
   * Backend: POST /scraping/analyses  (was: POST /scraping/analyze)
   */
  async analyze(options: {
    url: string;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: any;
    useJavaScript?: boolean;
    waitForSelector?: string;
  }): Promise<ScrapingAnalysisResponse> {
    try {
      const response = await this.httpClient.post<ScrapingAnalysisResponse>(
        "/scraping/analyses",
        options,
      );
      return response.data;
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message || "Analysis failed",
        error.response?.status,
      );
    }
  }

  /**
   * Runs analysis using an existing config's URL + settings.
   * Backend: POST /scraping/configs/:id/analyze  (unchanged)
   */
  async analyzeById(
    configId: string,
    options?: {
      useJavaScript?: boolean;
      waitForSelector?: string;
    },
  ): Promise<ScrapingAnalysisResponse> {
    try {
      const response = await this.httpClient.post<ScrapingAnalysisResponse>(
        `/scraping/configs/${configId}/analyze`,
        options || {},
      );
      return response.data;
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message || "Analysis by config failed",
        error.response?.status,
      );
    }
  }
}
