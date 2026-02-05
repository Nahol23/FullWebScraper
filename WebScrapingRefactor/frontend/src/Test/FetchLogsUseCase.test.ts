import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FetchLogsUseCase } from '../application/usecases/FetchLogsUseCase';
import type { ExecutionRepository } from '../domain/ports/ExecutionRepository';
import type { Execution } from '../types/Execution';

describe('FetchLogsUseCase', () => {
  let useCase: FetchLogsUseCase;
  let mockRepo: ExecutionRepository;

  const mockLogs: Partial<Execution>[] = [
    { id: '1', timestamp: '2023-01-01T10:00:00Z' },
    { id: '2', timestamp: '2023-01-01T12:00:00Z' },
    { id: '3', timestamp: '2023-01-01T11:00:00Z' },
  ];

  beforeEach(() => {
    mockRepo = {
      getLogs: vi.fn().mockResolvedValue([...mockLogs]),
    } as unknown as ExecutionRepository;
    useCase = new FetchLogsUseCase(mockRepo);
  });

  it('dovrebbe ordinare i log dal più recente al più vecchio', async () => {
    const result = await useCase.execute();
    
    expect(result[0].id).toBe('2'); 
    expect(result[1].id).toBe('3'); 
    expect(result[2].id).toBe('1'); 
  });

  it('dovrebbe limitare i risultati alla pageSize specificata', async () => {
    const result = await useCase.execute(2);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(['2', '3']);
  });

  it('dovrebbe gestire date malformate senza crashare (o definire il comportamento)', async () => {
    mockRepo.getLogs = vi.fn().mockResolvedValue([
      { id: 'error', timestamp: 'data-invalida' },
      { id: 'valid', timestamp: '2023-01-01T10:00:00Z' }
    ]);

    const result = await useCase.execute();
    expect(result).toBeDefined();
  });

  it('dovrebbe gestire una pageSize superiore al numero di log esistenti', async () => {
    const result = await useCase.execute(100);
    expect(result).toHaveLength(3);
  });

  it('dovrebbe restituire array vuoto se pageSize è 0', async () => {
    const result = await useCase.execute(0);
    expect(result).toHaveLength(0);
  });
});