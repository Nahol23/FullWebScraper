import type { ApiPaginationConfig } from "../../../domain/ports/Api/IApiPort";

// ── Utility ────────────────────────────────────────────────────────────────

function resolvePath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === "object" && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function extractItems(responseBody: unknown, dataPath?: string): unknown[] {
  const data = dataPath ? resolvePath(responseBody, dataPath) : responseBody;
  return Array.isArray(data) ? data : [];
}

// ── Context ──────────────────────────────────────────────────────────────────

export interface ApiPaginationContext {
  currentUrl: string;
  responseBody: unknown;
  responseHeaders: Record<string, string>;
}

// ── Strategy type ────────────────────────────────────────────────────────────

export interface IApiPaginationStrategy {
  getNextUrl(context: ApiPaginationContext): Promise<string | null>;
  extractItems(responseBody: unknown): unknown[];
}

// ── Strategies ────────────────────────────────────────────────────────────────

function makeOffsetParam(
  paramName: string,
  paramType: "page" | "offset",
  limit: number,
  dataPath?: string,
): IApiPaginationStrategy {
  return {
    async getNextUrl({ currentUrl, responseBody }) {
      if (extractItems(responseBody, dataPath).length === 0) return null;
      try {
        const url     = new URL(currentUrl);
        const current = parseInt(url.searchParams.get(paramName) ?? "1", 10);
        const next    = paramType === "offset" ? current + limit : current + 1;
        url.searchParams.set(paramName, next.toString());
        return url.toString();
      } catch {
        return null;
      }
    },
    extractItems: (body) => extractItems(body, dataPath),
  };
}

function makeCursor(
  responsePath: string,
  cursorParam: string,
  dataPath?: string,
): IApiPaginationStrategy {
  return {
    async getNextUrl({ currentUrl, responseBody }) {
      const cursor = resolvePath(responseBody, responsePath);
      if (!cursor || typeof cursor !== "string") return null;
      try {
        const url = new URL(currentUrl);
        url.searchParams.set(cursorParam, cursor);
        return url.toString();
      } catch {
        return null;
      }
    },
    extractItems: (body) => extractItems(body, dataPath),
  };
}

function makeNextUrl(responsePath: string, dataPath?: string): IApiPaginationStrategy {
  return {
    async getNextUrl({ responseBody }) {
      const next = resolvePath(responseBody, responsePath);
      if (!next || typeof next !== "string") return null;
      try {
        new URL(next);
        return next;
      } catch {
        return null;
      }
    },
    extractItems: (body) => extractItems(body, dataPath),
  };
}

function makeLinkHeader(dataPath?: string): IApiPaginationStrategy {
  return {
    async getNextUrl({ responseHeaders }) {
      const link = responseHeaders["link"] ?? responseHeaders["Link"];
      if (!link) return null;
      for (const part of link.split(",")) {
        const match = part.match(/<([^>]+)>\s*;\s*rel="([^"]+)"/);
        if (match?.[2] === "next") return match[1];
      }
      return null;
    },
    extractItems: (body) => extractItems(body, dataPath),
  };
}

/**
 * bodyParam: per API POST che usano un campo "page" nel body.
 * Non gestisce il getNextUrl qui — la logica di incremento page
 * è delegata ad ApiAdapter.requestPaginatedBody.
 * Questo strategy serve solo per l'extractItems.
 */
function makeBodyParam(dataPath?: string): IApiPaginationStrategy {
  return {
    async getNextUrl() {
      // L'incremento del body viene gestito direttamente in ApiAdapter
      return null;
    },
    extractItems: (body) => extractItems(body, dataPath),
  };
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createApiPaginationStrategy(
  pagination: ApiPaginationConfig,
  dataPath?: string,
): IApiPaginationStrategy | null {
  switch (pagination.type) {
    case "offsetParam":
      if (!pagination.paramName) return null;
      return makeOffsetParam(
        pagination.paramName,
        pagination.paramType ?? "page",
        pagination.limit ?? 10,
        dataPath,
      );

    case "cursor":
      if (!pagination.responsePath || !pagination.cursorParam) return null;
      return makeCursor(pagination.responsePath, pagination.cursorParam, dataPath);

    case "nextUrl":
      if (!pagination.responsePath) return null;
      return makeNextUrl(pagination.responsePath, dataPath);

    case "linkHeader":
      return makeLinkHeader(dataPath);

    case "bodyParam":
      return makeBodyParam(dataPath);

    default:
      return null;
  }
}