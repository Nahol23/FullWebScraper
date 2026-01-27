import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyzeApiUseCase } from '../../../../application/usecases/Api/AnalyzeApiUseCase'; // Aggiusta il path in base alla tua struttura
import { IApiPort } from '../../../../domain/ports/Api/IApiPort'; ;

describe('AnalyzeApiUseCase', () => {
  let useCase: AnalyzeApiUseCase;
  let mockApiPort: IApiPort;

  beforeEach(() => {
    // 1. Creiamo un Mock della porta API
    mockApiPort = {
      request: vi.fn(),
    };
    
    // 2. Inizializziamo il UseCase con il mock
    useCase = new AnalyzeApiUseCase(mockApiPort);
  });

  describe('Validation & Error Handling', () => {
    it('dovrebbe lanciare errore se l\'URL non è valido', async () => {
      await expect(useCase.analyze('non-un-url', 'GET'))
        .rejects
        .toThrow('URL non valido');
    });

    it('dovrebbe rilanciare l\'errore se la chiamata API fallisce', async () => {
      // Simuliamo un fallimento della porta
      vi.mocked(mockApiPort.request).mockRejectedValue(new Error('Network Error'));

      await expect(useCase.analyze('https://api.test/users', 'GET'))
        .rejects
        .toThrow('Errore durante la chiamata API: Network Error');
    });
  });

  describe('Parameter Extraction (The "Hybrid" Logic)', () => {
    it('dovrebbe estrarre i parametri dalla Query String (GET)', async () => {
      vi.mocked(mockApiPort.request).mockResolvedValue({});
      
      const result = await useCase.analyze('https://api.test/data?page=1&sort=desc', 'GET');

      expect(result.detectedParams).toEqual(expect.arrayContaining([
        { key: 'page', value: '1', type: 'number' },
        { key: 'sort', value: 'desc', type: 'string' }
      ]));
    });

    it('dovrebbe estrarre i parametri dal Body (POST / Search)', async () => {
      vi.mocked(mockApiPort.request).mockResolvedValue({});
      
      const body = { isActive: true, limit: 100 };
      const result = await useCase.analyze('https://api.test/search', 'POST', body);

      expect(result.detectedParams).toEqual(expect.arrayContaining([
        { key: 'isActive', value: 'true', type: 'boolean' },
        { key: 'limit', value: '100', type: 'number' }
      ]));
    });

    it('dovrebbe unire parametri URL e parametri Body (Caso Ibrido)', async () => {
      vi.mocked(mockApiPort.request).mockResolvedValue({});
      
      const url = 'https://api.test/search?version=v2';
      const body = { query: 'keyword' };
      
      const result = await useCase.analyze(url, 'POST', body);

      expect(result.detectedParams).toHaveLength(2);
      expect(result.detectedParams).toEqual(expect.arrayContaining([
        { key: 'version', value: 'v2', type: 'string' }, // Da URL
        { key: 'query', value: 'keyword', type: 'string' } // Da Body
      ]));
    });
  });

  describe('Type Inference', () => {
    it('dovrebbe inferire correttamente number, boolean e string', async () => {
      vi.mocked(mockApiPort.request).mockResolvedValue({});
      
      // Testiamo tramite URL per comodità
      const url = 'https://api.test/?num=123&bool=true&str=hello&zero=0';
      const result = await useCase.analyze(url, 'GET');

      const params = result.detectedParams;
      expect(params.find(p => p.key === 'num')?.type).toBe('number');
      expect(params.find(p => p.key === 'bool')?.type).toBe('boolean');
      expect(params.find(p => p.key === 'str')?.type).toBe('string');
      expect(params.find(p => p.key === 'zero')?.type).toBe('number');
    });
  });

  describe('Data Analysis & Limits', () => {
    it('dovrebbe estrarre i campi suggeriti da un Array di oggetti', async () => {
      const mockResponse = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      vi.mocked(mockApiPort.request).mockResolvedValue(mockResponse);

      const result = await useCase.analyze('https://api.test', 'GET');

      expect(result.suggestedFields).toEqual(['id', 'name']);
      expect(result.sampleData).toEqual(mockResponse);
    });

    it('dovrebbe estrarre i campi suggeriti da un Oggetto singolo', async () => {
      const mockResponse = { status: 'ok', data: [] };
      vi.mocked(mockApiPort.request).mockResolvedValue(mockResponse);

      const result = await useCase.analyze('https://api.test', 'GET');

      expect(result.suggestedFields).toEqual(['status', 'data']);
    });

    it('dovrebbe limitare sampleData a 50 elementi se l\'array è troppo grande', async () => {
      // Creiamo un array di 60 elementi
      const bigArray = Array.from({ length: 60 }, (_, i) => ({ id: i }));
      vi.mocked(mockApiPort.request).mockResolvedValue(bigArray);

      const result = await useCase.analyze('https://api.test', 'GET');

      expect(Array.isArray(result.sampleData)).toBe(true);
      expect((result.sampleData as any[]).length).toBe(50); // Deve essere tagliato a 50
    });

    it('non dovrebbe crashare se la risposta è null', async () => {
      vi.mocked(mockApiPort.request).mockResolvedValue(null);

      const result = await useCase.analyze('https://api.test', 'GET');

      expect(result.suggestedFields).toEqual([]);
      expect(result.sampleData).toBeNull();
    });
  });
});