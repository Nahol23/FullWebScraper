import { describe, it, expect, vi, beforeEach } from "vitest";
import { FetchLogsUseCase } from "../../../application/usecases/api/FetchLogsUseCase";
import type { IApiExecutionRepository } from "../../../domain/ports/IApiExecutionRepository";
import type { ExecutionHistory } from "../../../domain/entities/ApiConfig";

describe("FetchLogsUseCase", () => {
  let mockRepo: IApiExecutionRepository;
  let useCase: FetchLogsUseCase;

  const mockLogs: ExecutionHistory[] = [
    {
      id: "log1",
      timestamp: new Date().toISOString(),
      status: 200,
      duration: 100,
    },
    {
      id: "log2",
      timestamp: new Date().toISOString(),
      status: 404,
      duration: 50,
      errorMessage: "Not found",
    },
  ];

  beforeEach(() => {
    mockRepo = {
      getLogsByConfig: vi.fn().mockResolvedValue(mockLogs),
      execute: vi.fn(),
      deleteLog: vi.fn(),
      downloadLogs: vi.fn(),
    };
    useCase = new FetchLogsUseCase(mockRepo);
  });

  it("dovrebbe restituire i log per una configurazione", async () => {
    const result = await useCase.execute("cfg123");

    expect(vi.mocked(mockRepo.getLogsByConfig)).toHaveBeenCalledWith(
      "cfg123",
      undefined,
    );
    expect(result).toEqual(mockLogs);
  });

  it("dovrebbe passare il limite al repository", async () => {
    await useCase.execute("cfg123", 5);

    expect(vi.mocked(mockRepo.getLogsByConfig)).toHaveBeenCalledWith(
      "cfg123",
      5,
    );
  });
});
