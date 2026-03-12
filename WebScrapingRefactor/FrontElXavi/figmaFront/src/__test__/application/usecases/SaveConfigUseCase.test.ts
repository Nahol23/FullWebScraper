import { describe, it, expect, vi, beforeEach } from "vitest";
import { SaveConfigUseCase } from "../../../application/usecases/api/SaveConfigUseCase";
import type { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import { ValidationError } from "../../../domain/errors/AppError";
import type { ApiConfig } from "../../../domain/entities/ApiConfig";

describe("SaveConfigUseCase", () => {
  let mockRepo: IConfigRepository;
  let useCase: SaveConfigUseCase;

  beforeEach(() => {
    mockRepo = {
      save: vi
        .fn()
        .mockImplementation((config) =>
          Promise.resolve({ ...config, id: "123" }),
        ),
      getAll: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new SaveConfigUseCase(mockRepo);
  });

  it("dovrebbe salvare una configurazione valida", async () => {
    const validConfig: Omit<ApiConfig, "id"> = {
      name: "Test API",
      baseUrl: "https://api.example.com",
      endpoint: "/v1/test",
      method: "GET",
    };

    const result = await useCase.execute(validConfig);

    expect(vi.mocked(mockRepo.save)).toHaveBeenCalledWith(
      expect.objectContaining(validConfig),
    );
    expect(result).toHaveProperty("id", "123");
  });

  it("dovrebbe lanciare ValidationError se il nome è vuoto", async () => {
    const invalidConfig: Omit<ApiConfig, "id"> = {
      name: "",
      baseUrl: "https://api.example.com",
      endpoint: "/v1/test",
      method: "GET",
    };

    await expect(useCase.execute(invalidConfig)).rejects.toThrow(
      ValidationError,
    );
    expect(vi.mocked(mockRepo.save)).not.toHaveBeenCalled();
  });

  it("dovrebbe lanciare ValidationError se baseUrl non è un URL valido", async () => {
    const invalidConfig: Omit<ApiConfig, "id"> = {
      name: "Test",
      baseUrl: "not-a-url",
      endpoint: "/v1/test",
      method: "GET",
    };

    await expect(useCase.execute(invalidConfig)).rejects.toThrow(
      ValidationError,
    );
    expect(vi.mocked(mockRepo.save)).not.toHaveBeenCalled();
  });

  it("dovrebbe lanciare ValidationError se endpoint è vuoto", async () => {
    const invalidConfig: Omit<ApiConfig, "id"> = {
      name: "Test",
      baseUrl: "https://api.example.com",
      endpoint: "",
      method: "GET",
    };

    await expect(useCase.execute(invalidConfig)).rejects.toThrow(
      ValidationError,
    );
  });

  it("dovrebbe lanciare ValidationError se method non è GET o POST", async () => {
    const invalidConfig = {
      name: "Test",
      baseUrl: "https://api.example.com",
      endpoint: "/test",
      method: "DELETE",
    } as any;

    await expect(useCase.execute(invalidConfig)).rejects.toThrow(
      ValidationError,
    );
  });
});
