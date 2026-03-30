import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyzeScrapingUseCase } from "../../../../application/usecases/Scraping/AnalyzeScrapingUsecase";

describe("AnalyzeScrapingUseCase", () => {
  let useCase: AnalyzeScrapingUseCase;
  const mockScraper = { scrape: vi.fn() };
  const mockAnalyzer = { fetchAndAnalyze: vi.fn() };
  const mockRepo = { save: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new AnalyzeScrapingUseCase(
      mockScraper as any,
      mockAnalyzer as any,
      mockRepo as any,
    );
  });

  it("dovrebbe analizzare con successo e salvare il risultato", async () => {
    mockAnalyzer.fetchAndAnalyze.mockResolvedValue({
      title: "Test Page",
      suggestedRules: [{ fieldName: "title", selector: "h1" }],
      listSelectors: [".item"],
    });

    mockScraper.scrape.mockResolvedValue({ items: [{ title: "Hello" }] });

    const result = await useCase.execute("https://example.com");

    expect(result.title).toBe("Test Page");
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed" }),
    );
  });

  it("dovrebbe salvare uno stato di errore se l'analisi fallisce", async () => {
    mockAnalyzer.fetchAndAnalyze.mockRejectedValue(new Error("Network error"));

    await expect(useCase.execute("https://example.com")).rejects.toThrow();
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed" }),
    );
  });
});
