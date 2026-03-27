import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteConfigUseCase } from "../../../../application/usecases/Configs/DeleteConfigUseCase";

describe("DeleteConfigUseCase", () => {
  const mockRepo = { findById: vi.fn(), findByName: vi.fn(), delete: vi.fn() };
  let useCase: DeleteConfigUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new DeleteConfigUseCase(mockRepo as any);
  });

  it("dovrebbe eliminare usando l'ID se trovato direttamente", async () => {
    mockRepo.findById.mockResolvedValue({ id: "id-123" });

    await useCase.execute("id-123");

    expect(mockRepo.delete).toHaveBeenCalledWith("id-123");
  });

  it("dovrebbe cercare per nome se non trova l'ID e poi eliminare", async () => {
    mockRepo.findById.mockResolvedValue(null);
    mockRepo.findByName.mockResolvedValue({
      id: "id-456",
      name: "config-test",
    });

    await useCase.execute("config-test");

    expect(mockRepo.findByName).toHaveBeenCalledWith("config-test");
    expect(mockRepo.delete).toHaveBeenCalledWith("id-456");
  });
});
