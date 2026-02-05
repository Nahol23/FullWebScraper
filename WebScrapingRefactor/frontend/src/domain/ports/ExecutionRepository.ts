import type { ApiResponseDTO } from "../../types/ApiResponseDTO";
import type { Execution } from "../../types/Execution";

export interface ExecutionRepository {
    //  per operazioni che modificano lo stato
  execute(
    name: string,
    runtimeParams?: Record<string, unknown>
  ): Promise<ApiResponseDTO>;
  // per operazioni che leggono lo stato
  getLogs(): Promise<Execution[]>;
}
