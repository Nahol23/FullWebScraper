import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateScrapingConfigUseCase } from "../../../../application/usecases/scraping/UpdateScrapingConfigUseCase";

describe("UpdateScrapingConfigUseCase", () => {
  const mockRepo = {
    getById: vi.fn(),
    update: vi.fn(),
  };

  let useCase: UpdateScrapingConfigUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new UpdateScrapingConfigUseCase(mockRepo as any);
  });

  it("dovrebbe aggiornare correttamente i campi effettuando il merge", async () => {
    const existing = {
      id: "1",
      name: "Old",
      url: "https://old.com",
      rules: [{ fieldName: "f", selector: "s" }],
    };
    mockRepo.getById.mockResolvedValue(existing);

    const updates = { name: "New Name" };

    // Passiamo entrambi gli argomenti: id e updates
    const result = await useCase.execute("1", updates);

    // Verifichiamo che il repo riceva il MERGE dei dati (existing + updates)
    expect(mockRepo.update).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        id: "1",
        name: "New Name",
        url: "https://old.com",
      }),
    );
    expect(result.name).toBe("New Name");
  });

  it("dovrebbe lanciare errore se la configurazione non esiste", async () => {
    mockRepo.getById.mockResolvedValue(null);

    // FIX: Passiamo un oggetto vuoto {} come secondo argomento per evitare l'errore TS2554
    await expect(useCase.execute("non-existent", {})).rejects.toThrow();
  });
}); // <--- Assicurati che questa graffa chiuda il describe
