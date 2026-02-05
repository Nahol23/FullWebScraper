/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StartExecutionUseCase } from "../application/usecases/StartExecutionUseCase";
import { ExecutionOverridesVO } from "../domain/value-objects/ExecutionOverrides";
import type { ExecutionRepository } from "../domain/ports/ExecutionRepository";

// Mock del Value Object per testare l'integrazione
vi.mock("../domain/value-objects/ExecutionOverrides", () => ({
  ExecutionOverridesVO: vi.fn().mockImplementation(function (this: any,overrides) {
    this.raw = overrides || {};
  }),
}));

describe("StartExecutionUseCase", () => {
  let useCase: StartExecutionUseCase;
  let mockRepo: ExecutionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      execute: vi.fn().mockResolvedValue({ success: true, data: {} }),
    } as unknown as ExecutionRepository;
    useCase = new StartExecutionUseCase(mockRepo);
  });

  it("dovrebbe istanziare correttamente il Value Object con gli overrides", async () => {
    const overrides = { timeout: 5000 };
    await useCase.execute("test-config", overrides);

    expect(ExecutionOverridesVO).toHaveBeenCalledWith(overrides);
  });

  it("dovrebbe funzionare senza parametri overrides", async () => {
    await useCase.execute("test-config");

    expect(mockRepo.execute).toHaveBeenCalledWith(
      "test-config",
      expect.any(Object),
    );
  });

  it("dovrebbe fallire se il Value Object lancia un errore di validazione", async () => {
    (ExecutionOverridesVO as any).mockImplementationOnce(() => {
      throw new Error("Invalid overrides format");
    });

    await expect(
      useCase.execute("test-config", { invalid: "data" }),
    ).rejects.toThrow("Invalid overrides format");

    expect(mockRepo.execute).not.toHaveBeenCalled();
  });

  it("dovrebbe restituire esattamente la risposta del repository", async () => {
    const mockResponse = { success: true, message: "Started" };
    mockRepo.execute = vi.fn().mockResolvedValue(mockResponse);

    const result = await useCase.execute("test-config");
    expect(result).toEqual(mockResponse);
  });
});
