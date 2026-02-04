import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Assicurati che questi import puntino ai file giusti
import { DownloadAllUseCase } from '../../../../application/usecases/Api/DownloadAllUseCase';
import { ExecuteApiUseCase } from '../../../../application/usecases/Api/ExecuteApiUseCase';
import { FormatDataService } from '../../../../application/services/FormatDataService';
import { IConfigRepository } from '../../../../domain/ports/IConfigRepository';

// MOCK FS
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  appendFileSync: vi.fn(),
  createReadStream: vi.fn(), // Aggiunto per completezza
}));

describe('DownloadAllUseCase', () => {
  let downloadAllUseCase: DownloadAllUseCase;
  let mockConfigRepo: IConfigRepository;
  let mockExecuteUseCase: ExecuteApiUseCase;
  let mockFormatService: FormatDataService;

  const mockConfigRepoFindByName = vi.fn();
  const mockExecute = vi.fn();
  const mockGetMarkdownHeader = vi.fn();
  const mockToMarkdown = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfigRepo = { findByName: mockConfigRepoFindByName } as unknown as IConfigRepository;
    mockExecuteUseCase = { execute: mockExecute } as unknown as ExecuteApiUseCase;
    mockFormatService = {
      getMarkdownHeader: mockGetMarkdownHeader,
      toMarkdown: mockToMarkdown,
    } as unknown as FormatDataService;

    downloadAllUseCase = new DownloadAllUseCase(
      mockConfigRepo,
      mockExecuteUseCase,
      mockFormatService
    );

    (fs.existsSync as any).mockReturnValue(true);
  });

  // --- TEST HAPPY PATH ---

  it('dovrebbe scaricare un JSON semplice (non paginato)', async () => {
    const configName = 'SimpleConfig';
    const mockData = [{ id: 1, name: 'Test' }];
    
    mockConfigRepoFindByName.mockResolvedValue({ name: configName, pagination: null });
    mockExecute.mockResolvedValue({ data: mockData });

    const resultPath = await downloadAllUseCase.execute(configName, 'json');

    expect(resultPath).toContain('.json');
    expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('.json'), '[');
    expect(fs.appendFileSync).toHaveBeenCalledWith(expect.any(String), JSON.stringify(mockData).slice(1, -1));
    expect(fs.appendFileSync).toHaveBeenCalledWith(expect.any(String), ']');
  });

  it('dovrebbe scaricare un Markdown con header e righe', async () => {
    const configName = 'MarkdownConfig';
    const mockData = [{ id: 1, name: 'Test' }];
    const fakeHeader = '| ID | Name |';
    const fakeRow = '| 1 | Test |';

    mockConfigRepoFindByName.mockResolvedValue({ name: configName, selectedFields: ['id', 'name'] });
    mockExecute.mockResolvedValue({ data: mockData });
    mockGetMarkdownHeader.mockReturnValue(fakeHeader);
    mockToMarkdown.mockReturnValue(fakeRow);

    await downloadAllUseCase.execute(configName, 'markdown');

    expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('.md'), '');
    expect(fs.appendFileSync).toHaveBeenCalledWith(expect.any(String), expect.stringContaining(fakeHeader));
    expect(fs.appendFileSync).toHaveBeenCalledWith(expect.any(String), expect.stringContaining(fakeRow));
  });

  // --- TEST PAGINAZIONE & EDGE CASES ---

 it('dovrebbe gestire la PAGINAZIONE concatenando i JSON con la virgola', async () => {
    const configName = 'PagedConfig';
    
    // --- SETUP DATI ---
    // Pagina 1: PIENA (2 elementi). Il codice vedrà 2 == 2 e continuerà.
    const page1 = [{ id: 1 }, { id: 2 }]; 
    // Pagina 2: PARZIALE (1 elemento). Il codice vedrà 1 < 2 e si FERMERÀ.
    const page2 = [{ id: 3 }];            

    mockConfigRepoFindByName.mockResolvedValue({
      name: configName,
      // Impostiamo il limit a 2
      pagination: { type: 'page', paramName: 'page', defaultLimit: 2 } 
    });

    mockExecute
      .mockResolvedValueOnce({ data: page1 }) // Loop 1
      .mockResolvedValueOnce({ data: page2 }); // Loop 2 -> Stop condition triggerata

    // --- EXECUTE ---
    await downloadAllUseCase.execute(configName, 'json');

    // --- ASSERT ---
    const appendCalls = (fs.appendFileSync as any).mock.calls;
    
    // Ci aspettiamo esattamente 3 chiamate: (Page1) -> (Page2) -> (Chiusura)
    expect(appendCalls.length).toBe(3);

    // Call 0: Dati Pagina 1 (senza virgola iniziale)
    // Nota: slice(1, -1) rimuove le quadre [ ] esterne del JSON stringify
    expect(appendCalls[0][1]).toBe(JSON.stringify(page1).slice(1, -1));
    
    // Call 1: Dati Pagina 2 (CON virgola iniziale)
    expect(appendCalls[1][1]).toBe(',' + JSON.stringify(page2).slice(1, -1));
    
    // Call 2: Chiusura Array finale
    expect(appendCalls[2][1]).toBe(']');
  });

  it('dovrebbe lanciare errore se la config non esiste', async () => {
    mockConfigRepoFindByName.mockResolvedValue(null);
    await expect(downloadAllUseCase.execute('NonEsisto')).rejects.toThrow();
  });

  it('dovrebbe gestire array vuoti (API non ritorna dati)', async () => {
    mockConfigRepoFindByName.mockResolvedValue({ name: 'EmptyConfig' });
    mockExecute.mockResolvedValue({ data: [] });

    await downloadAllUseCase.execute('EmptyConfig', 'json');

    expect(fs.writeFileSync).toHaveBeenCalledWith(expect.any(String), '[');
    
    // Verifica che l'unica chiamata append sia la chiusura ']'
    // Se fallisce ancora qui, controlla se ci sono chiamate spurie
    expect(fs.appendFileSync).toHaveBeenLastCalledWith(expect.any(String), ']');
  });

  it('dovrebbe fermarsi se pageIndex supera il safety limit (500)', async () => {
    mockConfigRepoFindByName.mockResolvedValue({
      name: 'InfiniteLoopConfig',
      pagination: { type: 'page', paramName: 'p', defaultLimit: 10 }
    });
    
    mockExecute.mockResolvedValue({ data: new Array(10).fill({ id: 1 }) });

    await downloadAllUseCase.execute('InfiniteLoopConfig', 'json');

    // ✅ FIX 2: Da 0 a 500 sono 501 chiamate
    expect(mockExecute).toHaveBeenCalledTimes(501); 
  });

  it('dovrebbe creare la cartella se non esiste', () => {
    vi.clearAllMocks();
    (fs.existsSync as any).mockReturnValue(false); 

    new DownloadAllUseCase(mockConfigRepo, mockExecuteUseCase, mockFormatService);

    expect(fs.mkdirSync).toHaveBeenCalled();
  });
});