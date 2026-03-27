import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExecuteApiUseCase } from "../../../../application/usecases/api/ExecuteApiUseCase";
import type { IApiExecutionRepository } from "../../../../domain/ports/IApiExecutionRepository";
import type { IConfigRepository } from "../../../../domain/ports/IConfigRepository";
import { ConfigNotFoundError } from "../../../../domain/errors/AppError";
import type { ApiConfig } from "../../../../domain/entities/ApiConfig";
import type { RuntimeParams } from "../../../../domain/entities/RuntimeParams";

describe("ExecuteApiUseCase", () => {
  let mockExecutionRepo: IApiExecutionRepository;
  let mockConfigRepo: IConfigRepository;
  let useCase: ExecuteApiUseCase;

  const mockConfig: ApiConfig = {
    id: "cfg123",
    name: "Test",
    baseUrl: "https://api.example.com",
    endpoint: "/data",
    method: "GET",
    headers: { "X-API-Key": "123" },
    queryParams: [{ key: "format", value: "json" }],
    dataPath: "items",
    selectedFields: ["id", "name"],
    pagination: {
      type: "offset",
      paramName: "offset",
      limitParam: "limit",
      defaultLimit: 50,
    },
  };

  beforeEach(() => {
    mockExecutionRepo = {
      execute: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "test" }] }),
      getLogsByConfig: vi.fn(),
      deleteLog: vi.fn(),
      downloadLogs: vi.fn(),
    };

    mockConfigRepo = {
      getById: vi.fn().mockResolvedValue(mockConfig),
      getAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new ExecuteApiUseCase(mockExecutionRepo, mockConfigRepo);
  });

  it("dovrebbe eseguire l’API con i parametri di default della configurazione", async () => {
    const result = await useCase.execute("cfg123");

    expect(vi.mocked(mockConfigRepo.getById)).toHaveBeenCalledWith("cfg123");
    expect(vi.mocked(mockExecutionRepo.execute)).toHaveBeenCalledWith(
      "cfg123",
      {
        dataPath: "items",
        selectedFields: ["id", "name"],
        headers: { "X-API-Key": "123" },
        queryParams: { format: "json" },
      },
    );
    expect(result).toEqual({ data: [{ id: 1, name: "test" }] });
  });

  it("dovrebbe fondere i runtimeParams con la configurazione", async () => {
    const runtime: RuntimeParams = {
      page: 2,
      limit: 20,
      headers: { "X-Custom": "value" },
      queryParams: { sort: "name" },
      dataPath: "newPath",
      selectedFields: ["id"],
      body: { foo: "bar" },
    };

    await useCase.execute("cfg123", runtime);

    expect(vi.mocked(mockExecutionRepo.execute)).toHaveBeenCalledWith(
      "cfg123",
      {
        dataPath: "newPath",
        selectedFields: ["id"],
        headers: { "X-API-Key": "123", "X-Custom": "value" },
        queryParams: { format: "json", sort: "name" },
        page: 2,
        limit: 20,
        body: { foo: "bar" },
      },
    );
  });

  it("dovrebbe ignorare i parametri runtime vuoti o undefined", async () => {
    const runtime: RuntimeParams = {
      page: undefined,
      limit: undefined,
      headers: undefined,
      queryParams: {},
      dataPath: "",
      selectedFields: [],
    };

    await useCase.execute("cfg123", runtime);

    expect(vi.mocked(mockExecutionRepo.execute)).toHaveBeenCalledWith(
      "cfg123",
      {
        dataPath: "items",
        selectedFields: ["id", "name"],
        headers: { "X-API-Key": "123" },
        queryParams: { format: "json" },
      },
    );
  });

  it("dovrebbe lanciare ConfigNotFoundError se la configurazione non esiste", async () => {
    vi.mocked(mockConfigRepo.getById).mockResolvedValueOnce(null);

    await expect(useCase.execute("missing")).rejects.toThrow(
      ConfigNotFoundError,
    );
    expect(vi.mocked(mockExecutionRepo.execute)).not.toHaveBeenCalled();
  });

  it("dovrebbe usare il dataPath della configurazione se non fornito runtime", async () => {
    const runtime = { page: 1 };
    await useCase.execute("cfg123", runtime);
    expect(vi.mocked(mockExecutionRepo.execute)).toHaveBeenCalledWith(
      "cfg123",
      expect.objectContaining({ dataPath: "items" }),
    );
  });

  it("dovrebbe usare selectedFields della configurazione se non fornito runtime", async () => {
    const runtime = { limit: 10 };
    await useCase.execute("cfg123", runtime);
    expect(vi.mocked(mockExecutionRepo.execute)).toHaveBeenCalledWith(
      "cfg123",
      expect.objectContaining({ selectedFields: ["id", "name"] }),
    );
  });
});
