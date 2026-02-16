import type { RuntimeParams } from "../../domain/entities/RuntimeParams";
import type { IApiExecutionRepository } from "../../domain/ports/IApiExecutionRepository";
import type { IConfigRepository } from "../../domain/ports/IConfigRepository";
import { ConfigNotFoundError } from "../../domain/errors/AppError";

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

    if (runtimeParams?.dataPath !== undefined) {
      mergedParams.dataPath = runtimeParams.dataPath;
    } else if (config.dataPath?.trim()) {
      mergedParams.dataPath = config.dataPath.trim();
    }

    if (runtimeParams?.selectedFields !== undefined) {
      mergedParams.selectedFields = runtimeParams.selectedFields;
    } else if (config.selectedFields?.length) {
      mergedParams.selectedFields = config.selectedFields;
    }

    if (runtimeParams?.headers !== undefined) {
      mergedParams.headers = runtimeParams.headers;
    } else if (config.headers && Object.keys(config.headers).length > 0) {
      mergedParams.headers = config.headers;
    }

    if (runtimeParams?.body !== undefined) {
      mergedParams.body = runtimeParams.body;
    } else if (config.body !== undefined && config.body !== null) {
      mergedParams.body = config.body;
    }

    if (runtimeParams?.queryParams !== undefined) {
      mergedParams.queryParams = runtimeParams.queryParams;
    } else if (config.queryParams?.length) {
      mergedParams.queryParams = config.queryParams.reduce(
        (acc, param) => {
          if (param.key?.trim()) {
            acc[param.key.trim()] = param.value?.trim() ?? "";
          }
          return acc;
        },
        {} as Record<string, string>,
      );
      if (Object.keys(mergedParams.queryParams).length === 0) {
        delete mergedParams.queryParams;
      }
    }

   
    if (runtimeParams) {
      if (runtimeParams.page !== undefined) mergedParams.page = runtimeParams.page;
      if (runtimeParams.limit !== undefined) mergedParams.limit = runtimeParams.limit;
      if (runtimeParams.filters !== undefined) mergedParams.filters = runtimeParams.filters;
    }

    const cleanParams = Object.fromEntries(
      Object.entries(mergedParams).filter(([key, value]) => {
        if (key === "selectedFields" && Array.isArray(value)) {
          return true; 
        }
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