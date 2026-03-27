import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResumeScrapingUseCase } from '../../../../application/usecases/Scraping/ResumeScrapingUseCase';

describe('ResumeScrapingUseCase', () => {
  const mockConfigRepo = { getById: vi.fn() };
  const mockExecutionRepo = { findByConfigId: vi.fn() };
  const mockExecuteUseCase = { execute: vi.fn() };
  let useCase: ResumeScrapingUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ResumeScrapingUseCase(mockConfigRepo as any, mockExecutionRepo as any, mockExecuteUseCase as any);
  });

  it('dovrebbe restituire alreadyComplete se l\'ultima esecuzione non aveva nextPageUrl', async () => {
    mockExecutionRepo.findByConfigId.mockResolvedValue([{ nextPageUrl: null }]);
    
    const result = await useCase.execute('config-1');
    expect(result.alreadyComplete).toBe(true);
    expect(mockExecuteUseCase.execute).not.toHaveBeenCalled();
  });

  it('dovrebbe estrarre il numero di pagina per paginazione urlParam', async () => {
    mockExecutionRepo.findByConfigId.mockResolvedValue([{ nextPageUrl: 'https://site.com?p=3' }]);
    mockConfigRepo.getById.mockResolvedValue({ pagination: { type: 'urlParam', paramName: 'p' } });

    await useCase.execute('config-1');

    expect(mockExecuteUseCase.execute).toHaveBeenCalledWith('config-1', expect.objectContaining({
      startPage: 3
    }));
  });

  it('dovrebbe usare resumeFromUrl per paginazioni basate su selettore (nextSelector)', async () => {
    const resumeUrl = 'https://site.com/page/2';
    mockExecutionRepo.findByConfigId.mockResolvedValue([{ nextPageUrl: resumeUrl }]);
    mockConfigRepo.getById.mockResolvedValue({ pagination: { type: 'nextSelector' } });

    await useCase.execute('config-1');

    expect(mockExecuteUseCase.execute).toHaveBeenCalledWith('config-1', expect.objectContaining({
      resumeFromUrl: resumeUrl
    }));
  });
});