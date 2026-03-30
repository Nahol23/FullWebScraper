import { describe, it, expect, vi, beforeEach } from "vitest";
import { ManageConfigUseCase } from "../../../../application/usecases/Configs/ManageConfigUseCase";

describe("ManageConfigUseCase", () => {
  const mockRepo = {
    findAll: vi.fn(),
    findByName: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
  let useCase: ManageConfigUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ManageConfigUseCase(mockRepo as any);
  });

  it("getAllConfigs dovrebbe delegare al repository", async () => {
    mockRepo.findAll.mockResolvedValue([{ name: "C1" }]);
    const res = await useCase.getAllConfigs();
    expect(res).toHaveLength(1);
    expect(mockRepo.findAll).toHaveBeenCalled();
  });

  it("deleteConfig dovrebbe fallire se la config non esiste", async () => {
    mockRepo.findByName.mockResolvedValue(null);
    await expect(useCase.deleteConfig("invalid")).rejects.toThrow(
      "Configurazione non trovata",
    );
  });
});
