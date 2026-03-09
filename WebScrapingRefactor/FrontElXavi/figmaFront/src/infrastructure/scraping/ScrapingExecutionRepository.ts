import type { IScrapingExecutionRepository } from "../../domain/ports/scraping/IScrapingExecutionRepository";
import type { ScrapingExecution } from "../../domain/entities/ScrapingExecution";
import { HttpClient } from "../http/httpClient";
import { ApiExecutionError } from "../../domain/errors/AppError";

export class ScrapingExecutionRepository implements IScrapingExecutionRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async execute(configId: string, runtimeParams?: any): Promise<any> {
    if (!configId) {
      throw new Error("configId is required");
    }
    try {
      const response = await this.httpClient.post<any>(
        `/scraping/configs/${configId}/execute`,
        runtimeParams || {},
      );
      return response.data;
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message ||
          "Errore nell'esecuzione dello scraping",
        error.response?.status,
        error.response?.data,
      );
    }
  }

  async getLogsByConfig(
    configId: string,
    limit: number = 50,
  ): Promise<ScrapingExecution[]> {
    try {
      const response = await this.httpClient.get<ScrapingExecution[]>(
        `/scraping/executions/${configId}`,
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

  async deleteLog(configId: string, executionId: string): Promise<void> {
    try {
      await this.httpClient.delete(
        `/scraping/executions/${configId}/${executionId}`,
      );
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message || "Errore nell'eliminazione del log",
        error.response?.status,
      );
    }
  }

  async downloadLogs(
    configName: string,
    format: "json" | "markdown",
  ): Promise<Blob> {
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
