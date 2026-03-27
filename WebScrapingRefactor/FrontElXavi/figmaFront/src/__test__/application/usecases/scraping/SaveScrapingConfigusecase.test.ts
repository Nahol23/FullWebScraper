import { describe, it, expect, vi, beforeEach } from "vitest";
import { SaveScrapingConfigUseCase } from "../../../../application/usecases/scraping/SaveScrapingConfigUseCase";
import { ValidationError } from "../../../../domain/errors/AppError";

describe("SaveScrapingConfigUseCase", () => {
  const mockRepo = {
    save: vi.fn(),
  };

  let useCase: SaveScrapingConfigUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new SaveScrapingConfigUseCase(mockRepo as any);
  });

  it("dovrebbe salvare correttamente una configurazione valida", async () => {
    const validConfig = {
      name: "Test Scraper",
      url: "https://example.com",
      rules: [{ fieldName: "title", selector: "h1" }],
    };

    // Il repository restituisce un oggetto con ID generato
    mockRepo.save.mockResolvedValue({
      id: "123",
      ...validConfig,
    });

    const result = await useCase.execute(validConfig);

    // Il repo deve ricevere un oggetto che CONTIENE i campi originali
    // più un id generato dal use case
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Scraper",
        url: "https://example.com",
        rules: validConfig.rules,
      }),
    );

    // Il risultato finale deve contenere l'id mockato
    expect(result.id).toBe("123");
  });

  it("dovrebbe lanciare ValidationError se l'URL non è valido", async () => {
    const invalidConfig = {
      name: "Invalid",
      url: "not-a-url",
      rules: [{ fieldName: "title", selector: "h1" }],
    };

    await expect(useCase.execute(invalidConfig)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});
