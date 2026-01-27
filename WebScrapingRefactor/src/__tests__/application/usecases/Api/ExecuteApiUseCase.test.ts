import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecuteApiUseCase } from '../../../../application/usecases/Api/ExecuteApiUseCase';
import { IConfigRepository } from '../../../../domain/ports/IConfigRepository';
import { IApiPort } from '../../../../domain/ports/Api/IApiPort';
import { ApiConfig } from '../../../../domain/entities/ApiConfig';
import * as ObjectUtils from '../../../../infrastructure/utils/ObjectUtils';

describe('ExecuteApiUseCase', () => {
  let mockConfigRepo: any;
  let mockApiPort: any;
  let useCase: ExecuteApiUseCase;

  const mockConfig: ApiConfig = {
    name: 'pokeapi',
    baseUrl: 'https://pokeapi.co/api/v2',
    endpoint: '/pokemon',
    method: 'GET',
    // dataPath non definito qui per testare l'auto-detect
  };

  const mockApiResponse = {
    count: 1025,
    results: [
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
      { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/' },
    ],
  };

  beforeEach(() => {
    mockConfigRepo = {
      findByName: vi.fn(),
    } as unknown as IConfigRepository;

    mockApiPort = {
      request: vi.fn(),
    } as unknown as IApiPort;

    useCase = new ExecuteApiUseCase(mockConfigRepo, mockApiPort);
  });

  describe('execute() - Happy Path', () => {
    it('dovrebbe eseguire richiesta API e ritornare dati', async () => {
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      mockApiPort.request.mockResolvedValue(mockApiResponse);

      const result = await useCase.execute('pokeapi');

      expect(mockConfigRepo.findByName).toHaveBeenCalledWith('pokeapi');
      expect(mockApiPort.request).toHaveBeenCalledWith({
        url: 'https://pokeapi.co/api/v2/pokemon', 
        method: 'GET',
        body: undefined,
      });
      expect(result.data).toBeDefined();
      expect(result.meta!.total).toBeGreaterThanOrEqual(0);
    });

    it('dovrebbe costruire correttamente URL senza query params', async () => {
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      mockApiPort.request.mockResolvedValue(mockApiResponse);

      await useCase.execute('pokeapi');

      expect(mockApiPort.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://pokeapi.co/api/v2/pokemon',
        })
      );
    });
  });

  describe('execute() - Query Params', () => {
    it('dovrebbe aggiungere query params da config', async () => {
      const configWithParams: ApiConfig = {
        ...mockConfig,
        queryParams: [
          
          { key: 'limit', value: '20', type: 'string' },
          { key: 'offset', value: '0', type: 'number' },
        ],
      };
      mockConfigRepo.findByName.mockResolvedValue(configWithParams);
      mockApiPort.request.mockResolvedValue(mockApiResponse);

      await useCase.execute('pokeapi');

      const callUrl = (mockApiPort.request.mock.calls[0][0] as any).url;
      expect(callUrl).toContain('limit=20');
      expect(callUrl).toContain('offset=0');
    });

    it('dovrebbe applicare runtime params', async () => {
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      mockApiPort.request.mockResolvedValue(mockApiResponse);

      await useCase.execute('pokeapi', { limit: 50, offset: 10 });

      const callUrl = (mockApiPort.request.mock.calls[0][0] as any).url;
      expect(callUrl).toContain('limit=50');
      expect(callUrl).toContain('offset=10');
    });

    it('dovrebbe fare override di config params con runtime params', async () => {
      const configWithParams: ApiConfig = {
        ...mockConfig,
        queryParams: [
          
          { key: 'limit', value: '20', type: 'number' },
        ],
      };
      mockConfigRepo.findByName.mockResolvedValue(configWithParams);
      mockApiPort.request.mockResolvedValue(mockApiResponse);

      await useCase.execute('pokeapi', { limit: 100 });

      const callUrl = (mockApiPort.request.mock.calls[0][0] as any).url;
      expect(callUrl).toContain('limit=100');
    });
  });

  describe('execute() - Filter', () => {
    it('dovrebbe applicare filter ai risultati', async () => {
      const configWithFilter: ApiConfig = {
        ...mockConfig,
        dataPath: 'results',
        filter: { field: 'name', value: 'bulbasaur' },
      };
      mockConfigRepo.findByName.mockResolvedValue(configWithFilter);
      mockApiPort.request.mockResolvedValue(mockApiResponse);

      const result = await useCase.execute('pokeapi');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('bulbasaur');
    });

    it('dovrebbe ritornare array vuoto se nessun item matcha il filter', async () => {
      const configWithFilter: ApiConfig = {
        ...mockConfig,
        dataPath: 'results',
        filter: { field: 'name', value: 'nonexistent' },
      };
      mockConfigRepo.findByName.mockResolvedValue(configWithFilter);
      mockApiPort.request.mockResolvedValue(mockApiResponse);

      const result = await useCase.execute('pokeapi');

      expect(result.data).toHaveLength(0);
      
      expect(result.meta!.total).toBe(0);
    });
  });

  describe('execute() - Selected Fields', () => {
    it('dovrebbe selezionare solo i campi specificati', async () => {
      const configWithFields: ApiConfig = {
        ...mockConfig,
        dataPath: 'results',
        selectedFields: ['name'],
      };
      mockConfigRepo.findByName.mockResolvedValue(configWithFields);
      mockApiPort.request.mockResolvedValue(mockApiResponse);

      const result = await useCase.execute('pokeapi');

      expect(result.data).toHaveLength(3);
      result.data.forEach((item: any) => {
        expect(Object.keys(item)).toEqual(['name']);
      });
    });
  });

  describe('execute() - Auto-detect Array Path', () => {
    it('dovrebbe auto-detect array quando dataPath non è definito', async () => {
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      
      mockApiPort.request.mockResolvedValue([
        { id: 1, name: 'item1' },
        { id: 2, name: 'item2' },
      ]);

      const result = await useCase.execute('pokeapi');

      expect(result.data).toHaveLength(2);
    });

    it('dovrebbe ritornare array vuoto se response non è array e dataPath non definito', async () => {
    
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      mockApiPort.request.mockResolvedValue({ message: 'success' });

      const result = await useCase.execute('pokeapi');

      expect(result.data).toEqual([]);
      expect(result.meta!.total).toBe(0);
    });

    it('dovrebbe usare path trovato da findFirstArrayPath se dataPath è undefined', async () => {
      // 1. Prepariamo una risposta con un array annidato profondo
      const nestedResponse = {
        meta: { page: 1 },
        items: [{ id: 99, name: 'deep item' }]
      };

      // 2. Simuliamo configurazione senza dataPath
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);
      mockApiPort.request.mockResolvedValue(nestedResponse);

      // 3. Forziamo le Utils a trovare un path (simuliamo il comportamento reale)
      vi.mocked(ObjectUtils.findFirstArrayPath).mockReturnValue('items');
      
      vi.mocked(ObjectUtils.findFirstArrayPath).mockImplementation((data, path) => {
        if (path === 'items') return (data as any).items;
        return [];
      });

      const result = await useCase.execute('pokeapi');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(99);
      expect(ObjectUtils.findFirstArrayPath).toHaveBeenCalledWith(nestedResponse);
    });



  });

  describe('execute() - Config Not Found', () => {
    it('dovrebbe lanciare errore quando config non esiste', async () => {
      mockConfigRepo.findByName.mockResolvedValue(null);

      await expect(useCase.execute('nonexistent')).rejects.toThrow(
        'Configurazione non trovata'
      );
    });
  });
  
  describe('execute() - Integration', () => {
      it('dovrebbe eseguire flusso completo: query params + filter + selectedFields', async () => {
        const fullConfig: ApiConfig = {
          ...mockConfig,
          queryParams: [{ key: 'limit', value: '10', type: 'number' }], 
          dataPath: 'results',
          filter: { field: 'type', value: 'grass' },
          selectedFields: ['name', 'id'],
        };
        const responseData = {
          results: [
            { name: 'bulbasaur', type: 'grass', id: 1, url: 'http://...' },
            { name: 'oddish', type: 'grass', id: 69, url: 'http://...' },
            { name: 'charmander', type: 'fire', id: 4, url: 'http://...' },
          ],
        };
        mockConfigRepo.findByName.mockResolvedValue(fullConfig);
        mockApiPort.request.mockResolvedValue(responseData);
  
        const result = await useCase.execute('pokeapi', { limit: 20 });
  
        expect(mockApiPort.request).toHaveBeenCalledWith(
          expect.objectContaining({
            url: expect.stringContaining('limit=20'),
          })
        );
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toEqual({ name: 'bulbasaur', id: 1 });
      });
    });
});
