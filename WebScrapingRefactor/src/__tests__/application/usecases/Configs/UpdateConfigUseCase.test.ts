import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateConfigUseCase } from '../../../../application/usecases/Configs/UpdateConfigUseCase';
import { IConfigRepository } from '../../../../domain/ports/IConfigRepository';
import { ApiConfig } from '../../../../domain/entities/ApiConfig';

describe('UpdateConfigUseCase', () => {
  let mockConfigRepo: any;
  let useCase: UpdateConfigUseCase;

  const existingConfig: ApiConfig = {
    name: 'pokeapi',
    baseUrl: 'https://pokeapi.co/api/v2',
    endpoint: '/pokemon',
    method: 'GET',
    defaultLimit: 20,
  };

  beforeEach(() => {
    mockConfigRepo = {
      findAll: vi.fn(),
      findByName: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    } as unknown as IConfigRepository;

    useCase = new UpdateConfigUseCase(mockConfigRepo);
  });

  describe('execute() - Best Scenario', () => {
    it('dovrebbe aggiornare config esistente con partial update', async () => {
      mockConfigRepo.findByName.mockResolvedValue(existingConfig);
      mockConfigRepo.update.mockResolvedValue(undefined);

      const updates = { defaultLimit: 50 };
      await useCase.execute('pokeapi', updates);

      expect(mockConfigRepo.findByName).toHaveBeenCalledWith('pokeapi');
      expect(mockConfigRepo.update).toHaveBeenCalledWith(
        'pokeapi',
        expect.objectContaining({
          name: 'pokeapi',
          baseUrl: 'https://pokeapi.co/api/v2',
          defaultLimit: 50, // aggiornato
        })
      );
    });

    it('dovrebbe aggiornare baseUrl', async () => {
      mockConfigRepo.findByName.mockResolvedValue(existingConfig);
      mockConfigRepo.update.mockResolvedValue(undefined);

      const updates = { baseUrl: 'https://new-api.com' };
      await useCase.execute('pokeapi', updates);

      expect(mockConfigRepo.update).toHaveBeenCalledWith(
        'pokeapi',
        expect.objectContaining({
          baseUrl: 'https://new-api.com',
        })
      );
    });

    it('dovrebbe aggiornare endpoint', async () => {
      mockConfigRepo.findByName.mockResolvedValue(existingConfig);
      mockConfigRepo.update.mockResolvedValue(undefined);

      const updates = { endpoint: '/v1/pokemon' };
      await useCase.execute('pokeapi', updates);

      expect(mockConfigRepo.update).toHaveBeenCalledWith(
        'pokeapi',
        expect.objectContaining({
          endpoint: '/v1/pokemon',
        })
      );
    });

    it('dovrebbe aggiornare method', async () => {
      mockConfigRepo.findByName.mockResolvedValue(existingConfig);
      mockConfigRepo.update.mockResolvedValue(undefined);

      const updates = { method: 'POST' as const };
      await useCase.execute('pokeapi', updates);

      expect(mockConfigRepo.update).toHaveBeenCalledWith(
        'pokeapi',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('dovrebbe fare merge di più campi', async () => {
      mockConfigRepo.findByName.mockResolvedValue(existingConfig);
      mockConfigRepo.update.mockResolvedValue(undefined);

      const updates = {
        defaultLimit: 100,
        dataPath: 'results.items',
        supportsPagination: true,
      };
      await useCase.execute('pokeapi', updates);

      expect(mockConfigRepo.update).toHaveBeenCalledWith(
        'pokeapi',
        expect.objectContaining({
          name: 'pokeapi', // preservato
          defaultLimit: 100,
          dataPath: 'results.items',
          supportsPagination: true,
        })
      );
    });

    it('dovrebbe preservare nome anche se passato negli updates', async () => {
      mockConfigRepo.findByName.mockResolvedValue(existingConfig);
      mockConfigRepo.update.mockResolvedValue(undefined);

      const updates = { defaultLimit: 75, name: 'newname' };
      await useCase.execute('pokeapi', updates);

      // Il use case forza name al nome originale
      expect(mockConfigRepo.update).toHaveBeenCalledWith(
        'pokeapi',
        expect.objectContaining({
          name: 'pokeapi', // ignora aggiornamento
        })
      );
    });
  });

  describe('execute() - Not Found', () => {
    it('dovrebbe lanciare errore quando config non esiste', async () => {
      mockConfigRepo.findByName.mockResolvedValue(null);

      const updates = { defaultLimit: 50 };

      await expect(useCase.execute('nonexistent', updates)).rejects.toThrow(
        `Configurazione 'nonexistent' non trovata`
      );

      expect(mockConfigRepo.update).not.toHaveBeenCalled();
    });

    it('dovrebbe non aggiornare se findByName ritorna null', async () => {
      mockConfigRepo.findByName.mockResolvedValue(null);

      await expect(useCase.execute('missing', {})).rejects.toThrow();

      expect(mockConfigRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('execute() - Error Handling', () => {
    it('dovrebbe propagare errore da findByName', async () => {
      mockConfigRepo.findByName.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute('pokeapi', {})).rejects.toThrow('Database error');
    });

    it('dovrebbe propagare errore da update', async () => {
      mockConfigRepo.findByName.mockResolvedValue(existingConfig);
      mockConfigRepo.update.mockRejectedValue(new Error('Write permission denied'));

      await expect(useCase.execute('pokeapi', { defaultLimit: 50 })).rejects.toThrow(
        'Write permission denied'
      );
    });
  });

  describe('execute() - Edge Cases', () => {
    it('dovrebbe gestire update con oggetto vuoto', async () => {
      mockConfigRepo.findByName.mockResolvedValue(existingConfig);
      mockConfigRepo.update.mockResolvedValue(undefined);

      await useCase.execute('pokeapi', {});

      expect(mockConfigRepo.update).toHaveBeenCalledWith(
        'pokeapi',
        expect.objectContaining({
          name: 'pokeapi',
          baseUrl: 'https://pokeapi.co/api/v2',
          endpoint: '/pokemon',
        })
      );
    });

    it('dovrebbe gestire nome con spazi', async () => {
      mockConfigRepo.findByName.mockResolvedValue(existingConfig);
      mockConfigRepo.update.mockResolvedValue(undefined);

      await useCase.execute('  pokeapi  ', { defaultLimit: 50 });

      expect(mockConfigRepo.findByName).toHaveBeenCalledWith('  pokeapi  ');
    });
  });
});