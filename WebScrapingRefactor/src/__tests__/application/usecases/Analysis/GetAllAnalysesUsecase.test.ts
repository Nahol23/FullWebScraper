import { describe, it, expect, vi } from "vitest";
import { GetAllAnalysesUseCase } from "../../../../application/usecases/Analysis/GetAllAnalysisUseCase";

describe("GetAllAnalysesUseCase", () => {
  const mockAnalysisRepo = {
    findAll: vi.fn(),
  };

  it("dovrebbe restituire le analisi ordinate dalla più recente alla più vecchia", async () => {
    const dateOld = new Date("2023-01-01").toISOString();
    const dateNew = new Date("2023-12-31").toISOString();

    const mockData = [
      { id: "1", createdAt: dateOld },
      { id: "2", createdAt: dateNew },
    ];

    mockAnalysisRepo.findAll.mockResolvedValue(mockData);
    const useCase = new GetAllAnalysesUseCase(mockAnalysisRepo as any);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    // Il primo elemento deve essere quello con la data più recente
    expect(result[0].id).toBe("2");
    expect(result[1].id).toBe("1");
  });

  it("dovrebbe restituire un array vuoto se non ci sono analisi", async () => {
    mockAnalysisRepo.findAll.mockResolvedValue([]);
    const useCase = new GetAllAnalysesUseCase(mockAnalysisRepo as any);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
