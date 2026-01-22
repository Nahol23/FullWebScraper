import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteConfigUseCase } from '../../../../application/usecases/Configs/DeleteConfigUseCase';
import { IConfigRepository } from '../../../../domain/ports/IConfigRepository';
import { ApiConfig } from '../../../../domain/entities/ApiConfig';

describe('DeleteConfigUseCase', () => {
  let mockConfigRepo: any;
  let useCase: DeleteConfigUseCase;

  const mockConfig: ApiConfig = {
    name: 'api_to_delete',
    baseUrl: 'https://api.example.com',
    endpoint: '/data',
    method: 'GET',
  };

  beforeEach(() => {
    mockConfigRepo = {
      findAll: vi.fn(),
      findByName: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    } as unknown as IConfigRepository;

    useCase = new DeleteConfigUseCase(mockConfigRepo);
  });

  describe('execute() - Happy Path', () => {
    it('dovrebbe eliminare config quando esiste', async () => {
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      mockConfigRepo.delete.mockResolvedValue(undefined);

      await useCase.execute('api_to_delete');

      expect(mockConfigRepo.findByName).toHaveBeenCalledWith('api_to_delete');
      expect(mockConfigRepo.delete).toHaveBeenCalledWith('api_to_delete');
      expect(mockConfigRepo.delete).toHaveBeenCalledTimes(1);
    });

    it('dovrebbe verificare esistenza prima di eliminare', async () => {
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      mockConfigRepo.delete.mockResolvedValue(undefined);

      await useCase.execute('api_to_delete');

      // Verifichiamo che findByName venga chiamato PRIMA di delete
      expect(mockConfigRepo.findByName).toHaveBeenCalledBefore(mockConfigRepo.delete);
    });

    it('dovrebbe gestire eliminazione di config con campi completi', async () => {
      const completeConfig: ApiConfig = {
        ...mockConfig,
        defaultLimit: 100,
        dataPath: 'results.items',
        filter: { field: 'status', value: 'active' },
      };
      mockConfigRepo.findByName.mockResolvedValue(completeConfig);
      mockConfigRepo.delete.mockResolvedValue(undefined);

      await useCase.execute('api_to_delete');

      expect(mockConfigRepo.delete).toHaveBeenCalledWith('api_to_delete');
    });
  });

  describe('execute() - Not Found', () => {
    it('dovrebbe lanciare errore quando config non esiste', async () => {
      mockConfigRepo.findByName.mockResolvedValue(null);

      await expect(useCase.execute('nonexistent')).rejects.toThrow(
        'Configurazione non trovata'
      );

      expect(mockConfigRepo.delete).not.toHaveBeenCalled();
    });

    it('dovrebbe non eliminare se findByName ritorna null', async () => {
      mockConfigRepo.findByName.mockResolvedValue(null);

      try {
        await useCase.execute('missing');
      } catch (e) {
        // expected
      }

      expect(mockConfigRepo.delete).not.toHaveBeenCalled();
    });

    it('dovrebbe gestire case-sensitive in ricerca', async () => {
      mockConfigRepo.findByName.mockResolvedValue(null);

      await expect(useCase.execute('APItoDelete')).rejects.toThrow(
        'Configurazione non trovata'
      );
    });
  });

  describe('execute() - Error Handling', () => {
    it('dovrebbe propagare errore da findByName', async () => {
      mockConfigRepo.findByName.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(useCase.execute('api_to_delete')).rejects.toThrow(
        'Database connection failed'
      );

      expect(mockConfigRepo.delete).not.toHaveBeenCalled();
    });

    it('dovrebbe propagare errore da delete', async () => {
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      mockConfigRepo.delete.mockRejectedValue(new Error('Permission denied'));

      await expect(useCase.execute('api_to_delete')).rejects.toThrow(
        'Permission denied'
      );
    });

    it('dovrebbe gestire errore file system durante delete', async () => {
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      mockConfigRepo.delete.mockRejectedValue(new Error('ENOENT: file not found'));

      await expect(useCase.execute('api_to_delete')).rejects.toThrow('ENOENT');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('dovrebbe gestire nome con spazi', async () => {
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      mockConfigRepo.delete.mockResolvedValue(undefined);

      await useCase.execute('  api_to_delete  ');

      expect(mockConfigRepo.findByName).toHaveBeenCalledWith('  api_to_delete  ');
    });

    it('dovrebbe gestire nome vuoto', async () => {
      mockConfigRepo.findByName.mockResolvedValue(null);

      await expect(useCase.execute('')).rejects.toThrow('Configurazione non trovata');
    });

    it('dovrebbe gestire nome con caratteri speciali', async () => {
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      mockConfigRepo.delete.mockResolvedValue(undefined);

      await useCase.execute('api-v2_test.prod');

      expect(mockConfigRepo.findByName).toHaveBeenCalledWith('api-v2_test.prod');
      expect(mockConfigRepo.delete).toHaveBeenCalledWith('api-v2_test.prod');
    });
  });

  describe('execute() - Idempotency', () => {
    it('dovrebbe lanciare errore anche se già eliminato', async () => {
      mockConfigRepo.findByName.mockResolvedValue(null);

      // Prima eliminazione (implicita nel test)
      await expect(useCase.execute('api_to_delete')).rejects.toThrow(
        'Configurazione non trovata'
      );

      // Seconda eliminazione dello stesso dovrebbe comunque lanciare errore
      await expect(useCase.execute('api_to_delete')).rejects.toThrow(
        'Configurazione non trovata'
      );
    });
  });
});