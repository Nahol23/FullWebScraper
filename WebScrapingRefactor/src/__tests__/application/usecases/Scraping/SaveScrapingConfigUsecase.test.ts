import { describe, it, expect, vi } from 'vitest';
import { SaveScrapingConfigUseCase } from '../../../../application/usecases/Scraping/SaveScrapingConfigUseCase';
import { ValidationError } from "../../../../domain/errors/AppError";

describe('SaveScrapingConfigUseCase', () => {
  const mockRepo = { save: vi.fn(c => c) };
  const useCase = new SaveScrapingConfigUseCase(mockRepo as any);

  it('dovrebbe lanciare ValidationError se il nome è vuoto', async () => {
    const config = { name: '', url: 'https://ok.com', rules: [] };
    await expect(useCase.execute(config as any)).rejects.toThrow(ValidationError);
  });

  it('dovrebbe lanciare ValidationError se l\'URL è invalido', async () => {
    const config = { name: 'Test', url: 'not-a-url', rules: [] };
    await expect(useCase.execute(config as any)).rejects.toThrow('Invalid URL format');
  });

  it('dovrebbe lanciare ValidationError se mancano le regole', async () => {
    const config = { name: 'Test', url: 'https://ok.com', rules: [] };
    await expect(useCase.execute(config as any)).rejects.toThrow('At least one extraction rule is required');
  });

  it('dovrebbe generare un ID e salvare se la config è valida', async () => {
    const validConfig = { 
      name: 'Valid', 
      url: 'https://example.com', 
      rules: [{ fieldName: 'f', selector: '.s' }] 
    };
    const result = await useCase.execute(validConfig as any);
    expect(result.id).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalled();
  });
});