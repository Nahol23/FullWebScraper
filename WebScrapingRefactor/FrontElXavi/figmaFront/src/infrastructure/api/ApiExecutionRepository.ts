
import type {  ExecutionHistory } from "../../domain/entities/ApiConfig";
import type { ExecutionResult } from "../../domain/entities/ExecutionResult";
import type { RuntimeParams } from "../../domain/entities/RuntimeParams";
import type { IApiExecutionRepository } from "../../domain/ports/IApiExecutionRepository";
import { ApiExecutionError } from "../../domain/errors/AppError";
import { HttpClient } from "../http/httpClient";

export class ApiExecutionRepository implements IApiExecutionRepository {
  constructor(private readonly httpClient: HttpClient) {}

  

async execute(id: string, params?: RuntimeParams): Promise<ExecutionResult> {
  try {
    console.log("[Repository] Invio esecuzione per config:", id);
    console.log("[Repository] Parametri inviati:", params);
    
    const { data } = await this.httpClient.post<ExecutionResult>(
      `/executions/${id}/execute`, 
      {
        configId: id,
        runtimeParams: params || {},
        timestamp: new Date().toISOString()
      }
    );
    
    console.log("[Repository] Risposta completa:", data);
    
    if (!data) {
      throw new ApiExecutionError("Nessun dato ricevuto dal server");
    }
    
    if (data.data && Array.isArray(data.data)) {
      console.log(`[Repository] Dati estratti: ${data.data.length} elementi`);
      if (data.data.length > 0) {
        console.log("[Repository] Primo elemento:", data.data[0]);
      }
    }
    
    return data;
  } catch (error: any) {
    console.error("[Repository] Errore durante l'esecuzione:", error);
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