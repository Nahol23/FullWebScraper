import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyzeApiUseCase } from "../../../application/usecases/api/AnalyzeApiUseCase";
import type { IAnalysisRepository } from "../../../domain/ports/IAnalysisRepository";
import type { Analysis } from "../../../domain/entities/Analysis";

describe("AnalyzeApiUseCase", () => {
  let mockRepo: IAnalysisRepository;
  let useCase: AnalyzeApiUseCase;

  const mockAnalysis: Analysis = {
    id: "anl123",
    url: "https://api.example.com/data",
    method: "GET",
    status: "completed",
    discoveredSchema: { suggestedFields: ["id", "name"], dataPath: "results" },
    createdAt: new Date(),
    data: true,
    fields: true,
    suggestedFields: {},
    dataPath: {},
  };

  beforeEach(() => {
    mockRepo = {
      analyze: vi.fn().mockResolvedValue(mockAnalysis),
    };
    useCase = new AnalyzeApiUseCase(mockRepo);
  });

  it("dovrebbe chiamare il repository con i parametri corretti", async () => {
    const options = {
      url: "https://api.example.com/data",
      method: "GET" as const,
      headers: { "X-API-Key": "123" },
      body: { foo: "bar" },
    };

    const result = await useCase.execute(options);

    expect(vi.mocked(mockRepo.analyze)).toHaveBeenCalledWith(options);
    expect(result).toBe(mockAnalysis);
  });

  it("dovrebbe funzionare anche senza headers e body", async () => {
    const options = {
      url: "https://api.example.com/data",
      method: "POST" as const,
    };

    await useCase.execute(options);

    expect(vi.mocked(mockRepo.analyze)).toHaveBeenCalledWith(options);
  });
});
