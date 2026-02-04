import { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { ApiResponseDTO } from "../../dto/ApiResponseDto";
import { getNestedData, findFirstArrayPath } from "../../../infrastructure/utils/ObjectUtils";
import { IExecutionRepository } from "../../../domain/ports/Execution/IExecutionRepository";
import { Execution } from "../../../domain/entities/Execution";
import { randomUUID } from "crypto";
export class ExecuteApiUseCase {
  constructor(
    private readonly configRepo: IConfigRepository,
    private readonly executionRepo: IExecutionRepository,
    private readonly apiPort: IApiPort
  ) {}

  async execute(idOrName: string, runtimeParams?: Record<string, unknown>): Promise<ApiResponseDTO> {
    
    // 1. Cerca per ID, se fallisce cerca per Nome (Logica Robustezza dal Main)
    let config = await this.configRepo.findById(idOrName);
    if (!config) {
      config = await this.configRepo.findByName(idOrName);
    }

    if (!config) {
      throw new Error(`Configurazione '${idOrName}' non trovata`);
    }


    const effectiveDataPath = runtimeParams?.dataPath !== undefined 
    ? runtimeParams.dataPath as string|undefined
    : config.dataPath;
    const effectiveSelectedFields = runtimeParams?.selectedFields !== undefined
     ? runtimeParams.selectedFields as string[]|undefined
     : config.selectedFields;
    const effectiveLimit = runtimeParams?.limit !== undefined 
    ? runtimeParams.limit 
    : config.pagination?.defaultLimit;


    // --- COSTRUZIONE URL ---
    const url = this.buildUrl(config.baseUrl, config.endpoint);
    
    if (config.queryParams) {
      config.queryParams.forEach(param => url.searchParams.set(param.key, param.value));
    }
    
    // --- COSTRUZIONE BODY ---
    let finalBody = config.body !== undefined && config.body !== null
      ? JSON.parse(JSON.stringify(config.body))
      : undefined;

    // --- COSTRUZIONE HEADERS ---
    const finalHeaders: Record<string, string> = {
      ...(config.headers || {})
    };

      let apiParams: Record<string, unknown> = {};
    if (runtimeParams) {
      // Estrai i meta-params che NON vanno nell'URL/Body
      const { headers, dataPath, selectedFields, limit, ...rest } = runtimeParams;
      
      // Merge degli headers
      if (headers) {
        Object.assign(finalHeaders, headers as Record<string, string>);
      }
      
      // Il resto va in URL o Body
      apiParams = rest;
    }

    // --- MERGE PARAMETRI ---
    if (Object.keys(apiParams).length > 0) {
      this.mergeRuntimeParams(config.method, url, finalBody, apiParams);
    }
    let responseData: unknown;
    let status: "success" | "error" = "success";
    let errorMessage: string | undefined;

    try {
      responseData = await this.apiPort.request({
        url: url.toString(),
        method: config.method,
        body: config.method.toUpperCase() === 'GET' ? undefined : finalBody,
        headers: finalHeaders
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
        errorMessage: errorMessage
      };

      if (status === "success" && responseData) {
        const rawArray = this.extractArray(responseData, effectiveDataPath);
        execution.resultCount = rawArray.length;
      }

      await this.executionRepo.save(execution);
    }

    let targetArray = this.extractArray(responseData, effectiveDataPath);

    // --- APPLICA LIMIT SAFETY ---
    targetArray = this.applyLimitSafety(targetArray, runtimeParams?.limit, config.pagination?.defaultLimit);

    // --- FILTRI ---
    if (config.filter?.field && config.filter?.value !== undefined) {
      targetArray = this.applyFilter(targetArray, config.filter as { field: string; value: unknown });
    }

    if (effectiveSelectedFields && effectiveSelectedFields.length > 0) {
      targetArray = this.selectFields(targetArray, effectiveSelectedFields);
    }

    const validObjects = targetArray.filter(
      item => item !== null && typeof item === 'object' && !Array.isArray(item)
    );

    return {
      data: targetArray,
      filteredBy: config.filter,
      meta: {
        paths: effectiveDataPath ? [effectiveDataPath] : [],
        total: targetArray.length,
        limit: typeof effectiveLimit === 'number' ? effectiveLimit : undefined,
        validObjectsCount: validObjects.length,
      },
    };
  }


  private buildUrl(baseUrl: string, endpoint: string): URL {
    const base = baseUrl.replace(/\/+$/, "");
    const path = endpoint.replace(/^\/+/, "").replace(/\/+$/, "");
    return new URL(`${base}/${path}`);
  }

  private mergeRuntimeParams(
    method: string,
    url: URL,
    body: Record<string, unknown> | undefined,
    runtimeParams: Record<string, unknown>
  ): void {
    const isPost = method.toUpperCase() === "POST";

    Object.entries(runtimeParams).forEach(([key, value]) => {
      const hasDot = key.includes('.');
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
    filter: { field: string; value: unknown }
  ): unknown[] {
    return data.filter(item => {
      const value = this.getNestedValue(item, filter.field);
      return value == filter.value; 
    });
  }

  private selectFields(data: unknown[], fields: string[]): unknown[] {
    return data.map(item => {
      const filtered: Record<string, unknown> = {};
      fields.forEach(field => {
        filtered[field] = this.getNestedValue(item, field);
      });
      return filtered;
    });
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  private keyExistsInObject(obj: Record<string, unknown>, key: string): boolean {
    const parts = key.split(".");
    let current: unknown = obj;

    for (const part of parts) {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
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
    value: unknown
  ): void {
    const parts = key.split(".");
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (
        !(part in current) ||
        typeof current[part] !== 'object' ||
        current[part] === null ||
        Array.isArray(current[part])
      ) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }

  // ✅ CONFLITTO RISOLTO: Mantenuto il metodo privato dal branch HEAD
  private applyLimitSafety(
    data: unknown[],
    runtimeLimit: unknown, // Passiamo 'unknown' per testare la robustezza
    configDefaultLimit?: number
  ): unknown[] {
    
    let limit: number | undefined = undefined;

    // 1. Parsing Robusto
    if (runtimeLimit !== undefined && runtimeLimit !== null) {
      const parsed = Number(runtimeLimit);
      if (!isNaN(parsed) && parsed >= 0) {
        limit = parsed;
      }
    }

    // 2. Fallback Config
    if (limit === undefined && configDefaultLimit) {
      limit = configDefaultLimit;
    }

    // 3. Logica Core
    // Se limit è 0 (Download All) -> Ritorna tutto
    if (limit === 0) {
      return data;
    }

    // Se c'è un limite valido e l'array è troppo lungo -> Taglia
    if (limit !== undefined && limit > 0 && data.length > limit) {
      return data.slice(0, limit);
    }

    // Altrimenti ritorna originale
    return data;
  }
}