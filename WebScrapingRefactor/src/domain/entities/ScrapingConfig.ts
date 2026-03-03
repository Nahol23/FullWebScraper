
export interface RuntimeParams {
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
  headers?: Record<string, string>;
  body?: any;
  selectedFields?: string[];
  dataPath?: string;
  queryParams?: Record<string, string>;
  [key: string]: any;
}

export interface ExtractionRule {
  fieldName: string;
  selector: string;
  attribute?: "text" | "html" | "href" | "src" | "innerText";
  multiple?: boolean;
  transform?: string; // eventuale funzione di trasformazione (regex, trim, etc.)
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
    selector?: string; // selettore del link "successivo"
    paramName?: string; // per paginazione via URL (es. ?page=)
    maxPages?: number;
  };
  waitForSelector?: string; // per attesa caricamento dinamico
  dataPath?: string;
  createdAt?: Date;
  updatedAt?: Date;
   containerSelector?: string;

  
  defaultRuntimeParams?: Partial<RuntimeParams> & {
    waitForSelector?: string;
    maxPages?: number;
    rules?: ExtractionRule[];
     containerSelector?: string;
  };
}