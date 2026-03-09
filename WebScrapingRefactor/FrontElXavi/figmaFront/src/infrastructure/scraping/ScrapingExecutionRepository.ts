import type { IScrapingExecutionRepository } from "../../domain/ports/scraping/IScrapingExecutionRepository";
import type { ScrapingExecution } from "../../domain/entities/ScrapingExecution";
import { HttpClient } from "../http/httpClient";
import { ApiExecutionError } from "../../domain/errors/AppError";

export class ScrapingExecutionRepository implements IScrapingExecutionRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async execute(configName: string, runtimeParams?: any): Promise<any> {
    if (!configName) {
      throw new Error("configName is required");
    }
    try {
      const response = await this.httpClient.post<any>(
        `/scraping/configs/by-name/${configName}/execute`,
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
    configName: string,
    limit: number = 50,
  ): Promise<ScrapingExecution[]> {
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

  async deleteLog(configName: string, executionId: string): Promise<void> {
    try {
      await this.httpClient.delete(
        `/scraping/executions/${configName}/${executionId}`,
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
