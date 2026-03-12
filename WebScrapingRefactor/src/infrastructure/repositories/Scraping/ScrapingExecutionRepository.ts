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

  async execute(configId: string, params?: any): Promise<any> {
    // This would be implemented to call the scraping adapter
    // For now, return a placeholder
    return { success: true, data: [] };
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

  async findAll(): Promise<ScrapingExecution[]> {
    const files = fs.readdirSync(this.storageDir).filter(f => f.endsWith('.json'));
    return files.map(file => {
      const data = fs.readFileSync(path.join(this.storageDir, file), 'utf-8');
      return JSON.parse(data);
    });
  }

  async findByConfigId(configId: string, limit: number = 50, offset: number = 0): Promise<ScrapingExecution[]> {
    const all = await this.findAll();
    return all
      .filter(e => e.configId === configId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit);
  }

  async delete(id: string): Promise<void> {
    const filePath = this.getFilePath(id);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  async downloadLogs(configName: string, format: string): Promise<Blob> {
    // This would be implemented to generate and return a blob
    // For now, return an empty blob
    return new Blob([]);
  }
}