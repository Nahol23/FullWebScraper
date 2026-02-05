import apiClient from "../http/apiClient";
import type { AnalyzeRepository } from "../../domain/ports/AnalyzeRepository";
import type { Analysis } from "../../types/Analysis";

export class AnalyzeHttpRepository implements AnalyzeRepository {
  async createAnalysis(payload: {
    url: string;
    method: "GET" | "POST";
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<Analysis> {
    const { data } = await apiClient.post<Analysis>("/analyze", payload);
    return data;
  }
}
