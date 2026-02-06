import { IExecutionRepository } from "../../../domain/ports/Execution/IExecutionRepository";
import { Execution } from "../../../domain/entities/Execution";

export class GetAllExecutionsByConfigUseCase {
  constructor(private executionRepo: IExecutionRepository) {}

  async execute(configId: string): Promise<Execution[]> {
    const results = await this.executionRepo.findByConfigId(configId);

    return results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}
