import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateConfigUseCase } from "../../../../application/usecases/Configs/UpdateConfigUseCase";

describe("UpdateConfigUseCase", () => {
  const mockRepo = { findById: vi.fn(), update: vi.fn() };
  let useCase: UpdateConfigUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new UpdateConfigUseCase(mockRepo as any);
  });

  it("dovrebbe aggiornare correttamente la configurazione esistente", async () => {
    const existing = { id: "1", name: "Old", endpoint: "/v1" };
    mockRepo.findById.mockResolvedValue(existing);

    await useCase.execute("1", { name: "New Name" });

    expect(mockRepo.update).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        id: "1",
        name: "New Name",
        endpoint: "/v1",
      }),
    );
  });

  it("dovrebbe fallire se la configurazione non esiste", async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute("999", {})).rejects.toThrow(/non trovata/);
  });
});
