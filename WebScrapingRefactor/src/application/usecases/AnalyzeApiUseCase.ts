import { IApiPort } from "../../domain/ports/Api/IApiPort";

export interface AnalyzeApiResponse {
  sampleData: any;
  suggestedFields: string[];
}

export class AnalyzeApiUseCase {
  constructor(private apiPort: IApiPort) {}

  async analyze(url: string, method: "GET" | "POST", body?: any): Promise<AnalyzeApiResponse> {
    const response = await this.apiPort.request({ url, method, body });

    const suggestedFields = typeof response === "object"
      ? Object.keys(Array.isArray(response) ? response[0] || {} : response)
      : [];

    return {
      sampleData: response,
      suggestedFields,
    };
  }
}