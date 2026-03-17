import { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { ApiResponseDTO } from "../../dto/ApiResponseDto";
import {
  getNestedData,
  findFirstArrayPath,
} from "../../../infrastructure/utils/ObjectUtils";
import { IExecutionRepository } from "../../../domain/ports/Execution/IExecutionRepository";
import { Execution } from "../../../domain/entities/Execution";
import { randomUUID } from "crypto";

export class ExecuteApiUseCase {
  constructor(
    private readonly configRepo: IConfigRepository,
    private readonly executionRepo: IExecutionRepository,
    private readonly apiPort: IApiPort,
  ) {}

  async execute(
    idOrName: string,
    runtimeParams?: Record<string, unknown>,
  ): Promise<ApiResponseDTO | any> {
    try {
      // 1. Cerca per ID, se fallisce cerca per Nome
      let config = await this.configRepo.findById(idOrName);
      if (!config) {
        config = await this.configRepo.findByName(idOrName);
      }

      if (!config) {
        throw new Error(`Configurazione '${idOrName}' non trovata`);
      }

      const effectiveDataPath =
        runtimeParams?.dataPath !== undefined
          ? (runtimeParams.dataPath as string | undefined)
          : config.dataPath;
      const effectiveSelectedFields =
        runtimeParams?.selectedFields !== undefined
          ? (runtimeParams.selectedFields as string[] | undefined)
          : config.selectedFields;
      const effectiveLimit =
        runtimeParams?.limit !== undefined
          ? runtimeParams.limit
          : config.pagination?.defaultLimit;

      // --- COSTRUZIONE URL ---
      const url = this.buildUrl(config.baseUrl, config.endpoint);

      if (config.queryParams) {
        config.queryParams.forEach((param) =>
          url.searchParams.set(param.key, param.value),
        );
      }
     

      // --- COSTRUZIONE BODY ---
      let finalBody: any = undefined;
      if (config.method.toUpperCase() !== "GET" && config.body) {
        try {
          finalBody =
            typeof config.body === "string"
              ? JSON.parse(config.body)
              : JSON.parse(JSON.stringify(config.body));
        } catch (e) {
          finalBody = {}; // Fallback sicuro
        }
      }

      // --- COSTRUZIONE HEADERS ---
      let finalHeaders: Record<string, string> = {
        ...(config.headers || {}),
      };

      let apiParams: Record<string, unknown> = {};
      if (runtimeParams) {
        const {
          headers,
          dataPath,
          selectedFields,
          limit,
          queryParams,
          body,
          ...rest
        } = runtimeParams;

        if (body !== undefined) {
          if (typeof body === "string") {
            try {
              finalBody = JSON.parse(body);
            } catch {
              finalBody = body;
            }
          } else {
            finalBody = body;
          }
        }

        // Gestione headers...
        if (headers) {
          Object.entries(headers as Record<string, unknown>).forEach(
            ([k, v]) => {
              finalHeaders[k] = v === undefined || v === null ? "" : String(v);
            },
          );
        }

        apiParams = Object.fromEntries(
          Object.entries(rest).filter(([_, v]) => v !== undefined && v !== ""),
        );
      }

      if (Object.keys(apiParams).length > 0) {
        this.mergeRuntimeParams(config.method, url, finalBody, apiParams);
      }

      //  gestione parametri di query da runtimeParams.queryParams
      if (
        runtimeParams?.queryParams &&
        typeof runtimeParams.queryParams === "object"
      ) {
        Object.entries(
          runtimeParams.queryParams as Record<string, unknown>,
        ).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
          }
        });
      }

      let responseData: unknown;
      let status: "success" | "error" = "success";
      let errorMessage: string | undefined;


      try {
        responseData = await this.apiPort.request({
          url: url.toString(),
          method: config.method,
          body: config.method.toUpperCase() === "GET" ? undefined : finalBody,
          headers: finalHeaders,
        });
      } catch (error) {
        status = "error";
        errorMessage = (error as Error).message;
        throw error;
      } finally {
        const execution: Execution = {
          id: randomUUID(),
          configId: config.id,
          timestamp: new Date(),
          parametersUsed: runtimeParams || {},
          resultCount: 0,
          status: status,
          errorMessage: errorMessage,
        };

        if (status === "success" && responseData) {
          const rawArray = this.extractArray(responseData, effectiveDataPath);
          execution.resultCount = rawArray.length;
        }

        await this.executionRepo.save(execution);
      }

      const hasDataPathTransform =
        runtimeParams?.dataPath !== undefined ||
        (config.dataPath && runtimeParams?.dataPath === undefined);

      const hasSelectedFieldsTransform =
        runtimeParams?.selectedFields !== undefined ||
        (config.selectedFields?.length &&
          runtimeParams?.selectedFields === undefined);

      const hasFilter = !!(config.filter && config.filter.field);
      const hasLimit = runtimeParams?.limit !== undefined;

      const hasTransformations =
        hasDataPathTransform ||
        hasSelectedFieldsTransform ||
        hasFilter ||
        hasLimit;

      if (!hasTransformations) {
        return responseData;
      }

      let targetArray = this.extractArray(responseData, effectiveDataPath);
      targetArray = this.applyLimitSafety(
        targetArray,
        runtimeParams?.limit,
        config.pagination?.defaultLimit,
      );
      if (targetArray.length > 0) {
        console.log(
          "[ExecuteApiUseCase] Chiavi del primo elemento raw:",
          Object.keys(targetArray),
        );
        console.log(
          "[ExecuteApiUseCase] Primo elemento raw:",
          JSON.stringify(targetArray[0], null, 2),
        );
      }
      if (config.filter?.field && config.filter?.value !== undefined) {
        targetArray = this.applyFilter(
          targetArray,
          config.filter as { field: string; value: unknown },
        );
      }

      if (effectiveSelectedFields && effectiveSelectedFields.length > 0) {
        targetArray = this.selectFields(targetArray, effectiveSelectedFields);
      }

      const validObjects = targetArray.filter(
        (item) =>
          item !== null && typeof item === "object" && !Array.isArray(item),
      );

      return {
        data: targetArray,
        filteredBy: config.filter,
        meta: {
          paths: effectiveDataPath ? [effectiveDataPath] : [],
          total: targetArray.length,
          limit:
            typeof effectiveLimit === "number" ? effectiveLimit : undefined,
          validObjectsCount: validObjects.length,
        },
      };
    } catch (error) {
      console.error("[ExecuteApiUseCase] Unhandled error:", error);
      if (error instanceof Error) {
        console.error("Stack:", error.stack);
      }
      throw error; // Rilancia per il gestore globale di Fastify
    }
  }

  // Tutti i metodi privati rimangono identici
  private buildUrl(baseUrl: string, endpoint: string): URL {
    const base = baseUrl.replace(/\/+$/, "");
    const [path, queryString] = endpoint.split("?");
    const cleanPath = path.replace(/^\/+/, "").replace(/\/+$/, "");

    const url = new URL(`${base}/${cleanPath}`);

    if (queryString) {
      const params = new URLSearchParams(queryString);
      params.forEach((value, key) => url.searchParams.set(key, value));
    }

    return url;
  }

  private mergeRuntimeParams(
    method: string,
    url: URL,
    body: Record<string, unknown> | undefined,
    runtimeParams: Record<string, unknown>,
  ): void {
    const isPost = method.toUpperCase() === "POST";

    Object.entries(runtimeParams).forEach(([key, value]) => {
      const hasDot = key.includes(".");
      const existsInBody = body ? this.keyExistsInObject(body, key) : false;

      if (isPost && body && (hasDot || existsInBody)) {
        this.setNestedValue(body, key, value);
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }

  private extractArray(responseData: unknown, dataPath?: string): unknown[] {
    if (dataPath) {
      const extracted = getNestedData(responseData, dataPath);
      if (extracted !== null && extracted !== undefined) {
        return Array.isArray(extracted) ? extracted : [extracted];
      }
    }

    const autoPath = findFirstArrayPath(responseData);
    if (autoPath) {
      const extracted = getNestedData(responseData, autoPath);
      return Array.isArray(extracted) ? extracted : [];
    }

    if (Array.isArray(responseData)) {
      return responseData;
    }

    return responseData !== null && responseData !== undefined
      ? [responseData]
      : [];
  }

  private applyFilter(
    data: unknown[],
    filter: { field: string; value: unknown },
  ): unknown[] {
    return data.filter((item) => {
      const value = this.getNestedValue(item, filter.field);
      return value == filter.value;
    });
  }

  private selectFields(data: unknown[], fields: string[]): unknown[] {
    return data.map((item) => {
      const filtered: Record<string, unknown> = {};
      fields.forEach((field) => {
        filtered[field] = this.getNestedValue(item, field);
      });
      return filtered;
    });
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>((current, key) => {
      if (current && typeof current === "object" && !Array.isArray(current)) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  private keyExistsInObject(
    obj: Record<string, unknown>,
    key: string,
  ): boolean {
    const parts = key.split(".");
    let current: unknown = obj;

    for (const part of parts) {
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        return false;
      }
      const currentObj = current as Record<string, unknown>;
      if (!(part in currentObj)) {
        return false;
      }
      current = currentObj[part];
    }
    return true;
  }

  private setNestedValue(
    obj: Record<string, unknown>,
    key: string,
    value: unknown,
  ): void {
    const parts = key.split(".");
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (
        !(part in current) ||
        typeof current[part] !== "object" ||
        current[part] === null ||
        Array.isArray(current[part])
      ) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }

  private applyLimitSafety(
    data: unknown[],
    runtimeLimit: unknown,
    configDefaultLimit?: number,
  ): unknown[] {
    let limit: number | undefined = undefined;

    if (runtimeLimit !== undefined && runtimeLimit !== null) {
      const parsed = Number(runtimeLimit);
      if (!isNaN(parsed) && parsed >= 0) {
        limit = parsed;
      }
    }

    if (limit === undefined && configDefaultLimit) {
      limit = configDefaultLimit;
    }

    if (limit === 0) {
      return data;
    }

    if (limit !== undefined && limit > 0 && data.length > limit) {
      return data.slice(0, limit);
    }

    return data;
  }
}
