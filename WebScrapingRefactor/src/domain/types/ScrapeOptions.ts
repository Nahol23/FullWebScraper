import { ExtractionRule } from "../entities/ScrapingConfig";


export interface ScrapeOptions {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: any;
  waitForSelector?: string;
  rules: ExtractionRule[];
  useJavaScript?: boolean;
  containerSelector?: string;
}