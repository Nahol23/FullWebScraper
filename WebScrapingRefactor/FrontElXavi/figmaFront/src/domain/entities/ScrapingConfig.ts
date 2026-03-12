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
  body?: any;
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
  defaultRuntimeParams?: {
    url?: string;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: any;
    waitForSelector?: string;
    rules?: ExtractionRule[];
    maxPages?: number;
    containerSelector?: string;
    pagination?: {
      type: "nextSelector" | "urlParam";
      selector?: string;
      paramName?: string;
      maxPages?: number;
    };
  };
}
