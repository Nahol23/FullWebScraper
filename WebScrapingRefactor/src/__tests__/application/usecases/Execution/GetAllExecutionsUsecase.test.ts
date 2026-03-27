import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetAllExecutionsUseCase } from "../../../../application/usecases/Execution/GetAllExecutionsUseCase";

describe("GetAllExecutionsUseCase", () => {
  const mockExecutionRepo = { findAll: vi.fn() };
  let useCase: GetAllExecutionsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetAllExecutionsUseCase(mockExecutionRepo as any);
  });

  it("dovrebbe restituire tutte le esecuzioni ordinate dalla più recente", async () => {
    const mockData = [
      { id: "a", timestamp: "2024-01-01T10:00:00Z" },
      { id: "b", timestamp: "2024-01-02T10:00:00Z" },
    ];

    mockExecutionRepo.findAll.mockResolvedValue(mockData);

    const result = await useCase.execute();

    expect(result[0].id).toBe("b");
    expect(result[1].id).toBe("a");
  });
});
