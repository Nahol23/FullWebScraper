import type { ExecutionRepository } from "../../domain/ports/ExecutionRepository";
import { ExecutionOverridesVO } from "../../domain/value-objects/ExecutionOverrides";

export class StartExecutionUseCase {
  private readonly repo: ExecutionRepository;

  constructor(repo: ExecutionRepository) {
    this.repo = repo;
  }

  async execute(configName: string, overrides?: Record<string, unknown>) {
    const vo = new ExecutionOverridesVO(overrides);
    return this.repo.execute(configName, vo.raw );
  }
}
