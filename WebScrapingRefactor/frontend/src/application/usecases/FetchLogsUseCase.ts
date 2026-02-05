import type { ExecutionRepository } from "../../domain/ports/ExecutionRepository";
import type { Execution } from "../../types/Execution";

export class FetchLogsUseCase {
  private readonly repo: ExecutionRepository;

  constructor(repo: ExecutionRepository) {
    this.repo = repo;
  }

  async execute(pageSize: number = 50): Promise<Execution[]> {
    if (pageSize === 0) return [];

    const logs = await this.repo.getLogs();

    return logs
      .sort((a, b) => {
        const ta = new Date(a.timestamp).getTime();
        const tb = new Date(b.timestamp).getTime();

        const safeA = isNaN(ta) ? 0 : ta;
        const safeB = isNaN(tb) ? 0 : tb;

        return safeB - safeA;
      })
      .slice(0, pageSize);
  }
}
