import fs from 'fs';
import path from 'path';
import { IScrapingAnalysisRepository } from '../../../domain/ports/ScrapingConfig/IScrapingAnalysisRepository';
import { ScrapingAnalysis } from '../../../domain/entities/ScrapingAnalysis';


export class ScrapingAnalysisRepository implements IScrapingAnalysisRepository {
  private readonly storageDir = path.join(process.cwd(), 'src', 'config', 'scraping', 'analyses');

  constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private getFilePath(id: string): string {
    return path.join(this.storageDir, `${id}.json`);
  }

  async save(analysis: ScrapingAnalysis): Promise<void> {
    const filePath = this.getFilePath(analysis.id);
    fs.writeFileSync(filePath, JSON.stringify(analysis, null, 2), 'utf-8');
  }

  async findById(id: string): Promise<ScrapingAnalysis | null> {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async findAll(): Promise<ScrapingAnalysis[]> {
    const files = fs.readdirSync(this.storageDir).filter(f => f.endsWith('.json'));
    return files.map(file => {
      const data = fs.readFileSync(path.join(this.storageDir, file), 'utf-8');
      return JSON.parse(data);
    });
  }

  async delete(id: string): Promise<void> {
    const filePath = this.getFilePath(id);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}