import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateAnalysisUseCase } from "../../../../application/usecases/Analysis/CreateAnalysisUseCase";

// Mock delle utility esterne
vi.mock("../../../../infrastructure/utils/ObjectUtils", () => ({
  findFirstArrayPath: vi.fn(),
  getNestedData: vi.fn(),
  extractParamsFromUrl: vi.fn().mockReturnValue([]),
}));

vi.mock("../../../../infrastructure/utils/FindFirstArray", () => ({
  parseJsonFields: vi.fn(),
}));

// Import dei mock per manipolarli
import { findFirstArrayPath } from "../../../../infrastructure/utils/ObjectUtils";
import { parseJsonFields } from "../../../../infrastructure/utils/FindFirstArray";

describe("CreateAnalysisUseCase", () => {
  const mockApiPort = { request: vi.fn() };
  const mockAnalysisRepo = { save: vi.fn() };
  let useCase: CreateAnalysisUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreateAnalysisUseCase(
      mockApiPort as any,
      mockAnalysisRepo as any,
    );
  });

  it("dovrebbe creare un'analisi completa identificando il dataPath e pulendo i campi", async () => {
    const mockResponse = {
      meta: { code: 200 },
      data: [{ id: 1, title: "Post 1", author: { name: "User" } }],
    };

    mockApiPort.request.mockResolvedValue(mockResponse);
    (findFirstArrayPath as any).mockReturnValue("data");
    (parseJsonFields as any).mockReturnValue([
      "meta.code",
      "data.id",
      "data.title",
      "data.author.name",
    ]);

    const result = await useCase.execute(
      "https://api.example.com/posts",
      "GET",
    );

    expect(result.status).toBe("completed");

    // SOLUZIONE: Aggiungi "!" dopo discoveredSchema per dire a TS che sei sicuro che esista
    expect(result.discoveredSchema!.dataPath).toBe("data");
    expect(result.discoveredSchema!.suggestedFields).toContain("id");
    expect(result.discoveredSchema!.suggestedFields).toContain("title");
    expect(result.discoveredSchema!.suggestedFields).toContain("author.name");
    expect(result.discoveredSchema!.suggestedFields).not.toContain("meta.code");

    expect(mockAnalysisRepo.save).toHaveBeenCalled();
  });

  it("dovrebbe gestire risposte che sono già array (dataPath vuoto)", async () => {
    const mockArrayResponse = [{ id: 10, name: "Direct Item" }];
    mockApiPort.request.mockResolvedValue(mockArrayResponse);

    (findFirstArrayPath as any).mockReturnValue("");
    (parseJsonFields as any).mockReturnValue(["id", "name"]);

    const result = await useCase.execute("https://api.example.com/list", "GET");

    // SOLUZIONE: "!" anche qui
    expect(result.discoveredSchema!.dataPath).toBe("");
    expect(result.discoveredSchema!.suggestedFields).toEqual(["id", "name"]);
  });

  it("dovrebbe mantenere tutti i campi se il filtraggio per dataPath risulta vuoto (fallback)", async () => {
    mockApiPort.request.mockResolvedValue({ some: "data" });
    (findFirstArrayPath as any).mockReturnValue("nonexistent");
    (parseJsonFields as any).mockReturnValue(["field1", "field2"]);

    const result = await useCase.execute("https://api.test.com", "GET");

    // SOLUZIONE: "!" anche qui
    expect(result.discoveredSchema!.suggestedFields).toEqual([
      "field1",
      "field2",
    ]);
  });

  // Il test degli headers/body non usa discoveredSchema, quindi rimane invariato
  it("dovrebbe includere headers e body nella configurazione dell'analisi", async () => {
    mockApiPort.request.mockResolvedValue([]);
    const customHeaders = { Authorization: "Bearer token" };
    const customBody = { filter: "active" };

    const result = await useCase.execute(
      "https://api.test.com",
      "POST",
      customBody,
      customHeaders,
    );

    expect(result.headers).toEqual(customHeaders);
    expect(result.body).toEqual(customBody);
    expect(result.method).toBe("POST");
  });
});
