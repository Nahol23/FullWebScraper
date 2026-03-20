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
  async executeByName(
    configName: string,
    runtimeParams?: Record<string, unknown>,
  ): Promise<ScrapingExecution> {
    if (!configName) throw new Error("configName is required");
    try {
      const response = await this.httpClient.post<ScrapingExecution>(
        `/scraping/configs/by-name/${configName}/execute`,
        runtimeParams ?? {},
      );
      return response.data;
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string }; status?: number } };
      throw new ApiExecutionError(
        e.response?.data?.message ?? "Errore nell'esecuzione dello scraping",
        e.response?.status,
        e.response?.data,
      );
    }
  }

  /**
   * Resumes scraping from where the last execution stopped.
   * Backend: POST /scraping/executions/resume/:configId
   * The backend reads nextPageUrl from the last execution automatically.
   */
  async resume(configId: string, maxPages?: number): Promise<ScrapingExecution> {
    if (!configId) throw new Error("configId is required");
    try {
      const response = await this.httpClient.post<ScrapingExecution>(
        `/scraping/executions/resume/${configId}`,
        maxPages !== undefined ? { maxPages } : {},
      );
      return response.data;
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string }; status?: number } };
      throw new ApiExecutionError(
        e.response?.data?.message ?? "Errore nel resume dello scraping",
        e.response?.status,
        e.response?.data,
      );
    }
  }

  /**
   * Fetches execution logs for a config by its name.
   * Backend: GET /scraping/executions/by-name/:configName
   */
  async getLogsByConfig(
    configName: string,
    limit: number = 50,
  ): Promise<ScrapingExecution[]> {
    try {
      const response = await this.httpClient.get<ScrapingExecution[]>(
        `/scraping/executions/by-name/${configName}`,
        { params: { limit } },
      );
      return response.data;
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string }; status?: number } };
      throw new ApiExecutionError(
        e.response?.data?.message ?? "Errore nel recupero dei log",
        e.response?.status,
      );
    }
  }

  /**
   * Deletes a single execution by its own ID.
   * Backend: DELETE /scraping/executions/:id
   */
  async deleteLog(_configId: string, executionId: string): Promise<void> {
    try {
      await this.httpClient.delete(`/scraping/executions/${executionId}`);
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string }; status?: number } };
      throw new ApiExecutionError(
        e.response?.data?.message ?? "Errore nell'eliminazione del log",
        e.response?.status,
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
        { params: { format }, responseType: "blob" },
      );
      return response.data as Blob;
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string }; status?: number } };
      throw new ApiExecutionError(
        e.response?.data?.message ?? "Errore nel download dei log",
        e.response?.status,
      );
    }
  }
}