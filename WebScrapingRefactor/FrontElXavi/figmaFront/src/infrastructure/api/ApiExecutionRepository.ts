
import type { ApiConfig, ExecutionHistory } from "../../domain/entities/ApiConfig";
import type { ExecutionResult } from "../../domain/entities/ExecutionResult";
import type { RuntimeParams } from "../../domain/entities/RuntimeParams";
import type { IApiExecutionRepository } from "../../domain/ports/IApiExecutionRepository";
import { ApiExecutionError } from "../../domain/errors/AppError";
import { HttpClient } from "../http/httpClient";

export class ApiExecutionRepository implements IApiExecutionRepository {
  constructor(private readonly httpClient: HttpClient) {}

  
  async execute(
    config: ApiConfig,
    runtimeParams?: RuntimeParams
  ): Promise<ExecutionResult> {
    try {
      const response = await this.httpClient.post<ExecutionResult>(
        `/executions/${config.name}/execute`,
        runtimeParams
      );
      return response.data;
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message || "Errore durante l'esecuzione dell'API",
        error.response?.status
      );
    }
  }

  
  async getLogsByConfig(configId: string, limit: number = 50): Promise<ExecutionHistory[]> {
    try {
      const response = await this.httpClient.get<ExecutionHistory[]>(
        `/executions/${configId}`,
        { params: { limit } }
      );
      return response.data;
    } catch (error: any) {
      throw new ApiExecutionError(
        "Errore nel recupero della cronologia esecuzioni",
        error.response?.status
      );
    }
  }

 
  async deleteLog(configId: string, executionId: string): Promise<void> {
    try {
      await this.httpClient.delete(`/executions/${configId}/${executionId}`);
    } catch (error: any) {
      throw new ApiExecutionError(
        "Errore durante l'eliminazione del log",
        error.response?.status
      );
    }
  }

  
  async downloadLogs(configName: string, format: string): Promise<Blob> {
    try {
      const response = await this.httpClient.get(`/download/${configName}`, {
        params: { format },
        responseType: 'blob' 
      });
      return response.data;
    } catch (error: any) {
      throw new ApiExecutionError(
        "Errore durante la generazione del file di download",
        error.response?.status
      );
    }
  }
}