import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FetchConfigsUseCase} from '../application/usecases/FetchConfigsUseCase';
import type { ConfigRepository } from '../domain/ports/ConfigRepository';
import type { ApiConfig } from '../types/ApiConfig';

describe('FetchConfigsUseCase', () => {
  let useCase: FetchConfigsUseCase;
  let mockRepo: ConfigRepository;

  const mockConfigs: ApiConfig[] = [
    { name: 'Login API', method: 'POST' },
    { name: 'Get Users', method: 'GET' },
    { name: 'Update Profile', method: 'POST' },
  ] as ApiConfig[];

  beforeEach(() => {
  mockRepo = {
    getAll: vi.fn().mockResolvedValue(mockConfigs),
  } as unknown as ConfigRepository; 
  
  useCase = new FetchConfigsUseCase(mockRepo);
});

  it('dovrebbe restituire tutti i config ordinati alfabeticamente per nome', async () => {
    const result = await useCase.execute();
    
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Get Users'); 
    expect(result[2].name).toBe('Update Profile');
  });

  it('dovrebbe filtrare per nome in modo case-insensitive', async () => {
    const result = await useCase.execute({ search: 'LOGIN' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Login API');
  });

  it('dovrebbe filtrare correttamente per metodo HTTP', async () => {
    const result = await useCase.execute({ method: 'POST' });
    expect(result.every(c => c.method === 'POST')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('dovrebbe ignorare il filtro metodo se impostato su "ALL"', async () => {
    const result = await useCase.execute({ method: 'ALL' });
    expect(result).toHaveLength(3);
  });

  it('dovrebbe gestire una lista vuota dal repository senza crashare', async () => {
    mockRepo.getAll = vi.fn().mockResolvedValue([]);
    const result = await useCase.execute({ search: 'any' });
    expect(result).toEqual([]);
  });

  it('dovrebbe essere resiliente a spazi bianchi extra nel termine di ricerca', async () => {
    const result = await useCase.execute({ search: '  login  ' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Login API');
  });

  it('dovrebbe gestire correttamente caratteri speciali nella ricerca', async () => {
    const result = await useCase.execute({ search: '!!!' });
    expect(result).toEqual([]);
  });

  it('dovrebbe propagare l’errore se il repository fallisce', async () => {
    mockRepo.getAll = vi.fn().mockRejectedValue(new Error('DB_ERROR'));
    await expect(useCase.execute()).rejects.toThrow('DB_ERROR');
  });
});