import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExecuteApiUseCase } from "../../../../application/usecases/Api/ExecuteApiUseCase";

describe("ExecuteApiUseCase", () => {
  const mockConfigRepo = { findById: vi.fn(), findByName: vi.fn() };
  const mockExecutionRepo = { save: vi.fn() };
  const mockApiPort = { request: vi.fn() };
  let useCase: ExecuteApiUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ExecuteApiUseCase(
      mockConfigRepo as any,
      mockExecutionRepo as any,
      mockApiPort as any,
    );
  });

  it("dovrebbe cercare per nome se la ricerca per ID fallisce", async () => {
    mockConfigRepo.findById.mockResolvedValue(null);

    mockConfigRepo.findByName.mockResolvedValue({
      id: "123",
      name: "test-config",
      baseUrl: "https://api.test.com",
      endpoint: "/data",
      method: "GET",
    });

    mockApiPort.request.mockResolvedValue({ results: [] });

    await useCase.execute("test-config");

    expect(mockConfigRepo.findByName).toHaveBeenCalledWith("test-config");
  });

  it("dovrebbe applicare il limite di sicurezza (limitSafety) ai dati restituiti", async () => {
    const config = {
      id: "1",
      baseUrl: "https://api.test.com",
      endpoint: "/items",
      method: "GET",
      pagination: { defaultLimit: 2 },
    };
    mockConfigRepo.findById.mockResolvedValue(config);

    // Simuliamo che l'API restituisca 3 oggetti
    mockApiPort.request.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    const result = await useCase.execute("1");

    // Il limite della config è 2, quindi il risultato deve averne 2
    expect(result.data).toHaveLength(2);
  });

  it("dovrebbe lanciare errore se la configurazione non esiste", async () => {
    mockConfigRepo.findById.mockResolvedValue(null);
    mockConfigRepo.findByName.mockResolvedValue(null);

    // FIX: Cambiata la ricerca dell'errore in "non trovata" (italiano)
    await expect(useCase.execute("unknown")).rejects.toThrow(/non trovata/i);
  });
});
