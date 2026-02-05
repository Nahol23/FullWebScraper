import type { Analysis } from "../../types/Analysis";

export interface AnalyzeRepository {
  createAnalysis(payload: {
    url: string;
    method: "GET" | "POST";
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<Analysis>;
}
