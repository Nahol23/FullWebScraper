export interface ScrapingRuntimeParams {
  maxPages?: number;
  waitForSelector?: string;
  rules?: ExtractionRule[];
  containerSelector?: string;
  startPage?: number;
  resumeFromUrl?: string;
}

export interface ExtractionRule {
  fieldName: string;
  selector: string;
  attribute?: "text" | "html" | "href" | "src" | "innerText" | "style";
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
    startPage?: number;
    resumeFromUrl?: string;
  };
  waitForSelector?: string;
  containerSelector?: string;
  dataPath?: string;
  createdAt?: Date;
  updatedAt?: Date;
  defaultRuntimeParams?: ScrapingRuntimeParams;
}
