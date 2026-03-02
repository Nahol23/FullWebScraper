import type { RuntimeParams } from "../../domain/entities/RuntimeParams";
import type { IApiExecutionRepository } from "../../domain/ports/IApiExecutionRepository";
import type { IConfigRepository } from "../../domain/ports/IConfigRepository";
import { ConfigNotFoundError } from "../../domain/errors/AppError";

// Helper per determinare se un valore è da considerare "vuoto" (non fornito)
function isEmpty(value: any): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return true;
  return false;
}

export class ExecuteApiUseCase {
  constructor(
    private readonly apiExecutionRepository: IApiExecutionRepository,
    private readonly configRepository: IConfigRepository,
  ) {}

  async execute(configId: string, runtimeParams?: RuntimeParams) {
    const config = await this.configRepository.getById(configId);
    if (!config) {
      throw new ConfigNotFoundError(configId);
    }

    const mergedParams: RuntimeParams = {};

    // DataPath
    if (!isEmpty(runtimeParams?.dataPath)) {
      mergedParams.dataPath = runtimeParams!.dataPath;
    } else if (!isEmpty(config.dataPath)) {
      mergedParams.dataPath = config.dataPath;
    }

    // SelectedFields
    if (!isEmpty(runtimeParams?.selectedFields)) {
      mergedParams.selectedFields = runtimeParams!.selectedFields;
    } else if (!isEmpty(config.selectedFields)) {
      mergedParams.selectedFields = config.selectedFields;
    }

    // Headers (merge)
    const headers: Record<string, string> = { ...(config.headers || {}) };
    if (!isEmpty(runtimeParams?.headers)) {
      Object.assign(headers, runtimeParams!.headers);
    }
    if (Object.keys(headers).length > 0) {
      mergedParams.headers = headers;
    }

    // Body
    if (!isEmpty(runtimeParams?.body)) {
      mergedParams.body = runtimeParams!.body;
    } else if (!isEmpty(config.body)) {
      mergedParams.body = config.body;
    }

    // QueryParams (merge)
    const queryParams: Record<string, string> = {};
    if (config.queryParams?.length) {
      config.queryParams.forEach((param) => {
        if (param.key?.trim()) {
          queryParams[param.key.trim()] = param.value?.trim() ?? "";
        }
      });
    }
    if (!isEmpty(runtimeParams?.queryParams)) {
      Object.assign(queryParams, runtimeParams!.queryParams);
    }
    if (Object.keys(queryParams).length > 0) {
      mergedParams.queryParams = queryParams;
    }

    // Parametri di paginazione/filtro diretti
    if (!isEmpty(runtimeParams?.page)) mergedParams.page = runtimeParams!.page;
    if (!isEmpty(runtimeParams?.limit)) mergedParams.limit = runtimeParams!.limit;
    if (!isEmpty(runtimeParams?.filters)) mergedParams.filters = runtimeParams!.filters;

    // Pulizia finale: rimuove eventuali proprietà vuote (anche se ormai gestite)
    const cleanParams = Object.fromEntries(
      Object.entries(mergedParams).filter(([key, value]) => {
        if (key === "selectedFields" && Array.isArray(value)) return true;
        if (value === undefined || value === null) return false;
        if (typeof value === "string" && value.trim() === "") return false;
        if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return false;
        if (Array.isArray(value) && value.length === 0 && key !== "selectedFields") return false;
        return true;
      }),
    );

    console.log("[ExecuteApiUseCase] Parametri finali inviati:", cleanParams);

    const result = await this.apiExecutionRepository.execute(config.id, cleanParams);
    console.log("[ExecuteApiUseCase] Risultato ricevuto:", result);
    return result;
  }
}