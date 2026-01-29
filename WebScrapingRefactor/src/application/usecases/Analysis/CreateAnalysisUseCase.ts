import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { Analysis } from "../../../domain/entities/Analysis";
import { findFirstArrayPath } from "../../../infrastructure/utils/ObjectUtils"; 
import { extractFields } from "../../../infrastructure/utils/ObjectUtils";
import { extractParamsFromUrl } from "../../../infrastructure/utils/ObjectUtils";

export class CreateAnalysisUseCase {
  constructor(private apiPort: IApiPort) {}

  async execute(url: string, method: "GET" | "POST", body?: any ): Promise<Analysis> {
    const rawResponse = await this.apiPort.request({ url, method, body});
    
    return {
      id: crypto.randomUUID(),
      url,
      method,
      body,
      status: "completed",
      discoveredSchema: {
         suggestedFields: extractFields(rawResponse),
         dataPath: findFirstArrayPath(rawResponse),
         params: extractParamsFromUrl(url)
      },
      createdAt: new Date()
    };
  }
}