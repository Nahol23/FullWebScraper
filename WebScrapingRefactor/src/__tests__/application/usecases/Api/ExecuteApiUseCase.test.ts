import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExecuteApiUseCase } from "../../../../application/usecases/Api/ExecuteApiUseCase";
import {
  getNestedData,
  findFirstArrayPath,
} from "../../../../infrastructure/utils/ObjectUtils";
vi.mock("../../../../infrastructure/utils/ObjectUtils", async () => {
  const actual = await vi.importActual("../../../../infrastructure/utils/ObjectUtils");
  return { 
    ...actual, 
    getNestedData: vi.fn(), 
    findFirstArrayPath: vi.fn() 
  };
});

describe("ExecuteApiUseCase", () => {
  let configRepo: any;
  let apiPort: any;
  let useCase: ExecuteApiUseCase;

  beforeEach(() => {
    configRepo = {
      findByName: vi.fn(),
    };

    apiPort = {
      request: vi.fn(),
    };

    useCase = new ExecuteApiUseCase(configRepo, apiPort);

    vi.clearAllMocks();
  });

  it("lancia errore se la configurazione non esiste", async () => {
    configRepo.findByName.mockResolvedValue(null);

    await expect(useCase.execute("missing")).rejects.toThrow(
      "Configurazione non trovata",
    );
  });

  it("chiama l'API con i parametri corretti", async () => {
    const config = {
      baseUrl: "https://api.test.com",
      endpoint: "/users",
      method: "POST",
      body: { x: 1 },
      dataPath: "data.items",
    };

    configRepo.findByName.mockResolvedValue(config);
    apiPort.request.mockResolvedValue({});

    (getNestedData as any).mockReturnValue([]);

    await useCase.execute("test");

    expect(apiPort.request).toHaveBeenCalledWith({
      url: "https://api.test.com/users",
      method: "POST",
      body: { x: 1 },
    });
  });

  it("usa il primo array trovato se dataPath non è definito e getNestedData ritorna vuoto", async () => {
    const config = {
      baseUrl: "",
      endpoint: "",
      method: "GET",
      body: null,
      dataPath: undefined,
    };

    configRepo.findByName.mockResolvedValue(config);

    apiPort.request.mockResolvedValue({
      deep: { nested: { arr: [1, 2, 3] } },
    });

    (getNestedData as any)
      .mockReturnValueOnce([]) // primo tentativo
      .mockReturnValueOnce([1, 2, 3]); // dopo findFirstArrayPath

    (findFirstArrayPath as any).mockReturnValue("deep.nested.arr");

    const result = await useCase.execute("test");

    expect(findFirstArrayPath).toHaveBeenCalled();
    expect(result.data).toEqual([1, 2, 3]);
  });

  it("usa direttamente responseData se non trova nessun array", async () => {
    const config = {
      baseUrl: "",
      endpoint: "",
      method: "GET",
      body: null,
      dataPath: undefined,
    };

    configRepo.findByName.mockResolvedValue(config);

    apiPort.request.mockResolvedValue([10, 20, 30]);

    (getNestedData as any).mockReturnValue([]);
    (findFirstArrayPath as any).mockReturnValue(null);

    const result = await useCase.execute("test");

    expect(result.data).toEqual([10, 20, 30]);
  });

  it("applica correttamente il filtro", async () => {
    const config = {
      baseUrl: "",
      endpoint: "",
      method: "GET",
      body: null,
      dataPath: "items",
      filter: { field: "role", value: "admin" },
    };

    configRepo.findByName.mockResolvedValue(config);

    apiPort.request.mockResolvedValue({});
    (getNestedData as any).mockReturnValue([
      { id: 1, role: "admin" },
      { id: 2, role: "user" },
    ]);

    const result = await useCase.execute("test");

    expect(result.data).toEqual([{ id: 1, role: "admin" }]);
  });

  it("gestisce filtri con nested path", async () => {
    const config = {
      baseUrl: "",
      endpoint: "",
      method: "GET",
      body: null,
      dataPath: "items",
      filter: { field: "meta.type", value: "A" },
    };

    configRepo.findByName.mockResolvedValue(config);

    apiPort.request.mockResolvedValue({});
    (getNestedData as any).mockReturnValue([
      { id: 1, meta: { type: "A" } },
      { id: 2, meta: { type: "B" } },
    ]);

    const result = await useCase.execute("test");

    expect(result.data).toEqual([{ id: 1, meta: { type: "A" } }]);
  });

  it("applica correttamente la paginazione", async () => {
    const config = {
      baseUrl: "",
      endpoint: "",
      method: "GET",
      body: null,
      dataPath: "items",
    };

    configRepo.findByName.mockResolvedValue(config);

    apiPort.request.mockResolvedValue({});
    (getNestedData as any).mockReturnValue([1, 2, 3, 4, 5]);

    const result = await useCase.execute("test", { page: 2, limit: 2 });

    expect(result.data).toEqual([3, 4]);
    expect(result.meta!.hasNext).toBe(true);
  });

  it("applica selectedFields anche con nested path", async () => {
    const config = {
      baseUrl: "",
      endpoint: "",
      method: "GET",
      body: null,
      dataPath: "items",
      selectedFields: ["id", "meta.value"],
    };

    configRepo.findByName.mockResolvedValue(config);

    apiPort.request.mockResolvedValue({});
    (getNestedData as any).mockReturnValue([
      { id: 1, meta: { value: 10 } },
      { id: 2, meta: { value: 20 } },
    ]);

    const result = await useCase.execute("test");

    expect(result.data).toEqual([
      { id: 1, "meta.value": 10 },
      { id: 2, "meta.value": 20 },
    ]);
  });

  it("gestisce selectedFields mancanti senza crashare", async () => {
    const config = {
      baseUrl: "",
      endpoint: "",
      method: "GET",
      body: null,
      dataPath: "items",
      selectedFields: ["id", "missing.path"],
    };

    configRepo.findByName.mockResolvedValue(config);

    apiPort.request.mockResolvedValue({});
    (getNestedData as any).mockReturnValue([{ id: 1 }]);

    const result = await useCase.execute("test");

    expect(result.data).toEqual([{ id: 1, "missing.path": undefined }]);
  });
});
