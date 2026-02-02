import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { Analysis } from "../../../domain/entities/Analysis";
import {
  findFirstArrayPath,
  getNestedData,
  extractParamsFromUrl,
} from "../../../infrastructure/utils/ObjectUtils";
import { IAnalysisRepository } from "../../../domain/ports/Analyze/IAnalysisRepository";
import { parseJsonFields } from '../../../infrastructure/utils/FindFirstArray';
export class CreateAnalysisUseCase {
  constructor(
    private apiPort: IApiPort,
    private analysisRepo: IAnalysisRepository,
  ) {}

  async execute(
    url: string,
    method: "GET" | "POST",
    body?: any,
    headers?: Record<string, string>
  ): Promise<Analysis> {
    const rawResponse = await this.apiPort.request({ url, method, body });
    const dataPath = findFirstArrayPath(rawResponse) || "";
    const targetData = dataPath ? getNestedData(rawResponse, dataPath) : rawResponse;
    const suggestedFields = parseJsonFields(targetData);

    // (Logica di business)
    const analysis: Analysis = {
      id: crypto.randomUUID(),
      url,
      method,
      body,
      headers,
      status: "completed",
      discoveredSchema: {
        suggestedFields, 
        dataPath,
        params: extractParamsFromUrl(url),
      },
      createdAt: new Date(),
    };

    await this.analysisRepo.save(analysis);

    return analysis;
  }
}
