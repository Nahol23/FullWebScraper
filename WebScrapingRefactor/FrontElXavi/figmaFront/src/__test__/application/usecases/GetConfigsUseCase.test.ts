import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetConfigsUseCase } from "../../../application/usecases/api/GetConfigsUseCase";
import type { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import type { ApiConfig } from "../../../domain/entities/ApiConfig";

describe("GetConfigsUseCase", () => {
  let mockRepo: IConfigRepository;
  let useCase: GetConfigsUseCase;

  const mockConfigs: ApiConfig[] = [
    {
      id: "1",
      name: "Config1",
      baseUrl: "https://a.com",
      endpoint: "/a",
      method: "GET",
    },
    {
      id: "2",
      name: "Config2",
      baseUrl: "https://b.com",
      endpoint: "/b",
      method: "POST",
    },
  ];

  beforeEach(() => {
    mockRepo = {
      getAll: vi.fn().mockResolvedValue(mockConfigs),
      getById: vi
        .fn()
        .mockImplementation((id) =>
          Promise.resolve(mockConfigs.find((c) => c.id === id) || null),
        ),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new GetConfigsUseCase(mockRepo);
  });

  it("dovrebbe restituire tutte le configurazioni", async () => {
    const result = await useCase.execute();

    expect(vi.mocked(mockRepo.getAll)).toHaveBeenCalled();
    expect(result).toEqual(mockConfigs);
  });

  it("dovrebbe restituire una configurazione per ID", async () => {
    const result = await useCase.executeById("1");

    expect(vi.mocked(mockRepo.getById)).toHaveBeenCalledWith("1");
    expect(result).toEqual(mockConfigs[0]);
  });

  it("dovrebbe restituire null se l’ID non esiste", async () => {
    const result = await useCase.executeById("999");

    expect(vi.mocked(mockRepo.getById)).toHaveBeenCalledWith("999");
    expect(result).toBeNull();
  });
});
