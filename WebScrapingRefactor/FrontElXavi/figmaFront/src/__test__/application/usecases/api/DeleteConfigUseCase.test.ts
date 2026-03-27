import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteConfigUseCase } from "../../../../application/usecases/api/DeleteConfigUseCase";
import type { IConfigRepository } from "../../../../domain/ports/IConfigRepository";
import { ConfigNotFoundError } from "../../../../domain/errors/AppError";
import type { ApiConfig } from "../../../../domain/entities/ApiConfig";

describe("DeleteConfigUseCase", () => {
  let mockRepo: IConfigRepository;
  let useCase: DeleteConfigUseCase;

  const existingConfig: ApiConfig = {
    id: "cfg123",
    name: "Test",
    baseUrl: "https://example.com",
    endpoint: "/test",
    method: "GET",
  };

  beforeEach(() => {
    mockRepo = {
      getById: vi.fn().mockResolvedValue(existingConfig),
      delete: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };
    useCase = new DeleteConfigUseCase(mockRepo);
  });

  it("dovrebbe eliminare una configurazione esistente", async () => {
    await useCase.execute("cfg123");

    expect(vi.mocked(mockRepo.getById)).toHaveBeenCalledWith("cfg123");
    expect(vi.mocked(mockRepo.delete)).toHaveBeenCalledWith("cfg123");
  });

  it("dovrebbe lanciare ConfigNotFoundError se la configurazione non esiste", async () => {
    vi.mocked(mockRepo.getById).mockResolvedValueOnce(null);

    await expect(useCase.execute("missing")).rejects.toThrow(
      ConfigNotFoundError,
    );
    expect(vi.mocked(mockRepo.delete)).not.toHaveBeenCalled();
  });
});
