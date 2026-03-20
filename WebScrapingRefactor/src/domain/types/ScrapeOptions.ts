export interface ScrapeOptions {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  useJavaScript?: boolean;
  waitForSelector?: string;
  containerSelector?: string;
  rules: import("../entities/ScrapingConfig").ExtractionRule[];
  pagination?: {
    type: "urlParam" | "nextSelector";
    paramName?: string;
    selector?: string;
    maxPages?: number;
    startPage?: number;
    resumeFromUrl?: string;
  };
}