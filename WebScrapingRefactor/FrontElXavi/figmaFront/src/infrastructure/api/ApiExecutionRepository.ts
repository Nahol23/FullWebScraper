import type { ExecutionHistory } from "../../domain/entities/ApiConfig";
import type { ExecutionResult } from "../../domain/entities/ExecutionResult";
import type { RuntimeParams } from "../../domain/entities/RuntimeParams";
import type { IApiExecutionRepository } from "../../domain/ports/IApiExecutionRepository";
import { ApiExecutionError } from "../../domain/errors/AppError";
import { HttpClient } from "../http/httpClient";

export class ApiExecutionRepository implements IApiExecutionRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async execute(id: string, params?: RuntimeParams): Promise<ExecutionResult> {
    try {
      const response = await this.httpClient.post<any>(
        `/executions/${id}/execute`,
        {
          configId: id,
          runtimeParams: params || {},
          timestamp: new Date().toISOString(),
        }
      );

      const { data } = response;
      const contentType = response.headers['content-type'];


      if (!data) {
        throw new ApiExecutionError("Nessun dato ricevuto dal server");
      }

      // CASO 1: Risposta processata (ha già la struttura ExecutionResult)
      if (
        data &&
        typeof data === "object" &&
        "status" in data &&
        "data" in data &&
        "duration" in data
      ) {
        return data as ExecutionResult;
      }

      // CASO 2: Risposta con struttura ApiResponseDTO (data + meta)
      if (
        data &&
        typeof data === "object" &&
        "data" in data &&
        Array.isArray(data.data) &&
        "meta" in data
      ) {
        return {
          status: response.status,
          statusText: response.statusText,
          duration: 0,
          data: data.data,
          contentType,
        } as ExecutionResult;
      }

      // CASO 3: Risposta grezza (array)
      if (Array.isArray(data)) {
        return {
          status: response.status,
          statusText: response.statusText,
          duration: 0,
          data: data,
        } as ExecutionResult;
      }

      // CASO 4: Risposta grezza (oggetto qualsiasi)
      if (typeof data === "object" && data !== null) {
        return {
          status: response.status,
          statusText: response.statusText,
          duration: 0,
          data: data,
        } as ExecutionResult;
      }

      // CASO 5: Fallback - avvolgi tutto in un array
      return {
        status: response.status,
        statusText: response.statusText,
        duration: 0,
        data: [data],
      } as ExecutionResult;
    } catch (error: any) {
      throw new ApiExecutionError(
        error.response?.data?.message || "Errore nell'esecuzione dell'API",
        error.response?.status,
        error.response?.data
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