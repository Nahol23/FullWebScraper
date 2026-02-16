
import { HttpClient } from "../infrastructure/http/httpClient";
import { ApiExecutionRepository } from "../infrastructure/api/ApiExecutionRepository";
import { ConfigRepository } from "../infrastructure/api/ConfigRepository";
import { GetConfigsUseCase } from "../application/usecases/GetConfigsUseCase";
import { SaveConfigUseCase } from "../application/usecases/SaveConfigUseCase";
import { UpdateConfigUseCase } from "../application/usecases/UpdateConfigUseCase";
import { DeleteConfigUseCase } from "../application/usecases/DeleteConfigUseCase";
import { ExecuteApiUseCase } from "../application/usecases/ExecuteApiUseCase";
import { FetchLogsUseCase } from "../application/usecases/FetchLogsUseCase";
import { DeleteExecutionUseCase } from "../application/usecases/DeleteExecutionUseCase";
import { DownloadLogsUseCase } from "../application/usecases/DownloadLogsUseCase";
import type { IAnalysisRepository } from "../domain/ports/IAnalysisRepository";
import type { Analysis } from "../domain/entities/Analysis";
import { AnalysisRepository } from "@/infrastructure/api/AnalysisRepository";

export class AnalyzeApiUseCase {
  constructor(private readonly analysisRepository: IAnalysisRepository) {}

  async execute(options: {
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: any;
  }): Promise<Analysis> {
    // No additional business logic required at this layer – just delegate.
    return this.analysisRepository.analyze(options);
  }
}

const baseURL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const httpClient = new HttpClient(baseURL);

const configRepository = new ConfigRepository(httpClient); 
const apiExecutionRepository = new ApiExecutionRepository(httpClient);

export const getConfigsUseCase = new GetConfigsUseCase(configRepository);
export const saveConfigUseCase = new SaveConfigUseCase(configRepository);
export const updateConfigUseCase = new UpdateConfigUseCase(configRepository);
export const deleteConfigUseCase = new DeleteConfigUseCase(configRepository);

export const executeApiUseCase = new ExecuteApiUseCase(
  apiExecutionRepository,
  configRepository,
);

export const fetchLogsUseCase = new FetchLogsUseCase(apiExecutionRepository);

export const deleteExecutionUseCase = new DeleteExecutionUseCase(apiExecutionRepository);

export const downloadLogsUseCase = new DownloadLogsUseCase(apiExecutionRepository);

export { httpClient, configRepository, apiExecutionRepository };

export const analysisRepository = new AnalysisRepository(httpClient);

export const analyzeApiUseCase = new AnalyzeApiUseCase(analysisRepository);