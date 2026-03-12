import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteExecutionUseCase } from "../../../application/usecases/api/DeleteExecutionUseCase";
import type { IApiExecutionRepository } from "../../../domain/ports/IApiExecutionRepository";

describe("DeleteExecutionUseCase", () => {
  let mockRepo: IApiExecutionRepository;
  let useCase: DeleteExecutionUseCase;

  beforeEach(() => {
    mockRepo = {
      deleteLog: vi.fn().mockResolvedValue(undefined),
      execute: vi.fn(),
      getLogsByConfig: vi.fn(),
      downloadLogs: vi.fn(),
    };
    useCase = new DeleteExecutionUseCase(mockRepo);
  });

  it("dovrebbe eliminare un log di esecuzione", async () => {
    await useCase.execute("cfg123", "exec456");

    expect(vi.mocked(mockRepo.deleteLog)).toHaveBeenCalledWith(
      "cfg123",
      "exec456",
    );
  });
});
