import { describe, it, expect, vi, beforeEach } from "vitest";
import { SaveConfigUseCase } from "../../../../application/usecases/Configs/SaveConfigUseCase";

describe("SaveConfigUseCase", () => {
  const mockRepo = { save: vi.fn() };
  let useCase: SaveConfigUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new SaveConfigUseCase(mockRepo as any);
  });

  it("dovrebbe salvare la configurazione se il nome è presente", async () => {
    const config = { name: "My API", endpoint: "/test" } as any;
    await useCase.execute(config);
    expect(mockRepo.save).toHaveBeenCalledWith(config);
  });

  it("dovrebbe lanciare un errore se il nome è mancante", async () => {
    const config = { endpoint: "/test" } as any;
    await expect(useCase.execute(config)).rejects.toThrow("Nome obbligatorio");
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
