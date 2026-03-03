import fs from 'fs';
import path from 'path';
import { IScrapingExecutionRepository } from '../../../domain/ports/ScrapingConfig/IScrapingExecutionRepository';
import { ScrapingExecution } from '../../../domain/entities/ScrapingExecution';


export class ScrapingExecutionRepository implements IScrapingExecutionRepository {
  private readonly storageDir = path.join(process.cwd(), 'src', 'config', 'scraping', 'executions');

  constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private getFilePath(id: string): string {
    return path.join(this.storageDir, `${id}.json`);
  }

  async save(execution: ScrapingExecution): Promise<void> {
    const filePath = this.getFilePath(execution.id);
    fs.writeFileSync(filePath, JSON.stringify(execution, null, 2), 'utf-8');
  }

  async findById(id: string): Promise<ScrapingExecution | null> {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async findByConfigId(configId: string): Promise<ScrapingExecution[]> {
    const all = await this.findAll();
    return all.filter(e => e.configId === configId);
  }

  async findAll(): Promise<ScrapingExecution[]> {
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