import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FetchScrapingLogsUseCase } from '../../../../application/usecases/scraping/FetchScrapingLogsUseCase';

describe('FetchScrapingLogsUseCase', () => {
  const mockRepo = {
    getLogsByConfig: vi.fn(),
  };

  let useCase: FetchScrapingLogsUseCase;

  beforeEach(() => {
    useCase = new FetchScrapingLogsUseCase(mockRepo as any);
  });

  it('dovrebbe chiamare il repository con il configId e il limite corretto', async () => {
    const mockLogs = [{ id: 'exec1', status: 'completed' }];
    mockRepo.getLogsByConfig.mockResolvedValue(mockLogs);

    const result = await useCase.execute('config-123', 10);

    expect(mockRepo.getLogsByConfig).toHaveBeenCalledWith('config-123', 10);
    expect(result).toEqual(mockLogs);
  });
});