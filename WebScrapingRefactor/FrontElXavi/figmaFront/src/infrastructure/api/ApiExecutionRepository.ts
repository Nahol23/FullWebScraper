import type { ExecutionHistory } from "../../domain/entities/ApiConfig";
import type { ExecutionResult } from "../../domain/entities/ExecutionResult";
import type { RuntimeParams } from "../../domain/entities/RuntimeParams";
import type { IApiExecutionRepository } from "../../domain/ports/IApiExecutionRepository";
import { ApiExecutionError } from "../../domain/errors/AppError";
import { HttpClient } from "../http/httpClient";

// Shape grezza che arriva dal backend per ogni execution
interface RawExecution {
  id: string;
  config_id?: string;
  timestamp: string;
  status: "success" | "error" | number;
  duration?: number;
  result_count?: number;
  resultCount?: number;
  recordsExtracted?: number;
  pages_scraped?: number;
  pagesScraped?: number;
  next_page_url?: string | null;
  nextPageUrl?: string | null;
  error_message?: string;
  errorMessage?: string;
}

function mapRawToExecutionHistory(raw: RawExecution): ExecutionHistory {
  return {
    id: raw.id,
    timestamp: raw.timestamp,
    status: raw.status,
    duration: raw.duration,
    recordsExtracted:
      raw.result_count ?? raw.resultCount ?? raw.recordsExtracted,
    pagesScraped: raw.pages_scraped ?? raw.pagesScraped,
    nextPageUrl: raw.next_page_url ?? raw.nextPageUrl ?? null,
    errorMessage: raw.error_message ?? raw.errorMessage,
  };
}

export class ApiExecutionRepository implements IApiExecutionRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async execute(id: string, params?: RuntimeParams): Promise<ExecutionResult> {
    try {
      const response = await this.httpClient.post<Record<string, unknown>>(
        `/executions/${id}/execute`,
        params ?? {},
      );

      const { data } = response;
      const contentType = response.headers["content-type"] as
        | string
        | undefined;

      if (!data) throw new ApiExecutionError("Nessun dato ricevuto dal server");

      // CASO 1: Risposta processata (ha già la struttura ExecutionResult)
      if (
        typeof data === "object" &&
        "status" in data &&
        "data" in data &&
        "duration" in data
      ) {
        return data as unknown as ExecutionResult;
      }

      // CASO 2: Risposta con struttura ApiResponseDTO (data + meta + nextPageUrl)
      if (
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
          nextPageUrl: (data.nextPageUrl as string | null) ?? null,
          pagesScraped:
            (data.meta as { pagesScraped?: number })?.pagesScraped ?? 1,
        } satisfies ExecutionResult;
      }

      // CASO 3: Array grezzo
      if (Array.isArray(data)) {
        return {
          status: response.status,
          statusText: response.statusText,
          duration: 0,
          data,
        };
      }

      // CASO 4: Oggetto qualsiasi
      return {
        status: response.status,
        statusText: response.statusText,
        duration: 0,
        data,
      };
    } catch (error: unknown) {
      const e = error as {
        response?: { data?: { message?: string }; status?: number };
      };
      throw new ApiExecutionError(
        e.response?.data?.message ?? "Errore nell'esecuzione dell'API",
        e.response?.status,
        e.response?.data,
      );
    }
  }

  async resume(configId: string, maxPages?: number): Promise<ExecutionResult> {
    if (!configId) throw new Error("configId is required");
    try {
      const response = await this.httpClient.post<Record<string, unknown>>(
        `/executions/resume/${configId}`,
        maxPages !== undefined ? { maxPages } : {},
      );
      const { data } = response;
      return {
        status: response.status,
        statusText: response.statusText,
        duration: 0,
        data: (data as { data?: unknown }).data ?? data,
        nextPageUrl:
          (data as { nextPageUrl?: string | null }).nextPageUrl ?? null,
        pagesScraped:
          (data as { meta?: { pagesScraped?: number } }).meta?.pagesScraped ??
          0,
      } satisfies ExecutionResult;
    } catch (error: unknown) {
      const e = error as {
        response?: { data?: { message?: string }; status?: number };
      };
      throw new ApiExecutionError(
        e.response?.data?.message ?? "Errore nel resume dell'API",
        e.response?.status,
        e.response?.data,
      );
    }
  }

  async getLogsByConfig(
    configId: string,
    limit: number = 50,
  ): Promise<ExecutionHistory[]> {
    try {
      const response = await this.httpClient.get<RawExecution[]>(
        `/executions/${configId}`,
        { params: { limit } },
      );
      return response.data.map(mapRawToExecutionHistory);
    } catch (error: unknown) {
      const e = error as { response?: { status?: number } };
      throw new ApiExecutionError(
        "Errore nel recupero della cronologia esecuzioni",
        e.response?.status,
      );
    }
  }

  async deleteLog(configId: string, executionId: string): Promise<void> {
    try {
      await this.httpClient.delete(`/executions/${configId}/${executionId}`);
    } catch (error: unknown) {
      const e = error as { response?: { status?: number } };
      throw new ApiExecutionError(
        "Errore durante l'eliminazione del log",
        e.response?.status,
      );
    }
  }

  async downloadLogs(configName: string, format: string): Promise<Blob> {
    try {
      const response = await this.httpClient.get(`/download/${configName}`, {
        params: { format },
        responseType: "blob",
      });
      return response.data as Blob;
    } catch (error: unknown) {
      const e = error as { response?: { status?: number } };
      throw new ApiExecutionError(
        "Errore durante la generazione del file di download",
        e.response?.status,
      );
    }
  }
}
