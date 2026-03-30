import { describe, it, expect, vi, beforeEach } from "vitest";
import { DownloadLogsUseCase } from "../../../../application/usecases/api/DownloadLogsUseCase";
import type { IApiExecutionRepository } from "../../../../domain/ports/IApiExecutionRepository";

describe("DownloadLogsUseCase", () => {
  let mockRepo: IApiExecutionRepository;
  let useCase: DownloadLogsUseCase;
  const mockBlob = new Blob(["test"], { type: "application/json" });

  beforeEach(() => {
    mockRepo = {
      downloadLogs: vi.fn().mockResolvedValue(mockBlob),
      execute: vi.fn(),
      getLogsByConfig: vi.fn(),
      deleteLog: vi.fn(),
    };
    useCase = new DownloadLogsUseCase(mockRepo);
  });

  it("dovrebbe restituire un blob per il download dei log", async () => {
    const result = await useCase.execute("configName", "json");

    expect(mockRepo.downloadLogs).toHaveBeenCalledWith("configName", "json");
    expect(result).toBe(mockBlob);
  });

  it("dovrebbe usare il formato markdown se specificato", async () => {
    await useCase.execute("configName", "markdown");

    expect(mockRepo.downloadLogs).toHaveBeenCalledWith(
      "configName",
      "markdown",
    );
  });
});
