import { describe, it, expect, vi, beforeEach } from "vitest";
import { DownloadAllUseCase } from "../../../../application/usecases/Api/DownloadAllUseCase";
import * as fs from "fs";

vi.mock("fs"); // Mock totale del modulo fs

describe("DownloadAllUseCase", () => {
  const mockConfigRepo = { findByName: vi.fn() };
  const mockExecuteUseCase = { execute: vi.fn() };
  const mockFormatService = {
    getMarkdownHeader: vi.fn().mockReturnValue("Header"),
    toMarkdown: vi.fn().mockReturnValue("Row"),
    formatValue: vi.fn(),
  };

  let useCase: DownloadAllUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new DownloadAllUseCase(
      mockConfigRepo as any,
      mockExecuteUseCase as any,
      mockFormatService as any,
    );
  });

  it("dovrebbe gestire il ciclo di paginazione fino a esaurimento dati", async () => {
    mockConfigRepo.findByName.mockResolvedValue({
      name: "Test",
      pagination: { defaultLimit: 10 },
    });

    // Mock due pagine di dati, poi una vuota
    mockExecuteUseCase.execute
      .mockResolvedValueOnce({
        data: new Array(10).fill({}),
        meta: { total: 20 },
      })
      .mockResolvedValueOnce({
        data: new Array(5).fill({}),
        meta: { total: 20 },
      });

    await useCase.execute("Test", "json");

    // Deve aver chiamato execute 2 volte (perché 5 < 10 interrompe il loop)
    expect(mockExecuteUseCase.execute).toHaveBeenCalledTimes(2);
    expect(fs.appendFileSync).toHaveBeenCalled();
  });

  it("dovrebbe creare l'header markdown solo al primo batch", async () => {
    mockConfigRepo.findByName.mockResolvedValue({
      name: "Test",
      pagination: null,
    });
    mockExecuteUseCase.execute.mockResolvedValue({
      data: [{ id: 1 }],
      meta: { total: 1 },
    });

    await useCase.execute("Test", "markdown");

    expect(mockFormatService.getMarkdownHeader).toHaveBeenCalledTimes(1);
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("# Report: Test"),
    );
  });
});
