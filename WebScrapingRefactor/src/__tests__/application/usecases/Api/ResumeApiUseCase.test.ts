import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResumeApiUseCase } from "../../../../application/usecases/Api/ResumeApiUseCase";

describe("ResumeApiUseCase", () => {
  const mockConfigRepo = { findById: vi.fn() };
  const mockExecutionRepo = { findByConfigId: vi.fn() };
  const mockExecuteUseCase = { execute: vi.fn() };
  let useCase: ResumeApiUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ResumeApiUseCase(
      mockConfigRepo as any,
      mockExecutionRepo as any,
      mockExecuteUseCase as any,
    );
  });

  it("dovrebbe lanciare errore se non ci sono esecuzioni precedenti", async () => {
    mockExecutionRepo.findByConfigId.mockResolvedValue([]);
    await expect(useCase.execute("1")).rejects.toThrow(
      /Nessuna execution trovata/,
    );
  });

  it("dovrebbe restituire alreadyComplete se nextPageUrl dell'ultima esecuzione è null", async () => {
    mockExecutionRepo.findByConfigId.mockResolvedValue([
      {
        nextPageUrl: null,
        timestamp: new Date(),
      },
    ]);

    const result = await useCase.execute("1");
    expect(result.alreadyComplete).toBe(true);
  });

  it("dovrebbe estrarre il numero di pagina corretto dall'URL di resume", async () => {
    const lastExecution = {
      nextPageUrl: "https://api.com?page=5",
      timestamp: new Date(),
    };
    mockExecutionRepo.findByConfigId.mockResolvedValue([lastExecution]);
    mockConfigRepo.findById.mockResolvedValue({
      pagination: { paramName: "page" },
    });
    mockExecuteUseCase.execute.mockResolvedValue({ data: [] });

    await useCase.execute("1");

    expect(mockExecuteUseCase.execute).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        startPage: 5,
      }),
    );
  });
});
