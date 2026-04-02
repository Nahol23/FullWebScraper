import type { IScrapingExecutionRepository } from "../../domain/ports/scraping/IScrapingExecutionRepository";
import type { ScrapingExecution } from "../../domain/entities/ScrapingExecution";
import { HttpClient } from "../http/httpClient";
import { ApiExecutionError } from "../../domain/errors/AppError";

interface RawScrapingExecution {
  id: string;
  config_id?: string;
  configId?: string;
  timestamp: string;
  status: "success" | "error";
  duration?: number;
  total_items?: number;
  totalItems?: number;
  pages_scraped?: number;
  pagesScraped?: number;
  next_page_url?: string | null;
  nextPageUrl?: string | null;
  error_message?: string;
  errorMessage?: string;
  url?: string;
  rules_used?: unknown[];
  rulesUsed?: unknown[];
  result?: unknown;
  result_count?: number;
  resultCount?: number;
}

function mapRawToScrapingExecution(
  raw: RawScrapingExecution,
): ScrapingExecution {
  return {
    id: raw.id,
    configId: raw.config_id ?? raw.configId ?? "",
    timestamp: new Date(raw.timestamp),
    status: raw.status,
    url: raw.url ?? "",
    rulesUsed: raw.rules_used ?? raw.rulesUsed ?? [],
    result: raw.result ?? null,
    resultCount: raw.result_count ?? raw.resultCount ?? 0,
    duration: raw.duration,
    totalItems:
      raw.total_items ?? raw.totalItems ?? raw.result_count ?? raw.resultCount,
    pagesScraped: raw.pages_scraped ?? raw.pagesScraped ?? 0,
    nextPageUrl: raw.next_page_url ?? raw.nextPageUrl ?? null,
    errorMessage: raw.error_message ?? raw.errorMessage,
  };
}
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
      const e = error as {
        response?: { data?: { message?: string }; status?: number };
      };
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
  async resume(
    configId: string,
    maxPages?: number,
  ): Promise<ScrapingExecution> {
    if (!configId) throw new Error("configId is required");
    try {
      const response = await this.httpClient.post<ScrapingExecution>(
        `/scraping/executions/resume/${configId}`,
        maxPages !== undefined ? { maxPages } : {},
      );
      return response.data;
    } catch (error: unknown) {
      const e = error as {
        response?: { data?: { message?: string }; status?: number };
      };
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
      const response = await this.httpClient.get<RawScrapingExecution[]>(
        `/scraping/executions/by-name/${configName}`,
        { params: { limit } },
      );
      return response.data.map(mapRawToScrapingExecution);
    } catch (error: unknown) {
      const e = error as {
        response?: { data?: { message?: string }; status?: number };
      };
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
      const e = error as {
        response?: { data?: { message?: string }; status?: number };
      };
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
  async downloadLogs(
    configName: string,
    format: "json" | "markdown",
  ): Promise<Blob> {
    try {
      const response = await this.httpClient.get(
        `/scraping/download/${configName}`,
        { params: { format }, responseType: "blob" },
      );
      return response.data as Blob;
    } catch (error: unknown) {
      const e = error as {
        response?: { data?: { message?: string }; status?: number };
      };
      throw new ApiExecutionError(
        e.response?.data?.message ?? "Errore nel download dei log",
        e.response?.status,
      );
    }
  }
}
