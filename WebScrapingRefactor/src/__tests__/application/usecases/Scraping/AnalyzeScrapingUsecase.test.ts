import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyzeScrapingUseCase } from "../../../../application/usecases/Scraping/AnalyzeScrapingUsecase";
import type { IScrapingPort } from "../../../../domain/ports/IScrapingPort";
import type { IScrapingAnalyzerPort, AnalyzeOptions } from "../../../../domain/ports/IScrapingAnalyzerPort";
import type { IScrapingAnalysisRepository } from "../../../../domain/ports/ScrapingConfig/IScrapingAnalysisRepository";
import type { ExtractionRule } from "../../../../domain/entities/ScrapingConfig";


// Helpers / Fixtures


const MOCK_URL = "https://example.com/products";

const MOCK_RULES: ExtractionRule[] = [
  { fieldName: "title", selector: "h1.product-title", attribute: "text" },
  { fieldName: "price", selector: "span.price", attribute: "text" },
];

const MOCK_ANALYSIS = {
  title: "Example Products Page",
  suggestedRules: MOCK_RULES,
  listSelectors: ["ul.product-list"],
};

const MOCK_SAMPLE_DATA = [
  { title: "Product A", price: "€10.00" },
  { title: "Product B", price: "€20.00" },
];


// Mock factories — typed so we catch interface drift at compile time


function makeScraper(
  overrides?: Partial<IScrapingPort>,
): IScrapingPort {
  return {
    scrape: vi.fn().mockResolvedValue(MOCK_SAMPLE_DATA),
    ...overrides,
  };
}

function makeAnalyzer(
  overrides?: Partial<IScrapingAnalyzerPort>,
): IScrapingAnalyzerPort {
  return {
    fetchAndAnalyze: vi.fn().mockResolvedValue(MOCK_ANALYSIS),
    ...overrides,
  };
}

function makeRepository(
  overrides?: Partial<IScrapingAnalysisRepository>,
): IScrapingAnalysisRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn(),
    findAll: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}


// Test Suite


