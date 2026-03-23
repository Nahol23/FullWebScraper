export interface ApiRequestOptions {
  url: string;
  method: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ApiPaginationConfig {
  type: "offsetParam" | "cursor" | "nextUrl" | "linkHeader" | "bodyParam";
  paramName?: string;
  paramType?: "page" | "offset";
  limit?: number;
  responsePath?: string;
  cursorParam?: string;
  maxPages?: number;
  startPage?: number;
  resumeFromUrl?: string;
  bodyParamName?: string;
  bodyLimitName?: string;
}

export interface ApiResult<T = unknown> {
  items: T[];
  nextPageUrl: string | null;
  pagesScraped: number;
}

export interface IApiPort {
  request<T>(options: ApiRequestOptions): Promise<T>;
  requestPaginated<T>(
    options: ApiRequestOptions,
    pagination: ApiPaginationConfig,
    dataPath?: string,
  ): Promise<ApiResult<T>>;
}
