import * as fs from 'fs';
import * as path from 'path';
import { ExecuteApiUseCase } from '../Api/ExecuteApiUseCase';
import { FormatDataService } from '../../services/FormatDataService';
import { IConfigRepository } from '../../../domain/ports/IConfigRepository';

export type ExportFormat = 'json' | 'markdown';

export class DownloadAllUseCase {
  private outputDir = path.join(process.cwd(), 'output', 'temp');

  constructor(
    private configRepo: IConfigRepository,
    private executeUseCase: ExecuteApiUseCase,
    private formatService: FormatDataService
  ) {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async execute(configName: string, format: ExportFormat = 'json'): Promise<string> {
    const config = await this.configRepo.findByName(configName);
    if (!config) throw new Error(`Configurazione "${configName}" non trovata`);

    // ✅ FIX 1: Mappiamo "markdown" su ".md" per avere un'estensione file standard
    const extension = format === 'markdown' ? 'md' : 'json';
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${configName.replace(/\s+/g, '_')}_${timestamp}.${extension}`;
    const filePath = path.join(this.outputDir, fileName);

    // --- SETUP FILE ---
    if (format === 'json') {
      fs.writeFileSync(filePath, '['); 
    } else {
      fs.writeFileSync(filePath, ''); 
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
      // 1. Costruzione Parametri
      let runtimeParams: Record<string, unknown> = {};

      if (isPaginated && pagConfig) {
        const paramValue = pagConfig.type === 'page' 
          ? pageIndex + 1 
          : pageIndex * pagConfig.defaultLimit;

        runtimeParams = {
          [pagConfig.paramName]: paramValue,
          limit: pagConfig.defaultLimit // Assicuriamo il limit
        };
      } else {
        runtimeParams = { limit: 0 };
      }

      // 2. Esecuzione
      const result = await this.executeUseCase.execute(configName, runtimeParams);
      const batchData = result.data as any[];

      if (!batchData || batchData.length === 0) {
        hasMore = false;
        break;
      }

      // 3. Scrittura su File
      if (format === 'markdown') {
        if (isFirstBatch) {
          // ✅ FIX 2: Passiamo solo il primo elemento (batchData[0]) per creare l'header
          const header = this.formatService.getMarkdownHeader(batchData[0], config.selectedFields);
          fs.appendFileSync(filePath, `# Report: ${configName}\n\n${header}\n`);
        }
        const rows = this.formatService.toMarkdown(batchData, config.selectedFields);
        fs.appendFileSync(filePath, rows + "\n");
      
      } else if (format === 'json') {
        const prefix = isFirstBatch ? '' : ',';
        const jsonString = JSON.stringify(batchData);
        const content = jsonString.slice(1, -1); 
        
        if (content.length > 0) {
          fs.appendFileSync(filePath, prefix + content);
        }
      }

      totalDownloaded += batchData.length;
      console.log(`[Download] Scaricati ${batchData.length} record... (Totale: ${totalDownloaded})`);

      // 4. Logica Loop
      if (isPaginated && pagConfig) {
        if (batchData.length < pagConfig.defaultLimit) {
          hasMore = false;
        }
        pageIndex++;
        if (pageIndex > 500) break; // Safety
      } else {
        hasMore = false;
      }

      isFirstBatch = false;
    }

    // --- CHIUSURA FILE ---
    if (format === 'json') {
      fs.appendFileSync(filePath, ']');
    }

    console.log(`[Download] Completato. File: ${filePath}`);
    return filePath;
  }
}