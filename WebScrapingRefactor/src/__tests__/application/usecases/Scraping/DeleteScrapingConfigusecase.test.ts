import { describe, it, expect, vi } from 'vitest';
import { DeleteScrapingConfigUseCase } from '../../../../application/usecases/Scraping/DeleteScrapingConfigUseCase';

describe('DeleteScrapingConfigUseCase', () => {
  const mockRepo = { delete: vi.fn() };
  const useCase = new DeleteScrapingConfigUseCase(mockRepo as any);

  it('dovrebbe chiamare il repository con l\'id corretto', async () => {
    await useCase.execute('config-id');
    expect(mockRepo.delete).toHaveBeenCalledWith('config-id');
  });

  it('dovrebbe lanciare errore se l\'id non è fornito', async () => {
    await expect(useCase.execute('')).rejects.toThrow();
  });
});