import * as fs from 'fs';
import * as path from 'path';
import { ExecuteApiUseCase } from './ExecuteApiUseCase';
import { FormatDataService } from '../../services/FormatDataService';
import { IConfigRepository } from '../../../domain/ports/IConfigRepository';

export class DownloadAllUseCase {
  // Cartella temporanea dove salvare i file prima di inviarli
  private outputDir = path.join(process.cwd(), 'output', 'temp');

  constructor(
    private configRepo: IConfigRepository,
    private executeUseCase: ExecuteApiUseCase,
    private formatService: FormatDataService
  ) {
    // Crea la cartella se non esiste
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async execute(configName: string, format: 'json' | 'md' = 'md'): Promise<string> {
    const config = await this.configRepo.findByName(configName);
    if (!config) throw new Error(`Configurazione "${configName}" non trovata`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${configName.replace(/\s+/g, '_')}_${timestamp}.${format}`;
    const filePath = path.join(this.outputDir, fileName);

    // --- SETUP FILE ---
    if (format === 'json') {
      fs.writeFileSync(filePath, '['); // Inizia array JSON
    } else {
      fs.writeFileSync(filePath, ''); // Pulisce il file MD
    }

    // --- SETUP LOOP ---
    const pagConfig = config.pagination;
    const isPaginated = !!pagConfig;
    
    let pageIndex = 0; 
    let hasMore = true;
    let isFirstBatch = true;
    let totalDownloaded = 0;

    console.log(`[Download] Inizio export: ${configName} (Format: ${format}, Paginato: ${isPaginated})`);

    while (hasMore) {
      // 1. Costruzione Parametri Runtime per questo batch
      let runtimeParams: Record<string, unknown> = {};

      if (isPaginated && pagConfig) {
        // Calcolo valore parametro (offset o page)
        const paramValue = pagConfig.type === 'page' 
          ? pageIndex + 1           // Es: page=1, page=2
          : pageIndex * pagConfig.defaultLimit; // Es: offset=0, offset=50

        runtimeParams = {
          [pagConfig.paramName]: paramValue,
          [pagConfig.limitParam]: pagConfig.defaultLimit
        };
      } else {
        // Se NON è paginato, chiediamo "limit: 0" per dire alla execute di NON tagliare nulla
        runtimeParams = { limit: 0 };
      }

      // 2. Esecuzione Chiamata
      const result = await this.executeUseCase.execute(configName, runtimeParams);
      const batchData = result.data as any[];

      if (batchData.length === 0) {
        hasMore = false;
        break;
      }

      // 3. Scrittura su File (Append)
      if (format === 'md') {
        // Scrive Header solo al primo giro
        if (isFirstBatch) {
          const header = this.formatService.getMarkdownHeader(batchData, config.selectedFields);
          fs.appendFileSync(filePath, `# Report: ${configName}\n\n${header}`);
        }
        const rows = this.formatService.toMarkdown(batchData, config.selectedFields);
        fs.appendFileSync(filePath, rows + "\n");
      
      } else if (format === 'json') {
        // Gestione virgola tra gli oggetti
        const prefix = isFirstBatch ? '' : ',';
        const jsonString = JSON.stringify(batchData);
        // Rimuove le quadre esterne [ ... ] per fondere i batch
        const content = jsonString.slice(1, -1); 
        
        if (content.length > 0) {
          fs.appendFileSync(filePath, prefix + content);
        }
      }

      totalDownloaded += batchData.length;
      console.log(`[Download] Scaricati ${batchData.length} record... (Totale: ${totalDownloaded})`);

      // 4. Logica di avanzamento / uscita
      if (isPaginated && pagConfig) {
        // Se abbiamo ricevuto meno dati del limite, l'API è finita
        if (batchData.length < pagConfig.defaultLimit) {
          hasMore = false;
        }
        pageIndex++;
        
        // Safety Break (opzionale)
        if (pageIndex > 500) break; 
      } else {
        // Non paginato = colpo singolo = fine
        hasMore = false;
      }

      isFirstBatch = false;
    }

    // --- CHIUSURA FILE ---
    if (format === 'json') {
      fs.appendFileSync(filePath, ']'); // Chiudi array JSON
    }

    console.log(`[Download] Completato. File: ${filePath}`);
    return filePath;
  }
}