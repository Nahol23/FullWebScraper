import { describe, it, expect, vi } from 'vitest';
import { UpdateScrapingConfigUseCase } from '../../../../application/usecases/Scraping/UpdateScrapingConfigUseCase';
import { ConfigNotFoundError } from "../../../../domain/errors/AppError";

describe('UpdateScrapingConfigUseCase', () => {
  const mockRepo = { getById: vi.fn(), update: vi.fn() };
  const useCase = new UpdateScrapingConfigUseCase(mockRepo as any);

  it('dovrebbe aggiornare solo i campi forniti', async () => {
    const existing = { id: '1', name: 'Old', url: 'https://old.com', rules: [{ fieldName: 'f', selector: 's' }] };
    mockRepo.getById.mockResolvedValue(existing);

    await useCase.execute('1', { name: 'New Name' });

    expect(mockRepo.update).toHaveBeenCalledWith('1', expect.objectContaining({
      name: 'New Name',
      url: 'https://old.com'
    }));
  });

  it('dovrebbe fallire se la config da aggiornare non esiste', async () => {
    mockRepo.getById.mockResolvedValue(null);
    await expect(useCase.execute('999', {})).rejects.toThrow(ConfigNotFoundError);
  });
});