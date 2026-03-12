import type { IScrapingConfigRepository } from "../../../domain/ports/ScrapingConfig/IScrapingConfigRepository";
import { ConfigNotFoundError } from "../../../domain/errors/AppError";

export class DeleteScrapingConfigUseCase {
  constructor(
    private readonly scrapingConfigRepository: IScrapingConfigRepository,
  ) {}

  /**
   * Deletes a scraping configuration by id.
   *
   * The getById() pre-check was removed because:
   * 1. It was redundant — the filesystem delete is already a no-op if the
   *    file doesn't exist (fs.existsSync guard in the repository).
   * 2. Old configs saved without an `id` field caused getById() to return
   *    a config with id=undefined, which triggered the ConfigNotFoundError
   *    even when the file existed on disk.
   *
   * Id is validated at the boundary (before any I/O) instead.
   */
  async execute(configId: string): Promise<void> {
    if (!configId) {
      throw new ConfigNotFoundError(configId, "Scraping configuration");
    }
    await this.scrapingConfigRepository.delete(configId);
  }
}