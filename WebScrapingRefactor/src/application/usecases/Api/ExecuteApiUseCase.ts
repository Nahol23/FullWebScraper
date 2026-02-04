import { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { ApiResponseDTO } from "../../dto/ApiResponseDto";
import { getNestedData, findFirstArrayPath } from "../../../infrastructure/utils/ObjectUtils";

export class ExecuteApiUseCase {
  constructor(
    private readonly configRepo: IConfigRepository,
    private readonly apiPort: IApiPort
  ) {}

  async execute(
    configName: string,
    runtimeParams?: Record<string, unknown>
   ): Promise<ApiResponseDTO> {
    
    const config = await this.configRepo.findByName(configName);
    if (!config) {
      throw new Error(`Configurazione "${configName}" non trovata`);
    }

    
    const url = this.buildUrl(config.baseUrl, config.endpoint);

    //  Aggiungi Query Params Statici
    if (config.queryParams) {
      config.queryParams.forEach(param => {
        url.searchParams.set(param.key, param.value);
      });
    }

    let finalBody = config.body !== undefined && config.body !== null
      ? JSON.parse(JSON.stringify(config.body))
      : undefined;

    const finalHeaders: Record<string, string> = {
        
        ...(config.headers || {})

    }

    let paramsForMerge = runtimeParams || {};

    if (runtimeParams) {
        //  Se ci sono headers nei runtimeParams, li uniamo a quelli finali
        if (runtimeParams.headers) {
            const runtimeHeaders = runtimeParams.headers as Record<string, string>;
            Object.assign(finalHeaders, runtimeHeaders);

            //  Rimuoviamo headers dai parametri per non sporcare l'URL o il Body
            const { headers, ...rest } = runtimeParams;
            paramsForMerge = rest;
        }
      }

    
    if (Object.keys(paramsForMerge).length > 0) {
      this.mergeRuntimeParams(config.method, url, finalBody, paramsForMerge);
    }

    const requestBody = config.method.toUpperCase() === 'GET' 
      ? undefined 
      : finalBody;

    let responseData: unknown;
    try {
      responseData = await this.apiPort.request({
        url: url.toString(),
        method: config.method,
        body: requestBody,
        headers: finalHeaders
      })
      console.log("Response Data:", responseData);
    } catch (error) {
      throw new Error(
        `Errore chiamata API "${configName}": ${(error as Error).message}`
      );
    }

    let targetArray = this.extractArray(responseData, config.dataPath);

    targetArray = this.applyLimitSafety(targetArray, runtimeParams?.limit, config.pagination?.defaultLimit);

    if (config.filter?.field && config.filter?.value !== undefined) {
      targetArray = this.applyFilter(targetArray, config.filter);
    }
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
      // Logica SMART:
      // Va nel body se è POST, c'è un body E (la chiave ha punti O esiste già)
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
    //  Usa path configurato
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
  