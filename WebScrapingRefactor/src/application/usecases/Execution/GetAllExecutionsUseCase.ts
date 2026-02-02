import { Execution } from "../../../domain/entities/Execution";
import { IExecutionRepository } from "../../../domain/ports/Execution/IExecutionRepository";

export class GetAllExecutionsUseCase {
  constructor(private executionRepo: IExecutionRepository) {}

  async execute(): Promise<Execution[]> {
    const results = await this.executionRepo.findAll();
    return results.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}