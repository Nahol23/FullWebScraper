import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiUseCase } from '../../../../application/usecases/Api/ApiUseCase';
import { IApiPort } from '../../../../domain/ports/Api/IApiPort';

// Mock dell'IApiPort
const mockApiPort = {
  request: vi.fn(),
};

const apiUseCase = new ApiUseCase(mockApiPort as IApiPort);

describe('ApiUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeRaw()', () => {
    it('dovrebbe chiamare api.request con parametri corretti per GET', async () => {
      const url = 'https://api.example.com/data';
      const method = 'GET' as const;
      const body = undefined;
      const mockResponse = { data: 'raw response' };

      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.executeRaw(url, method, body);

      expect(mockApiPort.request).toHaveBeenCalledWith({ url, method, body });
      expect(result).toBe(mockResponse);
    });

    it('dovrebbe chiamare api.request con parametri corretti per POST', async () => {
      const url = 'https://api.example.com/data';
      const method = 'POST' as const;
      const body = { key: 'value' };
      const mockResponse = { success: true };

      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.executeRaw(url, method, body);

      expect(mockApiPort.request).toHaveBeenCalledWith({ url, method, body });
      expect(result).toBe(mockResponse);
    });

    it('dovrebbe propagare errori da api.request', async () => {
      const error = new Error('Network error');
      mockApiPort.request.mockRejectedValue(error);

      await expect(apiUseCase.executeRaw('https://api.example.com', 'GET')).rejects.toThrow('Network error');
    });
  });

  describe('execute() - dataPath esplicito', () => {
    it('dovrebbe estrarre array da path depth 1', async () => {
      const mockResponse = {
        data: [{ id: 1, name: 'Item1' }, { id: 2, name: 'Item2' }],
      };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET', undefined, undefined, 'data');

      expect(result.data).toEqual(mockResponse.data);
      expect(result.filteredBy).toBeUndefined();
    });

    it('dovrebbe estrarre array da path depth 3 (a.b.c)', async () => {
      const mockResponse = {
        response: {
          payload: {
            items: [{ id: 1 }, { id: 2 }],
          },
        },
      };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET', undefined, undefined, 'response.payload.items');

      expect(result.data).toEqual(mockResponse.response.payload.items);
    });

    it('dovrebbe ritornare [] se path non esiste', async () => {
      const mockResponse = { data: [] };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET', undefined, undefined, 'nonexistent.path');

      expect(result.data).toEqual([]);
    });

    it('dovrebbe ritornare [] se target non è array', async () => {
      const mockResponse = { data: { id: 1, name: 'test' } };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET', undefined, undefined, 'data');

      expect(result.data).toEqual([]);
    });
  });

  describe('execute() - dataPath assente (first-array-key)', () => {
    it('dovrebbe trovare primo array in root level', async () => {
      const mockResponse = {
        users: [{ id: 1 }, { id: 2 }],
        metadata: { total: 2 },
      };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET');

      expect(result.data).toEqual(mockResponse.users);
    });



    it('dovrebbe ritornare [] se nessun array trovato', async () => {
      const mockResponse = {
        message: 'No data',
        status: 200,
      };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET');

      expect(result.data).toEqual([]);
    });
  });

  describe('execute() - response non contiene array', () => {
    it('dovrebbe normalizzare a [] quando response è primitiva', async () => {
      const mockResponse = 'string response';
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET');

      expect(result.data).toEqual([]);
    });

    it('dovrebbe normalizzare a [] quando response è oggetto senza array', async () => {
      const mockResponse = { message: 'success', code: 200 };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET');

      expect(result.data).toEqual([]);
    });
  });

  describe('execute() - filters', () => {
    it('dovrebbe applicare filtro su campo semplice', async () => {
      const mockResponse = {
        data: [
          { id: 1, status: 'active' },
          { id: 2, status: 'inactive' },
          { id: 3, status: 'active' },
        ],
      };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET', { field: 'status', value: 'active' }, undefined, 'data');

      expect(result.data).toHaveLength(2);
      expect(result.data.every(item => item.status === 'active')).toBe(true);
      expect(result.filteredBy).toEqual({ field: 'status', value: 'active' });
    });

    it('dovrebbe applicare filtro su campo annidato (field.path)', async () => {
      const mockResponse = {
        data: [
          { user: { role: 'admin' } },
          { user: { role: 'user' } },
          { user: { role: 'admin' } },
        ],
      };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET', { field: 'user.role', value: 'admin' }, undefined, 'data');

      expect(result.data).toHaveLength(2);
      expect(result.data.every(item => item.user.role === 'admin')).toBe(true);
    });

    it('dovrebbe usare == per confronto (coercizione type)', async () => {
      const mockResponse = {
        data: [
          { id: 1, count: 10 },
          { id: 2, count: '10' },
          { id: 3, count: 20 },
        ],
      };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET', { field: 'count', value: '10' }, undefined, 'data');

      expect(result.data).toHaveLength(2); // id 1 e 2 matchano (10 == '10')
      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
    });

    it('dovrebbe ritornare [] se nessun elemento matcha filtro', async () => {
      const mockResponse = {
        data: [{ status: 'active' }, { status: 'inactive' }],
      };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET', { field: 'status', value: 'pending' }, undefined, 'data');

      expect(result.data).toEqual([]);
    });

    it('dovrebbe gestire campo non esistente nel filtro', async () => {
      const mockResponse = {
        data: [{ id: 1 }, { id: 2 }],
      };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET', { field: 'nonexistent', value: 'value' }, undefined, 'data');

      expect(result.data).toEqual([]);
    });
  });

  describe('execute() - combinazione dataPath + filters', () => {
    it('dovrebbe applicare dataPath poi filters', async () => {
      const mockResponse = {
        response: {
          items: [
            { id: 1, category: 'A' },
            { id: 2, category: 'B' },
            { id: 3, category: 'A' },
          ],
        },
      };
      mockApiPort.request.mockResolvedValue(mockResponse);

      const result = await apiUseCase.execute('https://api.example.com', 'GET', { field: 'category', value: 'A' }, undefined, 'response.items');

      expect(result.data).toHaveLength(2);
      expect(result.data.every(item => item.category === 'A')).toBe(true);
    });
  });

  describe('execute() - errori', () => {
    it('dovrebbe propagare errori da api.request', async () => {
      const error = new Error('API Error');
      mockApiPort.request.mockRejectedValue(error);

      await expect(apiUseCase.execute('https://api.example.com', 'GET')).rejects.toThrow('API Error');
    });
  });
});
