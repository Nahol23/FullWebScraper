import type { IScrapingExecutionRepository } from "../../domain/ports/scraping/IScrapingExecutionRepository";
import type { ScrapingExecution } from "../../domain/entities/ScrapingExecution";
import { HttpClient } from "../http/httpClient";
import { ApiExecutionError } from "../../domain/errors/AppError";

export class ScrapingExecutionRepository implements IScrapingExecutionRepository {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Triggers execution by config name.
   * Backend: POST /scraping/configs/by-name/:configName/execute
   */
  async executeByName(configName: string, runtimeParams?: any): Promise<any> {
    if (!configName) throw new Error("configName is required");
    try {
      const response = await this.httpClient.post<any>(
        `/scraping/configs/by-name/${configName}/execute`,
        runtimeParams || {},
      );
      return response.data;
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message || "Errore nell'esecuzione dello scraping",
        error.response?.status,
        error.response?.data,
      );
    }
  }

  /**
   * Fetches execution logs for a config by its name.
   * Backend: GET /scraping/executions/by-name/:configName
   */
  async getLogsByConfig(configName: string, limit: number = 50): Promise<ScrapingExecution[]> {
    try {
      const response = await this.httpClient.get<ScrapingExecution[]>(
        `/scraping/executions/by-name/${configName}`,
        { params: { limit } },
      );
      return response.data;
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message || "Errore nel recupero dei log",
        error.response?.status,
      );
    }
  }

  /**
   * Deletes a single execution by its own ID.
   * Backend: DELETE /scraping/executions/:id
   *
   * NOTE: configId is accepted for interface compatibility but is NOT used
   * in the request path — the backend only needs the executionId.
   */
  async deleteLog(_configId: string, executionId: string): Promise<void> {
    try {
      await this.httpClient.delete(`/scraping/executions/${executionId}`);
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message || "Errore nell'eliminazione del log",
        error.response?.status,
      );
    }
  }

  /**
   * Downloads all execution logs for a config as JSON or Markdown.
   * Backend: GET /scraping/download/:configName?format=json|markdown
   */
  async downloadLogs(configName: string, format: "json" | "markdown"): Promise<Blob> {
    try {
      const response = await this.httpClient.get(
        `/scraping/download/${configName}`,
        {
          params: { format },
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message || "Errore nel download dei log",
        error.response?.status,
      );
    }
  }
}