import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiWorkflow } from '../../../application/orchestrators/ApiWorkFlow';
import { ApiUseCase } from '../../../application/usecases/Api/ApiUseCase';
import { IApiPort } from '../../../domain/ports/Api/IApiPort';

// Mock dell'ApiUseCase
const mockApiUseCase = {
  execute: vi.fn(),
  executeRaw: vi.fn(),
};

const apiWorkflow = new ApiWorkflow(mockApiUseCase as unknown as ApiUseCase);

describe('ApiWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('execute()', () => {
    it('dovrebbe delegare a ApiUseCase.execute con parametri corretti', async () => {
      const url = 'https://api.example.com/data';
      const method = 'GET' as const;
      const filters = { field: 'status', value: 'active' };
      const body = { param: 'value' };
      const dataPath = 'data.items';
      const mockResult = { data: [{ id: 1 }], filteredBy: filters };

      mockApiUseCase.execute.mockResolvedValue(mockResult);

      const result = await apiWorkflow.execute(url, method, filters, body, dataPath);

      expect(mockApiUseCase.execute).toHaveBeenCalledWith(url, method, filters, body, dataPath);
      expect(result).toBe(mockResult);
    });

    it('dovrebbe passare undefined per parametri opzionali', async () => {
      const url = 'https://api.example.com/data';
      const method = 'POST' as const;
      const mockResult = { data: [], filteredBy: undefined };

      mockApiUseCase.execute.mockResolvedValue(mockResult);

      const result = await apiWorkflow.execute(url, method);

      expect(mockApiUseCase.execute).toHaveBeenCalledWith(url, method, undefined, undefined, undefined);
      expect(result).toBe(mockResult);
    });

    it('dovrebbe propagare errori da ApiUseCase.execute', async () => {
      const error = new Error('UseCase Error');
      mockApiUseCase.execute.mockRejectedValue(error);

      await expect(apiWorkflow.execute('https://api.example.com', 'GET')).rejects.toThrow('UseCase Error');
    });
  });

  describe('executeBatch()', () => {
    it('dovrebbe eseguire richieste sequenzialmente con concurrencyLimit=1', async () => {
      const requests = [
        { url: 'https://api.example.com/1', method: 'GET' as const, body: { id: 1 } },
        { url: 'https://api.example.com/2', method: 'GET' as const, body: { id: 2 } },
      ];
      const concurrencyLimit = 1;
      const mockResults = [
        { data: [{ id: 1 }], filteredBy: undefined },
        { data: [{ id: 2 }], filteredBy: undefined },
      ];

      mockApiUseCase.execute.mockResolvedValueOnce(mockResults[0]);
      mockApiUseCase.execute.mockResolvedValueOnce(mockResults[1]);

      const result = await apiWorkflow.executeBatch(requests, concurrencyLimit);

      expect(mockApiUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockApiUseCase.execute).toHaveBeenNthCalledWith(1, requests[0].url, requests[0].method, undefined, requests[0].body, undefined);
      expect(mockApiUseCase.execute).toHaveBeenNthCalledWith(2, requests[1].url, requests[1].method, undefined, requests[1].body, undefined);
      expect(result).toEqual(mockResults);
    });

    it('dovrebbe eseguire richieste in chunks con concurrencyLimit=2', async () => {
      const requests = [
        { url: 'https://api.example.com/1', method: 'GET' as const },
        { url: 'https://api.example.com/2', method: 'GET' as const },
        { url: 'https://api.example.com/3', method: 'GET' as const },
        { url: 'https://api.example.com/4', method: 'GET' as const },
        { url: 'https://api.example.com/5', method: 'GET' as const },
        { url: 'https://api.example.com/6', method: 'GET' as const },
      ];
      const concurrencyLimit = 2;
      const mockResults = Array(6).fill(null).map((_, i) => ({ data: [{ id: i + 1 }], filteredBy: undefined }));

      // Mock per ogni chiamata
      mockResults.forEach(result => mockApiUseCase.execute.mockResolvedValueOnce(result));

      const result = await apiWorkflow.executeBatch(requests, concurrencyLimit);

      expect(mockApiUseCase.execute).toHaveBeenCalledTimes(6);
      // Verifica che le chiamate siano state fatte in ordine (chunks di 2)
      expect(result).toEqual(mockResults);
    });

    it('dovrebbe usare concurrencyLimit di default = 3', async () => {
      const requests = Array(7).fill(null).map((_, i) => ({
        url: `https://api.example.com/${i + 1}`,
        method: 'GET' as const,
      }));
      const mockResults = requests.map((_, i) => ({ data: [{ id: i + 1 }], filteredBy: undefined }));

      mockResults.forEach(result => mockApiUseCase.execute.mockResolvedValueOnce(result));

      const result = await apiWorkflow.executeBatch(requests); // senza concurrencyLimit

      expect(mockApiUseCase.execute).toHaveBeenCalledTimes(7);
      expect(result).toEqual(mockResults);
    });

    it('dovrebbe mantenere ordine di input nei risultati', async () => {
      const requests = [
        { url: 'https://api.example.com/a', method: 'GET' as const },
        { url: 'https://api.example.com/b', method: 'GET' as const },
        { url: 'https://api.example.com/c', method: 'GET' as const },
      ];
      const mockResults = [
        { data: [{ name: 'A' }], filteredBy: undefined },
        { data: [{ name: 'B' }], filteredBy: undefined },
        { data: [{ name: 'C' }], filteredBy: undefined },
      ];

      mockApiUseCase.execute.mockResolvedValueOnce(mockResults[0]);
      mockApiUseCase.execute.mockResolvedValueOnce(mockResults[1]);
      mockApiUseCase.execute.mockResolvedValueOnce(mockResults[2]);

      const result = await apiWorkflow.executeBatch(requests, 1);

      expect(result).toEqual(mockResults);
      expect(result[0].data[0].name).toBe('A');
      expect(result[1].data[0].name).toBe('B');
      expect(result[2].data[0].name).toBe('C');
    });

    it('dovrebbe propagare errore se una richiesta fallisce', async () => {
      const requests = [
        { url: 'https://api.example.com/1', method: 'GET' as const },
        { url: 'https://api.example.com/2', method: 'GET' as const },
      ];
      const error = new Error('Request failed');

      mockApiUseCase.execute.mockResolvedValueOnce({ data: [{ id: 1 }], filteredBy: undefined });
      mockApiUseCase.execute.mockRejectedValueOnce(error);

      await expect(apiWorkflow.executeBatch(requests, 1)).rejects.toThrow('Request failed');
    });

    it('dovrebbe gestire array di richieste vuoto', async () => {
      const result = await apiWorkflow.executeBatch([], 3);

      expect(mockApiUseCase.execute).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('dovrebbe gestire singola richiesta', async () => {
      const requests = [{ url: 'https://api.example.com/1', method: 'GET' as const }];
      const mockResult = { data: [{ id: 1 }], filteredBy: undefined };

      mockApiUseCase.execute.mockResolvedValue(mockResult);

      const result = await apiWorkflow.executeBatch(requests, 3);

      expect(mockApiUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockResult]);
    });

    it('dovrebbe gestire concurrencyLimit maggiore del numero di richieste', async () => {
      const requests = [
        { url: 'https://api.example.com/1', method: 'GET' as const },
        { url: 'https://api.example.com/2', method: 'GET' as const },
      ];
      const mockResults = [
        { data: [{ id: 1 }], filteredBy: undefined },
        { data: [{ id: 2 }], filteredBy: undefined },
      ];

      mockApiUseCase.execute.mockResolvedValueOnce(mockResults[0]);
      mockApiUseCase.execute.mockResolvedValueOnce(mockResults[1]);

      const result = await apiWorkflow.executeBatch(requests, 10); // concurrency > requests

      expect(mockApiUseCase.execute).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResults);
    });
  });
});
