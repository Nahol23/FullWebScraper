/**
 * Application Use Case: FetchLogsUseCase
 * Recupera lo storico delle esecuzioni (log) dal repository.
 */
import type { ExecutionHistory } from "../../domain/entities/ApiConfig";
import type { IApiExecutionRepository } from "../../domain/ports/IApiExecutionRepository";

export class FetchLogsUseCase {
  constructor(private readonly apiExecutionRepository: IApiExecutionRepository) {}

  async execute(configId: string, limit?: number): Promise<ExecutionHistory[]> {
    return await this.apiExecutionRepository.getLogsByConfig(configId, limit);
  }
}