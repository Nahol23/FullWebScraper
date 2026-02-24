import type { ConfigRepository } from "../../domain/ports/ConfigRepository";

export class DeleteConfigUseCase {
  private readonly repo: ConfigRepository;
  constructor(repo: ConfigRepository) {
    this.repo = repo;
  }
  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error("Config ID is required");
    }
    await this.repo.delete(id);
  }
}
