import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateConfigUseCase } from "../../../../application/usecases/api/UpdateConfigUseCase";
import type { IConfigRepository } from "../../../../domain/ports/IConfigRepository";
import {
  ConfigNotFoundError,
  ValidationError,
} from "../../../../domain/errors/AppError";
import type { ApiConfig } from "../../../../domain/entities/ApiConfig";

describe("UpdateConfigUseCase", () => {
  let mockRepo: IConfigRepository;
  let useCase: UpdateConfigUseCase;

  const existingConfig: ApiConfig = {
    id: "cfg123",
    name: "Old Name",
    baseUrl: "https://old.com",
    endpoint: "/old",
    method: "GET",
  };

  beforeEach(() => {
    mockRepo = {
      getById: vi.fn().mockResolvedValue(existingConfig),
      update: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new UpdateConfigUseCase(mockRepo);
  });

  it("dovrebbe aggiornare una configurazione esistente valida", async () => {
    const updatedConfig: ApiConfig = {
      ...existingConfig,
      name: "New Name",
      baseUrl: "https://new.com",
    };

    await useCase.execute(updatedConfig);

    expect(vi.mocked(mockRepo.getById)).toHaveBeenCalledWith("cfg123");
    expect(vi.mocked(mockRepo.update)).toHaveBeenCalledWith(
      "cfg123",
      updatedConfig,
    );
  });

  it("dovrebbe lanciare ConfigNotFoundError se la configurazione non esiste", async () => {
    vi.mocked(mockRepo.getById).mockResolvedValueOnce(null);
    const updatedConfig: ApiConfig = { ...existingConfig, id: "missing" };

    await expect(useCase.execute(updatedConfig)).rejects.toThrow(
      ConfigNotFoundError,
    );
    expect(vi.mocked(mockRepo.update)).not.toHaveBeenCalled();
  });

  it("dovrebbe lanciare ValidationError se il nome è vuoto", async () => {
    const invalidConfig = { ...existingConfig, name: "" };

    await expect(useCase.execute(invalidConfig)).rejects.toThrow(
      ValidationError,
    );
    expect(vi.mocked(mockRepo.update)).not.toHaveBeenCalled();
  });

  it("dovrebbe lanciare ValidationError se baseUrl non è valido", async () => {
    const invalidConfig = { ...existingConfig, baseUrl: "invalid" };

    await expect(useCase.execute(invalidConfig)).rejects.toThrow(
      ValidationError,
    );
  });

  it("dovrebbe lanciare ValidationError se method non è GET o POST", async () => {
    const invalidConfig = { ...existingConfig, method: "PUT" } as any;

    await expect(useCase.execute(invalidConfig)).rejects.toThrow(
      ValidationError,
    );
  });
});
