import { ApiConfig } from "../../../config/ApiConfigLoader";
import { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { ApiResponseDTO } from "../../dto/ApiResponseDto";
import { getNestedData, findFirstArrayPath } from "../../../infrastructure/utils/ObjectUtils";

export interface PaginationParams {
  page: number;
  limit: number;
}

export class ExecuteApiUseCase {
  constructor(private configRepo: IConfigRepository, private apiPort: IApiPort) {}

  async execute(configName: string, pagination?: PaginationParams): Promise<ApiResponseDTO> {
    const config = await this.configRepo.findByName(configName);
    if (!config) {
      throw new Error("Configurazione non trovata");
    }

    const responseData: any = await this.apiPort.request({
      url: `${config.baseUrl}${config.endpoint}`,
      method: config.method,
      body: config.body,
    });

    let targetArray: any[] = getNestedData(responseData, config.dataPath);
    if (targetArray.length === 0 && !config.dataPath) {
      const firstArrayPath = findFirstArrayPath(responseData);
      if (firstArrayPath) {
        targetArray = getNestedData(responseData, firstArrayPath);
      } else {
        targetArray = Array.isArray(responseData) ? responseData : [];
      }
    }

    
    if (config.filter) {
      targetArray = targetArray.filter((item) => {
        const value = config.filter!.field
          .split(".")
          .reduce((obj, key) => obj?.[key], item);
        return value == config.filter!.value;
      });
    }

    const totalRecords = targetArray.length; 

    let processedData = targetArray;
    if (pagination) {
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      processedData = targetArray.slice(start, end);
    }

    if (config.selectedFields && config.selectedFields.length > 0 && processedData.length > 0) {
      processedData = processedData.map((item) => {
        const filteredItem: Record<string, any> = {};
        config.selectedFields!.forEach((field) => {
          const value = field.split(".").reduce((obj, key) => obj?.[key], item);
          filteredItem[field] = value;
        });
        return filteredItem;
      });
    }

    return {
      data: processedData,
      filteredBy: config.filter,
      meta: {
        paths: config.dataPath ? [config.dataPath] : [],
        total: totalRecords,
        page: pagination?.page,
        limit: pagination?.limit,
        hasNext: pagination ? (pagination.page * pagination.limit) < totalRecords : false
      },
    };
  }
}