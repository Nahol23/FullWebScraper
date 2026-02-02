import { ApiParam } from "../value-objects/ApiParam";

export interface Analysis {
  id: string;
  url: string;
  method: "GET" | "POST";
  body?: any;
  headers?: Record<string, string>;
  status: "pending" | "completed" | "failed";
  discoveredSchema?: {
    suggestedFields: string[];
    dataPath?: string | null;
    params: ApiParam[];
  };
  createdAt: Date;
}
