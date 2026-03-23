import type {
  IApiPort,
  ApiRequestOptions,
  ApiPaginationConfig,
  ApiResult,
} from "../../../domain/ports/Api/IApiPort";
import { createApiPaginationStrategy } from "../../adapters/Api/ApiPaginationStrategies";

const DEFAULT_MAX_PAGES = 10;

export class ApiAdapter implements IApiPort {
  async request<T>(options: ApiRequestOptions): Promise<T> {
    const { body } = await this.executeRequest(options);
    return body as T;
  }

  async requestPaginated<T>(
    options: ApiRequestOptions,
    pagination: ApiPaginationConfig,
    dataPath?: string,
  ): Promise<ApiResult<T>> {
    // ── bodyParam: gestione speciale POST con page nel body ────────────────
    if (pagination.type === "bodyParam") {
      return this.requestPaginatedBody<T>(options, pagination, dataPath);
    }

    const strategy = createApiPaginationStrategy(pagination, dataPath);

    if (!strategy) {
      const { body } = await this.executeRequest(options);
      const items = Array.isArray(body) ? body : [body];
      return { items: items as T[], nextPageUrl: null, pagesScraped: 1 };
    }

    const maxPages = pagination.maxPages ?? DEFAULT_MAX_PAGES;
    const accumulated: T[] = [];
    let currentUrl = this.resolveStartUrl(options.url, pagination);
    let page = 0;
    let pendingNextUrl: string | null = null;

    while (page < maxPages) {
      const { body, headers } = await this.executeRequest({
        ...options,
        url: currentUrl,
      });

      accumulated.push(...(strategy.extractItems(body) as T[]));
      page++;

      pendingNextUrl = await strategy.getNextUrl({
        currentUrl,
        responseBody: body,
        responseHeaders: headers,
      });

      if (pendingNextUrl === null) break;
      currentUrl = pendingNextUrl;
    }

    return {
      items: accumulated,
      nextPageUrl: pendingNextUrl,
      pagesScraped: page,
    };
  }

  /**
   * Gestione paginazione POST con page nel body.
   * Incrementa il campo bodyParamName (es. "page") ad ogni request.
   * Si ferma quando:
   *   - items vuoti
   *   - items.length < limit (ultima pagina parziale)
   *   - raggiunto maxPages
   */
  private async requestPaginatedBody<T>(
    options: ApiRequestOptions,
    pagination: ApiPaginationConfig,
    dataPath?: string,
  ): Promise<ApiResult<T>> {
    const maxPages = pagination.maxPages ?? DEFAULT_MAX_PAGES;
    const paramName = pagination.bodyParamName ?? "page";
    let startPage = pagination.startPage ?? 1;

    // Se fornito un resumeFromUrl, estrai il numero di pagina dal parametro __bodyPage
    if (pagination.resumeFromUrl) {
      try {
        const url = new URL(pagination.resumeFromUrl);
        const pageParam = url.searchParams.get("__bodyPage");
        if (pageParam) {
          const parsedPage = parseInt(pageParam, 10);
          if (!isNaN(parsedPage) && parsedPage > 0) {
            startPage = parsedPage;
          }
        }
      } catch {
        // Se l'URL non è valido, ignoriamo e usiamo startPage originale
      }
    }

    const accumulated: T[] = [];
    let page = startPage;
    let pendingNextUrl: string | null = null;
    let pagesScraped = 0;

    const originalBody = (options.body as Record<string, unknown>) ?? {};

    while (pagesScraped < maxPages) {
      const body: Record<string, unknown> = {
        ...originalBody,
        [paramName]: page,
      };

      const { body: responseBody } = await this.executeRequest({
        ...options,
        body,
      });

      const items = dataPath
        ? this.extractFromPath(responseBody, dataPath)
        : Array.isArray(responseBody)
          ? (responseBody as unknown[])
          : [];

      // Se non ci sono più dati, terminiamo la paginazione
      if (items.length === 0) {
        pendingNextUrl = null;
        break;
      }

      accumulated.push(...(items as T[]));
      pagesScraped++;
      page++;

      // Se abbiamo raggiunto il limite di pagine, salviamo l'URL per riprendere in futuro
      if (pagesScraped >= maxPages) {
        pendingNextUrl = `${options.url}?__bodyPage=${page}`;
      }
    }

    return {
      items: accumulated,
      nextPageUrl: pendingNextUrl,
      pagesScraped,
    };
  }

  /**
   * Risolve un dataPath dot-notation sul responseBody.
   */
  private extractFromPath(body: unknown, dataPath: string): unknown[] {
    const result = dataPath.split(".").reduce<unknown>((acc, key) => {
      if (acc !== null && typeof acc === "object" && !Array.isArray(acc)) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, body);
    return Array.isArray(result) ? result : [];
  }

  private async executeRequest(
    options: ApiRequestOptions,
  ): Promise<{ body: unknown; headers: Record<string, string> }> {
    try {
      const reqHeaders: Record<string, string> = {
        Accept: "application/json",
        ...(options.headers ?? {}),
      };
      if (options.method === "POST")
        reqHeaders["Content-Type"] = "application/json";

      const response = await fetch(options.url, {
        method: options.method,
        headers: reqHeaders,
        body:
          options.method === "POST" && options.body
            ? JSON.stringify(options.body)
            : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(
          `API Request Failed: ${response.status} ${response.statusText} - ${errorBody}`,
        );
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      return { body, headers };
    } catch (error: unknown) {
      throw new Error(
        `[ApiAdapter] ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private resolveStartUrl(
    baseUrl: string,
    pagination: ApiPaginationConfig,
  ): string {
    if (pagination.resumeFromUrl) return pagination.resumeFromUrl;

    if (
      pagination.type === "offsetParam" &&
      pagination.paramName &&
      pagination.startPage &&
      pagination.startPage > 1
    ) {
      try {
        const url = new URL(baseUrl);
        const startValue =
          pagination.paramType === "offset"
            ? (pagination.startPage - 1) * (pagination.limit ?? 10)
            : pagination.startPage;
        url.searchParams.set(pagination.paramName, startValue.toString());
        return url.toString();
      } catch {
        return baseUrl;
      }
    }

    return baseUrl;
  }
}
