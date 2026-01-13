import { ApiResponseDTO } from "../dto/ApiResponseDto";
import { ApiUseCase } from "../usecases/Api/ApiUseCase";

export class ApiWorkflow {
  constructor(private apiUseCase: ApiUseCase) {}
  async execute(
    url: string,
    method: "GET" | "POST",
    filters?: { field: string; value: any },
    body?: any,
    dataPath?: string
  ): Promise<ApiResponseDTO> {
    return await this.apiUseCase.execute(url, method, filters, body, dataPath);
  }


  async executeBatch(
    requests: { url: string; method: "GET" | "POST"; body?: any; dataPath?: string }[],
    concurrencyLimit: number = 3
  ): Promise<ApiResponseDTO[]> {
    const results: ApiResponseDTO[] = [];
    
    // Process in chunks to respect rate limits
    for (let i = 0; i < requests.length; i += concurrencyLimit) {
      const chunk = requests.slice(i, i + concurrencyLimit);
      const promises = chunk.map(req => 
        this.apiUseCase.execute(req.url, req.method, undefined, req.body, req.dataPath)
      );
      
      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    return results;
  }
}