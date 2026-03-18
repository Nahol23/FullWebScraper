import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { ApiResponseDTO } from "../../dto/ApiResponseDto";
import { getNestedData, findFirstArrayPath } from "../../../infrastructure/utils/ObjectUtils";

export class ApiUseCase {
  constructor(private api: IApiPort) {}

  // Metodo RAW senza processing
  async executeRaw(
    url: string,
    method: "GET" | "POST",
    body?: any
  ): Promise<any> {
    const res = await this.api.request<any>({ url, method, body });
    return res;
  }

  // Metodo con processing 
  async execute(
    url: string,
    method: "GET" | "POST",
    filters?: { field: string; value: any },
    body?: any,
    dataPath?: string
  ): Promise<ApiResponseDTO> {
    const responseData = await this.api.request<any>({ url, method, body });

    let targetArray: any[] = getNestedData(responseData, dataPath);
    if (targetArray.length === 0 && !dataPath) {
      const firstArrayPath = findFirstArrayPath(responseData);
      if (firstArrayPath) {
        targetArray = getNestedData(responseData, firstArrayPath);
      } else {
        targetArray = Array.isArray(responseData) ? responseData : [];
      }
    }

    if (filters) {
      targetArray = targetArray.filter((item) => {
        const value = filters.field
          .split(".")
          .reduce((obj, key) => obj?.[key], item);
        return value == filters.value;
      });
    }

    return {
      data: targetArray,
      filteredBy: filters,
    };
  }
}
