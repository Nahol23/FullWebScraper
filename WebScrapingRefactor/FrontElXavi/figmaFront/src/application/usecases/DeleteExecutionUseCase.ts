import type { IApiExecutionRepository } from "../../domain/ports/IApiExecutionRepository";

export class DeleteExecutionUseCase {
  constructor(private readonly apiExecutionRepository: IApiExecutionRepository) {}

  async execute(configId: string, executionId: string): Promise<void> {
    await this.apiExecutionRepository.deleteLog(configId, executionId);
  }
}