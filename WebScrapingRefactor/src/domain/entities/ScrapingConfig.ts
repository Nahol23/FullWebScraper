export interface ScrapingRuntimeParams {
  waitForSelector?: string;
  maxPages?: number;
  rules?: ExtractionRule[];
  containerSelector?: string;
}

export interface ExtractionRule {
  fieldName: string;
  selector: string;
  attribute?: "text" | "html" | "href" | "src" | "innerText";
  multiple?: boolean;
  transform?: string;
}

export interface ScrapingConfig {
  id: string;
  name: string;
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  rules: ExtractionRule[];
  pagination?: {
    type: "nextSelector" | "urlParam";
    selector?: string;
    paramName?: string;
    maxPages?: number;
  };
  waitForSelector?: string;
  containerSelector?: string;
  dataPath?: string;
  createdAt?: Date;
  updatedAt?: Date;
  defaultRuntimeParams?: ScrapingRuntimeParams;
}