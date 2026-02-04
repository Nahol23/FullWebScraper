import type { ApiParam } from "./ApiParam";

export interface Analysis {
  id: string;
  url: string;
  method: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
  status: "pending" | "completed" | "failed";
  discoveredSchema?: {
    suggestedFields: string[];
    dataPath?: string | null;
    params: ApiParam[];
  };
  createdAt: string; 
}