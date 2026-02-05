import apiClient from "../http/apiClient";
import type { ExecutionRepository } from "../../domain/ports/ExecutionRepository";
import type { Execution } from "../../types/Execution";
import type { ApiResponseDTO } from "../../types/ApiResponseDTO";

export class ExecutionHttpRepository implements ExecutionRepository {
  async execute(
    name: string,
    runtimeParams?: Record<string, unknown>
  ): Promise<ApiResponseDTO> {
    const { data } = await apiClient.post<ApiResponseDTO>(
      `/executions/${name}/execute`,
      runtimeParams
    );
    return data;
  }

  async getLogs(): Promise<Execution[]> {
    const { data } = await apiClient.get<Execution[]>("/executions");
    return data;
  }
}
