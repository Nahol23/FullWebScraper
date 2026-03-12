import type { IApiExecutionRepository } from "../../../domain/ports/IApiExecutionRepository";

export type ExportFormat = "json" | "markdown";

export class DownloadLogsUseCase {
  constructor(
    private readonly apiExecutionRepository: IApiExecutionRepository,
  ) {}

  async execute(
    configName: string,
    format: ExportFormat = "json",
  ): Promise<Blob> {
    // Delega al repository il recupero del file binario
    return await this.apiExecutionRepository.downloadLogs(configName, format);
  }
}
