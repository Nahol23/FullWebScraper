import apiClient from "../http/apiClient";
import type { ExecutionRepository } from "../../domain/ports/ExecutionRepository";
import type { Execution } from "../../types/Execution";
import type { ApiResponseDTO } from "../../types/ApiResponseDTO";

export class ExecutionHttpRepository implements ExecutionRepository {
  async execute(
    configId: string,
    runtimeParams?: Record<string, unknown>
  ): Promise<ApiResponseDTO> {
    const { data } = await apiClient.post<ApiResponseDTO>(
      `/executions/${configId}/execute`,
      runtimeParams
    );
    return data;
  }

  async getLogs(): Promise<Execution[]> {
    const { data } = await apiClient.get<Execution[]>("/executions");
    return data;
  }

  async getLogsByConfig(configId: string): Promise<Execution[]> {
    const { data } = await apiClient.get<Execution[]>(
      `/executions/${configId}`
    );
    return data;
  }

  async deleteLog(configId: string, logId: string): Promise<void> {
    await apiClient.delete(`/executions/${configId}/${logId}`);
  }
}
