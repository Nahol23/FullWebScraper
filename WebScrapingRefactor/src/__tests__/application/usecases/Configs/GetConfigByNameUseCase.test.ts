import {describe, it, expect,vi, beforeEach} from "vitest";
import { GetConfigByNameUseCase } from "../../../../application/usecases/Configs/GetConfigByNameUseCase";
import { IConfigRepository } from "../../../../domain/ports/IConfigRepository";
import {ApiConfig} from "../../../../domain/entities/ApiConfig";


describe('GetConfigByNameUseCase', () => {

    let mockConfigRepo: any;
    let usecase : GetConfigByNameUseCase;

    const mockConfig: ApiConfig = {
        name: 'pokeApi',
        baseUrl: 'https://pokeapi.co/api/v2',
        endpoint:'/endpoint',
        method: 'GET',
        defaultLimit:20,
    };

    beforeEach(()=> {
        mockConfigRepo = {
            findAll: vi.fn(),
            findByName: vi.fn(),
            save: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        } as unknown as IConfigRepository;

        usecase= new GetConfigByNameUseCase(mockConfigRepo);
    });

    describe('execute()- Best Scenario', ()=>{
        it('dovrebbe tornare  config se esiste', async ()=> {
            mockConfigRepo.findByName.mockResolvedValue(mockConfig);

            const result = await usecase.execute('pokeApi');
            expect(mockConfigRepo.findByName).toHaveBeenCalledWith('pokeApi');
            expect(result).toEqual(mockConfig);
            expect(result?.name).toBe('pokeApi');

        });

        it('dovrebbe chiamare findByName con il nome corretto', async () =>{
            mockConfigRepo.findByName.mockResolvedValue(mockConfig);

            await usecase.execute('testApi');

            expect(mockConfigRepo.findByName).toHaveBeenCalledWith('testApi');
            expect(mockConfigRepo.findByName).toHaveBeenCalledTimes(1);

        });

        it('dovrebbe ritornare config con campi completi', async () => {
            const completeConfig: ApiConfig = {
                ...mockConfig,
                dataPath: 'results.items',
                filter: { field: 'type', value: 'grass' },
                selectedFields: ['id', 'name', 'abilities'],
            };
            mockConfigRepo.findByName.mockResolvedValue(completeConfig);

            const result = await usecase.execute('pokeapi');

            expect(result?.dataPath).toBe('results.items');
            expect(result?.filter).toEqual({ field: 'type', value: 'grass' });
        });

    });

    
    describe('execute() - Config Not Found', () => {
        it('dovrebbe ritornare null quando config non esiste', async () => {
        mockConfigRepo.findByName.mockResolvedValue(null);

        const result = await usecase.execute('nonexistent');

        expect(result).toBeNull();
        });

        it('dovrebbe ritornare null per nome case-sensitive non trovato', async () => {
        mockConfigRepo.findByName.mockResolvedValue(null);

        const result = await usecase.execute('PokeApi'); // diverso da 'pokeapi'

        expect(result).toBeNull();
        });
    });

    describe('execute() - Error Handling', () => {
    it('dovrebbe propagare errore da repository', async () => {
      const error = new Error('File read error');
      mockConfigRepo.findByName.mockRejectedValue(error);

      await expect(usecase.execute('pokeapi')).rejects.toThrow('File read error');
    });

    it('dovrebbe gestire errore JSON parsing', async () => {
      mockConfigRepo.findByName.mockRejectedValue(new Error('Invalid JSON'));

      await expect(usecase.execute('corrupted')).rejects.toThrow('Invalid JSON');
    });
  });


   describe('execute() - Edge Cases', () => {
    it('dovrebbe gestire nome con spazi', async () => {
      mockConfigRepo.findByName.mockResolvedValue(mockConfig);

      await usecase.execute('  pokeapi  ');

      expect(mockConfigRepo.findByName).toHaveBeenCalledWith('  pokeapi  ');
    });

    it('dovrebbe gestire nome vuoto', async () => {
      mockConfigRepo.findByName.mockResolvedValue(null);

      const result = await usecase.execute('');

      expect(result).toBeNull();
    });
  });

});
