import axios from "axios";
import { ApiResponseDTO } from "../../../application/dto/ApiResponseDto";
import { ApiConfig } from "../../../config/ApiConfigLoader";

export class ApiService {
  async execute(config: ApiConfig): Promise<ApiResponseDTO> {
    // 1. Costruzione dell'URL e chiamata
    const url = `${config.baseUrl}${config.endpoint}`;

    const response = await axios({
      method: config.method,
      url: url,
      data: config.body,
    });

    let data = response.data;
    let targetArray: Record<string, any>[] = [];

    // 2. Navigazione nel percorso dati (dataPath)
    if (config.dataPath) {
      data = this.resolvePath(data, config.dataPath);
    }

    // Ensure we have an array
    if (Array.isArray(data)) {
      targetArray = data;
    } else if (data && typeof data === "object") {
      // Try to find the first array in the response
      const firstArrayKey = Object.keys(data).find((key) =>
        Array.isArray(data[key])
      );
      targetArray = firstArrayKey ? data[firstArrayKey] : [data];
    }

    // 3. Applicazione del filtro (filter)
    if (config.filter && targetArray.length > 0) {
      targetArray = targetArray.filter((item) => {
        // Support nested field paths (field.subfield)
        const value = config
          .filter!.field.split(".")
          .reduce((obj, key) => obj?.[key], item);
        return value === config.filter!.value;
      });
    }

    // 4. Selezione dei campi (selectedFields)
    if (
      config.selectedFields &&
      config.selectedFields.length > 0 &&
      targetArray.length > 0
    ) {
      targetArray = targetArray.map((item) => {
        const filteredItem: Record<string, any> = {};
        config.selectedFields!.forEach((field) => {
          // Support nested fields in selectedFields too
          const value = field.split(".").reduce((obj, key) => obj?.[key], item);
          filteredItem[field] = value;
        });
        return filteredItem;
      });
    }

    // Return the proper ApiResponseDTO structure
    return {
      data: targetArray,
      filteredBy: config.filter,
      meta: {
        paths: config.dataPath ? [config.dataPath] : [],
        total: targetArray.length,
      },
    };
  }

  private resolvePath(obj: any, path: string) {
    return path.split(".").reduce((prev, curr) => prev?.[curr], obj);
  }
}
