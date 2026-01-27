import { ApiConfig } from "../../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { ApiResponseDTO } from "../../dto/ApiResponseDto";
import { getNestedData, findFirstArrayPath } from "../../../infrastructure/utils/ObjectUtils";

export class ExecuteApiUseCase {
  constructor(private configRepo: IConfigRepository, private apiPort: IApiPort) {}

  async execute(configName: string, runtimeParams?: Record<string, any>): Promise<ApiResponseDTO> {
    const config = await this.configRepo.findByName(configName);
    if (!config) {
      throw new Error("Configurazione non trovata");
    }

    const fullUrlObj = new URL(`${config.baseUrl}${config.endpoint}`);
    if (config.queryParams) {
      config.queryParams.forEach((param) => {
        fullUrlObj.searchParams.append(param.key, param.value);
      });
    }

    if(runtimeParams){
      Object.entries(runtimeParams).forEach(([key, value]) => {
        fullUrlObj.searchParams.set(key, String(value));
      });
    }


    
    const responseData: any = await this.apiPort.request({
      url: fullUrlObj.toString(),
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

    if (config.selectedFields && config.selectedFields.length > 0 && targetArray.length > 0) {
      targetArray = targetArray.map((item) => {
        const filteredItem: Record<string, any> = {};
        config.selectedFields!.forEach((field) => {
          const value = field.split(".").reduce((obj, key) => obj?.[key], item);
          filteredItem[field] = value;
        });
        return filteredItem;
      });
    }

    return {
      data: targetArray,
      filteredBy: config.filter,
      meta: {
        paths: config.dataPath ? [config.dataPath] : [],
        total: targetArray.length,
      },
    };
  }
}