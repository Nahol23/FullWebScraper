import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { ApiResponseDTO } from "../../dto/ApiResponseDto";

export class ApiUseCase {
  constructor(private api: IApiPort) {}

  // Metodo RAW senza processing
  async executeRaw(
    url: string,
    method: "GET" | "POST",
    body?: any
  ): Promise<any> {
    const res = await this.api.request<any>({ url, method, body });
    console.log("DEBUG: Raw API Response Keys:", Object.keys(res));
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

    let targetArray: any[] = [];
    if (dataPath) {
      targetArray = dataPath
        .split(".")
        .reduce((obj, key) => obj?.[key], responseData);
    } else {
      const firstArrayKey = Object.keys(responseData).find((key) =>
        Array.isArray(responseData[key])
      );
      targetArray = firstArrayKey ? responseData[firstArrayKey] : responseData;
    }

    if (!Array.isArray(targetArray)) targetArray = [];

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
