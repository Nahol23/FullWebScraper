import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecuteScrapingUseCase } from '../../../../application/usecases/Scraping/ExecuteScrapingUseCase';
import { ConfigNotFoundError } from "../../../../domain/errors/AppError";

describe('ExecuteScrapingUseCase', () => {
  const mockConfigRepo = { getById: vi.fn() };
  const mockExecutionRepo = { save: vi.fn() };
  const mockScraper = { scrape: vi.fn() };
  let useCase: ExecuteScrapingUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ExecuteScrapingUseCase(mockConfigRepo as any, mockExecutionRepo as any, mockScraper as any);
  });

  it('dovrebbe lanciare ConfigNotFoundError se la configurazione non esiste', async () => {
    mockConfigRepo.getById.mockResolvedValue(null);
    await expect(useCase.execute('id-123')).rejects.toThrow(ConfigNotFoundError);
  });

  it('dovrebbe sovrascrivere i parametri della config con quelli di runtime (es. maxPages)', async () => {
    const config = { id: '1', url: 'http://test.it', rules: [], pagination: { type: 'urlParam', maxPages: 2 } };
    mockConfigRepo.getById.mockResolvedValue(config);
    mockScraper.scrape.mockResolvedValue({ items: [], pagesScraped: 1, nextPageUrl: null });

    await useCase.execute('1', { maxPages: 10 });

    // Verifica che allo scraper sia arrivato maxPages: 10
    expect(mockScraper.scrape).toHaveBeenCalledWith(expect.objectContaining({
      pagination: expect.objectContaining({ maxPages: 10 })
    }));
  });

  it('dovrebbe salvare l\'esecuzione come "success" dopo lo scraping', async () => {
    mockConfigRepo.getById.mockResolvedValue({ id: '1', url: 'http://ok.it', rules: [] });
    mockScraper.scrape.mockResolvedValue({ items: [{ id: 1 }], pagesScraped: 1, nextPageUrl: null });

    await useCase.execute('1');
    expect(mockExecutionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
  });
});