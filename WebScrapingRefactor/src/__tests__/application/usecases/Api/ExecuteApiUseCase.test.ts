import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecuteApiUseCase } from '../../../../application/usecases/Api/ExecuteApiUseCase';
import { IConfigRepository } from '../../../../domain/ports/IConfigRepository';
import { IApiPort } from '../../../../domain/ports/Api/IApiPort';
// Importa le Utils per poterle mockare
import * as ObjectUtils from '../../../../infrastructure/utils/ObjectUtils';

// 1. Mock delle Utility (Cruciale: intercettiamo le funzioni esterne)
vi.mock('../../../../infrastructure/utils/ObjectUtils', () => ({
  getNestedData: vi.fn(),
  findFirstArrayPath: vi.fn(),
}));

describe('ExecuteApiUseCase - Complete Test Suite (Smart Version)', () => {
  let mockConfigRepo: IConfigRepository;
  let mockApiPort: IApiPort;
  let useCase: ExecuteApiUseCase;

  // Configurazione base per evitare ripetizioni
  const baseConfig = {
    id: '1',
    name: 'test-api',
    baseUrl: 'https://api.example.com',
    endpoint: '/resource',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    queryParams: [],
    body: null
  };

  beforeEach(() => {
    // Reset dei mock prima di ogni test per pulizia
    vi.clearAllMocks();

    // Setup dei mock dei Repository/Port
    mockConfigRepo = {
      findByName: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
    } as unknown as IConfigRepository;

    mockApiPort = {
      request: vi.fn(),
    } as unknown as IApiPort;

    // Default Behavior per ObjectUtils per evitare crash nei test semplici
    // Se getNestedData viene chiamato, restituisce l'oggetto stesso di default
    vi.mocked(ObjectUtils.getNestedData).mockImplementation((data) => data);
    vi.mocked(ObjectUtils.findFirstArrayPath).mockReturnValue(null);

    useCase = new ExecuteApiUseCase(mockConfigRepo, mockApiPort);
  });

  // ==========================================
  // 1. TEST VALIDAZIONE E ERRORI
  // ==========================================

  it('dovrebbe lanciare un errore se la configurazione non esiste', async () => {
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue(null);

    await expect(useCase.execute('NonEsiste')).rejects.toThrow(
      'Configurazione "NonEsiste" non trovata'
    );
  });

  it('dovrebbe rilanciare gli errori di rete dal ApiPort', async () => {
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue(baseConfig as any);
    vi.mocked(mockApiPort.request).mockRejectedValue(new Error('Network Error'));

    await expect(useCase.execute('test-api')).rejects.toThrow(
      'Errore chiamata API "test-api": Network Error'
    );
  });

  // ==========================================
  // 2. TEST LOGICA GET (SICUREZZA & URL)
  // ==========================================

  it('[GET] dovrebbe rimuovere il body e mettere TUTTI i parametri runtime nell\'URL', async () => {
    // SETUP: Configurazione GET sporca (ha un body per errore)
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue({
      ...baseConfig,
      method: 'GET',
      body: { dirty: 'data' }, 
      queryParams: [{ key: 'static', value: '1' }]
    } as any);

    vi.mocked(mockApiPort.request).mockResolvedValue([]);

    // EXECUTE: Passiamo un parametro che usa i punti (filtri) + paginazione
    await useCase.execute('test-api', { 
      'filter.active': true,
      'page': 2 
    });

    // ASSERT
    expect(mockApiPort.request).toHaveBeenCalledWith({
      url: 'https://api.example.com/resource?static=1&filter.active=true&page=2',
      method: 'GET',
      body: undefined, // VERIFICA SICUREZZA: Body forzato a undefined
      headers: { 'Content-Type': 'application/json' }
    });
  });

  it('[GET] parametri runtime dovrebbero sovrascrivere query params statici', async () => {
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue({
      ...baseConfig,
      method: 'GET',
      queryParams: [{ key: 'limit', value: '10' }]
    } as any);

    vi.mocked(mockApiPort.request).mockResolvedValue([]);

    await useCase.execute('test-api', { limit: 50 }); // Runtime: 50

    // Verifica URL contiene limit=50
    const callArgs = vi.mocked(mockApiPort.request).mock.calls[0][0];
    expect(callArgs.url).toContain('limit=50');
    expect(callArgs.url).not.toContain('limit=10');
  });

  // ==========================================
  // 3. TEST LOGICA POST (SMART MERGE)
  // ==========================================

  it('[POST] Smart Merge: Aggiorna body esistente, Crea annidati (dot notation), Appende URL (semplici)', async () => {
    // SETUP: POST con un body base
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue({
      ...baseConfig,
      method: 'POST',
      body: { status: 'draft' } // Body esistente
    } as any);

    vi.mocked(mockApiPort.request).mockResolvedValue({});

    // EXECUTE
    await useCase.execute('test-api', {
      status: 'published',       // Esiste nel body -> Aggiorna
      'user.name': 'Mario',      // Ha i punti -> Crea struttura nel Body
      apiKey: 'secret123'        // Semplice e non esiste -> URL
    });

    // ASSERT
    expect(mockApiPort.request).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://api.example.com/resource?apiKey=secret123',
      method: 'POST',
      body: {
        status: 'published',
        user: { name: 'Mario' }
      }
    }));
  });

  it('[POST] Deep Merge: non dovrebbe cancellare i dati fratelli quando aggiungo un campo annidato', async () => {
    // SETUP: Body complesso preesistente
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue({
      ...baseConfig,
      method: 'POST',
      body: { 
        user: { 
          name: 'Mario', 
          settings: { theme: 'dark' } 
        } 
      }
    } as any);

    vi.mocked(mockApiPort.request).mockResolvedValue({});

    // EXECUTE: Aggiungo solo user.age
    await useCase.execute('test-api', {
      'user.age': 30
    });

    // ASSERT: Tutto il resto deve rimanere
    expect(mockApiPort.request).toHaveBeenCalledWith(expect.objectContaining({
      body: {
        user: {
          name: 'Mario',          // Preservato
          settings: { theme: 'dark' }, // Preservato
          age: 30                 // Aggiunto
        }
      }
    }));
  });

  // ==========================================
  // 4. TEST HEADERS
  // ==========================================

  it('dovrebbe fare il merge degli headers (runtime vince su statici)', async () => {
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue({
      ...baseConfig,
      headers: { 'X-Static': 'A', 'Authorization': 'Old' }
    } as any);

    vi.mocked(mockApiPort.request).mockResolvedValue([]);

    await useCase.execute('test-api', {
      headers: { 'Authorization': 'New', 'X-Runtime': 'B' }
    });

    expect(mockApiPort.request).toHaveBeenCalledWith(expect.objectContaining({
      headers: {
        'X-Static': 'A',
        'Authorization': 'New', // Sovrascritto
        'X-Runtime': 'B'        // Aggiunto
      }
    }));
  });

  // ==========================================
  // 5. TEST DATA PROCESSING (Extract, Filter, Select)
  // ==========================================

  it('dovrebbe estrarre array (dataPath), filtrare (filter) e selezionare campi (selectedFields)', async () => {
    // DATI SIMULATI
    const apiResponse = {
      wrapper: {
        items: [
          { id: 1, type: 'A', secret: 'xxx' },
          { id: 2, type: 'B', secret: 'yyy' },
          { id: 3, type: 'A', secret: 'zzz' }
        ]
      }
    };

    // CONFIGURAZIONE
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue({
      ...baseConfig,
      dataPath: 'wrapper.items',
      filter: { field: 'type', value: 'A' },
      selectedFields: ['id']
    } as any);

    vi.mocked(mockApiPort.request).mockResolvedValue(apiResponse);
    
    // MOCK UTILS INTELLIGENTE PER QUESTO TEST
    // Simuliamo che getNestedData sappia estrarre 'wrapper.items' e anche 'type' per il filtro
    vi.mocked(ObjectUtils.getNestedData).mockImplementation((obj, path) => {
       if (path === 'wrapper.items') return (obj as any).wrapper.items; // Estrazione
       if (path === 'type') return (obj as any).type;                   // Filtro
       if (path === 'id') return (obj as any).id;                       // Selezione
       return undefined;
    });

    const result = await useCase.execute('test-api');

    // ASSERT
    expect(result.data).toEqual([
      { id: 1 },
      { id: 3 }
    ]);
    expect(result.meta?.total).toBe(2);
  });

  // ==========================================
  // 6. TEST EDGE CASES (Robustezza)
  // ==========================================

  it('dovrebbe restituire array vuoto se API risponde null/undefined', async () => {
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue(baseConfig as any);
    vi.mocked(mockApiPort.request).mockResolvedValue(null); // API rota

    const result = await useCase.execute('test-api');

    expect(result.data).toEqual([]);
    expect(result.meta?.total).toBe(0);
  });

  it('dovrebbe avvolgere un singolo oggetto in array se API non torna una lista', async () => {
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue(baseConfig as any);
    
    const singleObj = { id: 99 };
    vi.mocked(mockApiPort.request).mockResolvedValue(singleObj);
    
    // Assicuriamo che findFirstArrayPath non trovi nulla
    vi.mocked(ObjectUtils.findFirstArrayPath).mockReturnValue(null);

    const result = await useCase.execute('test-api');

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(singleObj);
  });

  it('dovrebbe funzionare anche senza parametri runtime (undefined)', async () => {
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue(baseConfig as any);
    vi.mocked(mockApiPort.request).mockResolvedValue([]);

    // Chiamata senza secondo argomento
    await expect(useCase.execute('test-api')).resolves.not.toThrow();
  });

  // ==========================================
  // 7. TEST PER IL 100% COVERAGE (Deep Nested Fix)
  // ==========================================

  it('[Coverage 145-146] DataPath configurato ma non trovato', async () => {
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue({
      ...baseConfig,
      dataPath: 'non.esistente' 
    } as any);

    const apiResponse = { data: [1, 2, 3] };
    vi.mocked(mockApiPort.request).mockResolvedValue(apiResponse);

    vi.mocked(ObjectUtils.getNestedData).mockReturnValue(undefined as any); 
    vi.mocked(ObjectUtils.findFirstArrayPath).mockReturnValue('data'); 
    vi.mocked(ObjectUtils.getNestedData).mockImplementation((obj, path) => {
        if (path === 'data') return (obj as any).data;
        return undefined;
    });

    const result = await useCase.execute('test-api');
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('[Coverage 183 - Null Check] keyExistsInObject: 3 livelli per intercettare null intermedio', async () => {
    // SCENARIO: user.profile è null. Noi cerchiamo user.profile.age
    // Livello 1: user (ok) -> current diventa { profile: null }
    // Livello 2: profile (è null) -> current diventa null
    // Livello 3 (Tentativo): Il loop controlla current (null) PRIMA di cercare 'age'. BOOM -> riga 183 coperta.
    
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue({
      ...baseConfig,
      method: 'POST',
      body: { user: { profile: null } } 
    } as any);

    vi.mocked(mockApiPort.request).mockResolvedValue({});

    await useCase.execute('test-api', {
      'user.profile.age': 30 // 3 Livelli!
    });

    // Verify overwrite
    expect(mockApiPort.request).toHaveBeenCalledWith(expect.objectContaining({
      body: { user: { profile: { age: 30 } } }
    }));
  });

  it('[Coverage 194 + 183 Primitive] setNestedValue: 3 livelli per intercettare stringa intermedia', async () => {
    // SCENARIO: settings.theme è una stringa "legacy". Noi cerchiamo settings.theme.color
    // Serve profondità 3 per far fallire il check 'typeof !== object' dentro il loop
    
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue({
      ...baseConfig,
      method: 'POST',
      body: { settings: { theme: "legacy" } }
    } as any);

    vi.mocked(mockApiPort.request).mockResolvedValue({});

    await useCase.execute('test-api', {
      'settings.theme.color': 'blue' // 3 Livelli!
    });

    expect(mockApiPort.request).toHaveBeenCalledWith(expect.objectContaining({
      body: {
        settings: { theme: { color: 'blue' } } // "legacy" sostituito
      }
    }));
  });

  it('[Coverage 183 - Array Check] keyExistsInObject: 3 livelli per intercettare Array intermedio', async () => {
    // SCENARIO: tags.groups è un array. Noi cerchiamo tags.groups.id
    // Se usiamo solo 2 livelli, il loop finisce prima di controllare se l'array è valido.
    // Con 3 livelli, il loop è costretto a iterare SULL'array.
    
    vi.mocked(mockConfigRepo.findByName).mockResolvedValue({
      ...baseConfig,
      method: 'POST',
      body: { tags: { groups: ["a", "b"] } } 
    } as any);

    vi.mocked(mockApiPort.request).mockResolvedValue({});

    await useCase.execute('test-api', {
      'tags.groups.id': 123 // 3 Livelli!
    });

    // Risultato: L'array ["a", "b"] viene distrutto e sostituito da { id: 123 }
    expect(mockApiPort.request).toHaveBeenCalledWith(expect.objectContaining({
      body: {
        tags: { groups: { id: 123 } }
      }
    }));
  });

 


});