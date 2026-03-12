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
    body?: unknown;
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

/**
 * Type guard that ensures a ScrapingConfig has a resolvable id.
 * Use this at UI boundaries before passing config.id to any use case.
 *
 * @example
 * if (!hasResolvedId(config)) {
 *   toast.error("Configurazione non ancora sincronizzata col server");
 *   return;
 * }
 * await deleteScrapingConfig(config.id);
 */
export function hasResolvedId(
  config: ScrapingConfig,
): config is ScrapingConfig & { id: string } {
  return typeof config.id === "string" && config.id.length > 0;
}