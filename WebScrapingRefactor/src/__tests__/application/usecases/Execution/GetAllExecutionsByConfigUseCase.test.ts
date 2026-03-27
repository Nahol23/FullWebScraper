import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetAllExecutionsByConfigUseCase } from "../../../../application/usecases/Execution/GetAllExecutionByConfigUseCase";

describe("GetAllExecutionsByConfigUseCase", () => {
  const mockExecutionRepo = { findByConfigId: vi.fn() };
  let useCase: GetAllExecutionsByConfigUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetAllExecutionsByConfigUseCase(mockExecutionRepo as any);
  });

  it("dovrebbe restituire le esecuzioni di una config ordinate per data decrescente", async () => {
    const configId = "config-123";
    const mockData = [
      { id: "exec-1", timestamp: new Date("2023-01-01"), configId },
      { id: "exec-2", timestamp: new Date("2023-05-01"), configId },
      { id: "exec-3", timestamp: new Date("2023-03-01"), configId },
    ];

    mockExecutionRepo.findByConfigId.mockResolvedValue(mockData);

    const result = await useCase.execute(configId);

    expect(mockExecutionRepo.findByConfigId).toHaveBeenCalledWith(configId);
    expect(result).toHaveLength(3);
    // Verifica ordinamento: 05-01 (exec-2) deve essere il primo
    expect(result[0].id).toBe("exec-2");
    expect(result[1].id).toBe("exec-3");
    expect(result[2].id).toBe("exec-1");
  });

  it("dovrebbe restituire un array vuoto se non ci sono esecuzioni per la config", async () => {
    mockExecutionRepo.findByConfigId.mockResolvedValue([]);
    const result = await useCase.execute("none");
    expect(result).toEqual([]);
  });
});