describe("AnalyzeScrapingUseCase", () => {
  let scraper: IScrapingPort;
  let analyzer: IScrapingAnalyzerPort;
  let repository: IScrapingAnalysisRepository;
  let useCase: AnalyzeScrapingUseCase;

  beforeEach(() => {
    scraper = makeScraper();
    analyzer = makeAnalyzer();
    repository = makeRepository();
    useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);
  });

  // se tutto è perfetto
  describe("execute — happy path", () => {
    it("should return a ScrapingAnalysisResult with the correct shape", async () => {
      const result = await useCase.execute(MOCK_URL);

      expect(result.url).toBe(MOCK_URL);
      expect(result.title).toBe(MOCK_ANALYSIS.title);
      expect(result.suggestedRules).toEqual(MOCK_RULES);
      expect(result.sampleData).toEqual(MOCK_SAMPLE_DATA);
      expect(result.detectedListSelectors).toEqual(MOCK_ANALYSIS.listSelectors);
    });

    it("should call fetchAndAnalyze with the provided url and options", async () => {
      const options: AnalyzeOptions = { useJavaScript: true, waitForSelector: ".loaded" };

      await useCase.execute(MOCK_URL, options);

      expect(analyzer.fetchAndAnalyze).toHaveBeenCalledOnce();
      expect(analyzer.fetchAndAnalyze).toHaveBeenCalledWith(MOCK_URL, options);
    });

    it("should call scraper.scrape with containerSelector from the first listSelector", async () => {
      await useCase.execute(MOCK_URL);

      expect(scraper.scrape).toHaveBeenCalledWith(
        expect.objectContaining({
          url: MOCK_URL,
          rules: MOCK_RULES,
          containerSelector: "ul.product-list",
        }),
      );
    });

    it("should forward method, headers and body from options to scraper.scrape", async () => {
      const options: AnalyzeOptions = {
        method: "POST",
        headers: { Authorization: "Bearer token" },
        body: JSON.stringify({ q: "test" }),
      };

      await useCase.execute(MOCK_URL, options);

      expect(scraper.scrape).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          headers: { Authorization: "Bearer token" },
          body: JSON.stringify({ q: "test" }),
        }),
      );
    });

    it("should persist the analysis with status 'completed'", async () => {
      await useCase.execute(MOCK_URL);

      expect(repository.save).toHaveBeenCalledOnce();
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          url: MOCK_URL,
          status: "completed",
          result: expect.objectContaining({ url: MOCK_URL }),
        }),
      );
    });

    it("should persist a record with a valid UUID as id", async () => {
      await useCase.execute(MOCK_URL);

      const [savedRecord] = (repository.save as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(savedRecord.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should include rawPreview in the result (max 2000 chars)", async () => {
      const result = await useCase.execute(MOCK_URL);

      expect(result.rawPreview).toBeDefined();
      expect(result.rawPreview!.length).toBeLessThanOrEqual(2000);
    });

    it("should handle sampleData that is a plain string and set rawPreview to its slice", async () => {
      const longString = "x".repeat(3000);
      scraper = makeScraper({ scrape: vi.fn().mockResolvedValue(longString) });
      useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);

      const result = await useCase.execute(MOCK_URL);

      expect(result.rawPreview).toBe(longString.slice(0, 2000));
    });
  });

  
  // No listSelectors (no containerSelector)
  

  describe("execute — no listSelectors", () => {
    beforeEach(() => {
      analyzer = makeAnalyzer({
        fetchAndAnalyze: vi.fn().mockResolvedValue({
          ...MOCK_ANALYSIS,
          listSelectors: [],
        }),
      });
      useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);
    });

    it("should call scraper.scrape without containerSelector when listSelectors is empty", async () => {
      await useCase.execute(MOCK_URL);

      expect(scraper.scrape).toHaveBeenCalledWith(
        expect.objectContaining({ url: MOCK_URL, rules: MOCK_RULES }),
      );
      const [callArg] = (scraper.scrape as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArg.containerSelector).toBeUndefined();
    });

    it("should NOT perform the fallback scrape when there is no containerSelector", async () => {
      await useCase.execute(MOCK_URL);

      // Only one scrape call expected because the fallback requires a containerSelector
      expect(scraper.scrape).toHaveBeenCalledOnce();
    });
  });

  
  // Fallback scrape
  

  describe("execute — fallback scrape", () => {
    it("should retry without containerSelector when first scrape returns an empty array", async () => {
      scraper = makeScraper({
        scrape: vi
          .fn()
          .mockResolvedValueOnce([])           // first call: empty → triggers fallback
          .mockResolvedValueOnce(MOCK_SAMPLE_DATA), // second call: has data
      });
      useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);

      const result = await useCase.execute(MOCK_URL);

      expect(scraper.scrape).toHaveBeenCalledTimes(2);
      expect(result.sampleData).toEqual(MOCK_SAMPLE_DATA);
    });

    it("should retry when first scrape returns null/undefined", async () => {
      scraper = makeScraper({
        scrape: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(MOCK_SAMPLE_DATA),
      });
      useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);

      await useCase.execute(MOCK_URL);

      expect(scraper.scrape).toHaveBeenCalledTimes(2);
    });

    it("should call fallback scrape without containerSelector", async () => {
      scraper = makeScraper({
        scrape: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce(MOCK_SAMPLE_DATA),
      });
      useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);

      await useCase.execute(MOCK_URL);

      const secondCallArg = (scraper.scrape as ReturnType<typeof vi.fn>).mock.calls[1][0];
      expect(secondCallArg.containerSelector).toBeUndefined();
    });

    it("should NOT retry when first scrape returns a non-empty array", async () => {
      await useCase.execute(MOCK_URL);

      expect(scraper.scrape).toHaveBeenCalledOnce();
    });
  });

  
  // Error handling
  

  describe("execute — error handling", () => {
    it("should rethrow the error after persisting a 'failed' record", async () => {
      const boom = new Error("Network timeout");
      analyzer = makeAnalyzer({ fetchAndAnalyze: vi.fn().mockRejectedValue(boom) });
      useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);

      await expect(useCase.execute(MOCK_URL)).rejects.toThrow("Network timeout");
    });

    it("should persist a record with status 'failed' on analyzer error", async () => {
      analyzer = makeAnalyzer({
        fetchAndAnalyze: vi.fn().mockRejectedValue(new Error("DOM error")),
      });
      useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);

      await expect(useCase.execute(MOCK_URL)).rejects.toThrow();

      expect(repository.save).toHaveBeenCalledOnce();
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          url: MOCK_URL,
          status: "failed",
          errorMessage: "DOM error",
        }),
      );
    });

    it("should persist a record with status 'failed' on scraper error", async () => {
      scraper = makeScraper({ scrape: vi.fn().mockRejectedValue(new Error("Scrape failed")) });
      useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);

      await expect(useCase.execute(MOCK_URL)).rejects.toThrow("Scrape failed");

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: "failed", errorMessage: "Scrape failed" }),
      );
    });

    it("should include the error message in the persisted result object", async () => {
      const errorMsg = "Connection refused";
      analyzer = makeAnalyzer({
        fetchAndAnalyze: vi.fn().mockRejectedValue(new Error(errorMsg)),
      });
      useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);

      await expect(useCase.execute(MOCK_URL)).rejects.toThrow();

      const [savedRecord] = (repository.save as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(savedRecord.result).toEqual({ error: errorMsg });
    });

    it("should still persist a UUID in the failed record", async () => {
      analyzer = makeAnalyzer({
        fetchAndAnalyze: vi.fn().mockRejectedValue(new Error("Oops")),
      });
      useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);

      await expect(useCase.execute(MOCK_URL)).rejects.toThrow();

      const [savedRecord] = (repository.save as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(savedRecord.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should preserve the options in the failed record", async () => {
      const options: AnalyzeOptions = { useJavaScript: true };
      analyzer = makeAnalyzer({
        fetchAndAnalyze: vi.fn().mockRejectedValue(new Error("Oops")),
      });
      useCase = new AnalyzeScrapingUseCase(scraper, analyzer, repository);

      await expect(useCase.execute(MOCK_URL, options)).rejects.toThrow();

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ options }),
      );
    });
  });
});