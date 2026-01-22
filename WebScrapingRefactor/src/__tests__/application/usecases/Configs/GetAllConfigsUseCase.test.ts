import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAllConfigsUseCase } from '../../../../application/usecases/Configs/GetAllConfigsUseCase';
import { IConfigRepository } from '../../../../domain/ports/IConfigRepository';
import { ApiConfig } from '../../../../domain/entities/ApiConfig';

describe('GetAllConfigsUseCase', () => {
  let mockConfigRepo: any;
  let useCase: GetAllConfigsUseCase;

  beforeEach(() => {
    mockConfigRepo = {
      findAll: vi.fn(),
      findByName: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    } as unknown as IConfigRepository;

    useCase = new GetAllConfigsUseCase(mockConfigRepo);
  });

  describe('execute() - Scenario ideale??', () => {
    it('dovrebbe ritornare array vuoto quando non ci sono config', async () => {
      mockConfigRepo.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(mockConfigRepo.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('dovrebbe ritornare array di configurazioni', async () => {
      const mockConfigs: ApiConfig[] = [
        {
          name: 'api1',
          baseUrl: 'https://api1.com',
          endpoint: '/data',
          method: 'GET',
        },
        {
          name: 'api2',
          baseUrl: 'https://api2.com',
          endpoint: '/users',
          method: 'POST',
        },
      ];
      mockConfigRepo.findAll.mockResolvedValue(mockConfigs);

      const result = await useCase.execute();

      expect(result).toEqual(mockConfigs);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('api1');
      expect(result[1].name).toBe('api2');
    });

    it('dovrebbe ritornare configurazioni con tutti i campi opzionali', async () => {
      const mockConfigs: ApiConfig[] = [
        {
          name: 'complete',
          baseUrl: 'https://api.com',
          endpoint: '/v1/data',
          method: 'GET',
          defaultLimit: 20,
          supportsPagination: true,
          paginationField: 'page',
          dataPath: 'results.items',
          body: { key: 'value' },
          filter: { field: 'status', value: 'active' },
          selectedFields: ['id', 'name', 'email'],
        },
      ];
      mockConfigRepo.findAll.mockResolvedValue(mockConfigs);

      const result = await useCase.execute();

      expect(result[0].defaultLimit).toBe(20);
      expect(result[0].selectedFields).toHaveLength(3);
    });
  });

  describe('execute() - Error Handling', () => {
    it('dovrebbe propagare errore da repository', async () => {
      const error = new Error('Database connection failed');
      mockConfigRepo.findAll.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow('Database connection failed');
    });

    it('dovrebbe gestire errore di tipo generico', async () => {
      mockConfigRepo.findAll.mockRejectedValue(new Error('Unknown error'));

      await expect(useCase.execute()).rejects.toThrow();
    });
  });
});