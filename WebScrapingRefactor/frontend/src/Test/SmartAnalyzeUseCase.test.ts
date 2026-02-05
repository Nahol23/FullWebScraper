import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartAnalyzeUseCase } from '../application/usecases/SmartAnalyzeUseCase';
import type { AnalyzeRepository } from '../domain/ports/AnalyzeRepository';

describe('SmartAnalyzeUseCase', () => {
  let useCase: SmartAnalyzeUseCase;
  let mockRepo: AnalyzeRepository;

  beforeEach(() => {
    mockRepo = {
      createAnalysis: vi.fn().mockImplementation(async (data) => ({
        ...data,
        id: '123',
        discoveredSchema: { original: 'schema' }
      })),
    } as unknown as AnalyzeRepository;
    
    useCase = new SmartAnalyzeUseCase(mockRepo);
  });

  it('dovrebbe lanciare un errore se l’URL è malformato', async () => {
    const payload = { url: 'ftp://invalid-site.com', method: 'GET' as const };
    
    await expect(useCase.execute(payload)).rejects.toThrow("URL non valido");
  });

  it('dovrebbe pulire l’URL dagli spazi bianchi', async () => {
    const payload = { url: '  https://google.com  ', method: 'GET' as const };
    await useCase.execute(payload);
    
    expect(mockRepo.createAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://google.com' })
    );
  });

  it('dovrebbe arricchire il risultato usando il manualDataPath', async () => {
    const payload = { 
      url: 'https://api.com', 
      method: 'GET' as const, 
      manualDataPath: 'data.items' 
    };

    const result = await useCase.execute(payload);
    
    expect(result).toHaveProperty('discoveredSchema');
  });

  it('dovrebbe funzionare correttamente anche senza body o headers', async () => {
    const payload = { url: 'https://api.com', method: 'GET' as const };
    
    const result = await useCase.execute(payload);
    expect(result.body).toBeUndefined();
    expect(result.headers).toBeUndefined();
  });

  it('non dovrebbe modificare il payload originale (immutabilità)', async () => {
    const payload = { url: 'https://api.com', method: 'GET' as const, body: { a: 1 } };
    const originalBody = { ...payload.body };
    
    await useCase.execute(payload);
    expect(payload.body).toEqual(originalBody);
  });
});