import { ExtractionRule } from "./ScrapingConfig";

export interface ScrapingExecution {
  id: string;
  configId: string;
  timestamp: Date;
  url: string;
  rulesUsed: ExtractionRule[];
  result: unknown;
  resultCount: number;
  status: "success" | "error";
  errorMessage?: string;
  duration: number;
  nextPageUrl: string | null;
  pagesScraped: number;
}
