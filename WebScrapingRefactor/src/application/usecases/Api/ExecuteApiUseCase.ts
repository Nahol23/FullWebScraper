import { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { ApiResponseDTO } from "../../dto/ApiResponseDto";
import { getNestedData, findFirstArrayPath } from "../../../infrastructure/utils/ObjectUtils";

export class ExecuteApiUseCase {
  constructor(
    private readonly configRepo: IConfigRepository,
    private readonly apiPort: IApiPort
  ) {}

  // ✅ CONFLITTO RISOLTO: Uso la logica 'idOrName' (Main) ma mantengo i tipi puliti
  async execute(idOrName: string, runtimeParams?: Record<string, unknown>): Promise<ApiResponseDTO> {
    
    // 1. Cerca per ID, se fallisce cerca per Nome (Logica Robustezza dal Main)
    let config = await this.configRepo.findById(idOrName);
    if (!config) {
      config = await this.configRepo.findByName(idOrName);
    }

    if (!config) {
      throw new Error(`Configurazione '${idOrName}' non trovata`);
    }

    // --- COSTRUZIONE URL ---
    const url = this.buildUrl(config.baseUrl, config.endpoint);

    if (config.queryParams) {
      config.queryParams.forEach(param => {
        url.searchParams.set(param.key, param.value);
      });
    }

    // --- COSTRUZIONE BODY ---
    let finalBody = config.body !== undefined && config.body !== null
      ? JSON.parse(JSON.stringify(config.body))
      : undefined;

    // --- COSTRUZIONE HEADERS ---
    const finalHeaders: Record<string, string> = {
      ...(config.headers || {})
    };

    let paramsForMerge = runtimeParams || {};

    if (runtimeParams) {
      if (runtimeParams.headers) {
        const runtimeHeaders = runtimeParams.headers as Record<string, string>;
        Object.assign(finalHeaders, runtimeHeaders);

        // ✅ CONFLITTO RISOLTO: Mantengo la destrutturazione e il commento (HEAD)
        // Rimuoviamo headers dai parametri per non sporcare l'URL o il Body
        const { headers, ...rest } = runtimeParams;
        paramsForMerge = rest;
      }
    }

    // --- MERGE PARAMETRI ---
    if (Object.keys(paramsForMerge).length > 0) {
      this.mergeRuntimeParams(config.method, url, finalBody, paramsForMerge);
    }

    const requestBody = config.method.toUpperCase() === 'GET' 
      ? undefined 
      : finalBody;

    // --- CHIAMATA API ---
    let responseData: unknown;
    try {
      responseData = await this.apiPort.request({
        url: url.toString(),
        method: config.method,
        body: requestBody,
        headers: finalHeaders
      });
    } catch (error) {
      throw new Error(
        `Errore chiamata API "${config.name}": ${(error as Error).message}`
      );
    }

    // --- ESTRAZIONE DATI ---
    let targetArray = this.extractArray(responseData, config.dataPath);

    // ✅ NUOVA FEATURE (HEAD): Applicazione Safety Limit
    // (Nota: Se in futuro sposti questo in un utils, ricorda di importarlo)
    targetArray = this.applyLimitSafety(targetArray, runtimeParams?.limit, config.pagination?.defaultLimit);

    // --- FILTRI ---
    if (config.filter?.field && config.filter?.value !== undefined) {
      targetArray = this.applyFilter(targetArray, config.filter as { field: string; value: unknown });
    }

    // --- SELEZIONE CAMPI ---
    if (config.selectedFields?.length) {
      targetArray = this.selectFields(targetArray, config.selectedFields);
    }

    const validObjects = targetArray.filter(
      item => item !== null && typeof item === 'object' && !Array.isArray(item)
    );

    return {
      data: targetArray,
      filteredBy: config.filter,
      meta: {
        paths: config.dataPath ? [config.dataPath] : [],
        total: targetArray.length,
        validObjectsCount: validObjects.length,
      },
    };
  }


  private buildUrl(baseUrl: string, endpoint: string): URL {
    const base = baseUrl.replace(/\/+$/, "");
    const path = endpoint.replace(/^\/+/, "");
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