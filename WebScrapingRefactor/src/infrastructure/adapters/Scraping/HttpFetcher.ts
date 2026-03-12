import { ScrapingError } from "../../../domain/errors/ScrapingError";

export interface HttpFetchOptions {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
}

export class HttpFetcher {
  private readonly defaultHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  };

  async fetch(options: HttpFetchOptions): Promise<string> {
    const url = options.url;
    const method = options.method ?? "GET";
    const headers = options.body !== undefined ? options.headers ?? {} : options.headers ?? {};
    const body = options.body;

    const mergedHeaders = this.mergeHeaders(this.defaultHeaders, headers);

    const fetchOptions: RequestInit = {
      method,
      headers: mergedHeaders,
    };

    if (body !== undefined) {
      fetchOptions.body = this.serializeBody(body, headers["Content-Type"]);
      fetchOptions.headers = this.resolveContentTypeHeader(
        mergedHeaders,
        headers["Content-Type"],
        body,
      );
    }

    let res: Response;
    try {
      res = await fetch(url, fetchOptions);
    } catch (err) {
      throw new ScrapingError("FETCH_FAILED", `Richiesta fallita per ${url}`, err);
    }

    this.assertOk(res, url);
    return res.text();
  }

  private mergeHeaders(
    base: Record<string, string>,
    overrides: Record<string, string>,
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const key of Object.keys(base)) {
      result[key] = base[key];
    }
    for (const key of Object.keys(overrides)) {
      result[key] = overrides[key];
    }

    return result;
  }

  private serializeBody(body: unknown, contentType?: string): string {
    if (contentType?.includes("application/x-www-form-urlencoded")) {
      return this.urlEncode(body as Record<string, unknown>);
    }
    if (typeof body === "object") {
      return JSON.stringify(body);
    }
    return String(body);
  }

private resolveContentTypeHeader(
  headers: Record<string, string>,
  contentType: string | undefined,
  body: unknown,
): Record<string, string> {
  // Se il Content-Type è già esplicitamente impostato, rispettalo
  if (contentType) return headers;

  // Solo se non è stato specificato nulla, default a json per oggetti
  if (typeof body === "object") {
    const result = this.mergeHeaders(headers, {});
    result["Content-Type"] = "application/json";
    return result;
  }

  return headers;
}

  private urlEncode(obj: Record<string, unknown>): string {
    return Object.entries(obj)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
  }

  private assertOk(res: Response, url: string): void {
    if (res.status === 403) {
      throw new ScrapingError("ACCESS_DENIED", `Accesso negato dal sito: ${url}`);
    }
    if (res.status === 404) {
      throw new ScrapingError("PAGE_NOT_FOUND", `Pagina non trovata: ${url}`);
    }
    if (!res.ok) {
      throw new ScrapingError(
        "FETCH_FAILED",
        `Errore HTTP ${res.status} (${res.statusText}) per ${url}`,
      );
    }
  }
}