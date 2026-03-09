import type { IScrapingExecutionRepository } from "../../../domain/ports/scraping/IScrapingExecutionRepository";

export type ExportFormat = "json" | "markdown";

export class DownloadScrapingLogsUseCase {
  constructor(private readonly scrapingExecutionRepository: IScrapingExecutionRepository) {}

  async execute(configName: string, format: ExportFormat = "json"): Promise<Blob> {
    return await this.scrapingExecutionRepository.downloadLogs(configName, format);
  }
}