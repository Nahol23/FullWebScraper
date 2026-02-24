import { IExecutionRepository } from "../../../domain/ports/Execution/IExecutionRepository";

export class DeleteExecutionUseCase {
  constructor(private executionRepo: IExecutionRepository) {}

  async execute(executionId: string): Promise<void> {
    await this.executionRepo.delete(executionId);
  }
}
