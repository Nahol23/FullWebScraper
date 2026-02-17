import type { IAnalysisRepository } from "../../domain/ports/IAnalysisRepository";
import type { Analysis } from "../../domain/entities/Analysis";
import { HttpClient } from "../http/httpClient";
import { ApiExecutionError } from "../../domain/errors/AppError";

export class AnalysisRepository implements IAnalysisRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async analyze(options: {
    url: string;
    method: "GET" | "POST";
    headers?: Record<string, string>;
    body?: any;
  }): Promise<Analysis> {
    try {
      console.log(
        "[AnalysisRepository] POST /executions/analyze with:",
        options,
      );
      const response = await this.httpClient.post<Analysis>(
        "/executions/analyze",
        options,
      );
      console.log("[AnalysisRepository] Full response:", response);
      console.log("[AnalysisRepository] Response status:", response.status);
      console.log(
        "[AnalysisRepository] Response statusText:",
        response.statusText,
      );
      console.log("[AnalysisRepository] Response headers:", response.headers);
      console.log(
        "[AnalysisRepository] Response data type:",
        typeof response.data,
      );
      console.log(
        "[AnalysisRepository] Response data keys:",
        Object.keys(response.data || {}),
      );
      console.log("[AnalysisRepository] Response data:", response.data);
      console.log(
        "[AnalysisRepository] Response.data stringified:",
        JSON.stringify(response.data),
      );
      return response.data;
    } catch (error: any) {
      console.error("[AnalysisRepository] Error response:", error.response);
      throw new ApiExecutionError(
        error.response?.data?.message || "Analysis failed",
        error.response?.status,
      );
    }
  }
}
