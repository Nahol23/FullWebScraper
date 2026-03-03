import { IScrapingConfigRepository } from './../../../domain/ports/ScrapingConfig/IScrapingConfigRepository';
import { ScrapingConfig } from './../../../domain/entities/ScrapingConfig';
import fs from 'fs';
import path from 'path';

export class ScrapingConfigRepository implements IScrapingConfigRepository {
  private readonly filePath = path.join(process.cwd(), 'src', 'config', 'scraping-configs.json');

  constructor() {
    // Assicuriamoci che la directory esista
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '[]');
    }
  }

  private async readFile(): Promise<ScrapingConfig[]> {
    const data = await fs.promises.readFile(this.filePath, 'utf-8');
    return JSON.parse(data);
  }

  private async writeFile(configs: ScrapingConfig[]): Promise<void> {
    await fs.promises.writeFile(this.filePath, JSON.stringify(configs, null, 2));
  }

  async getAll(): Promise<ScrapingConfig[]> {
    return this.readFile();
  }

  async getById(id: string): Promise<ScrapingConfig | null> {
    const configs = await this.readFile();
    return configs.find(c => c.id === id) || null;
  }

  async save(config: ScrapingConfig): Promise<ScrapingConfig> {
    const configs = await this.readFile();
    configs.push(config);
    await this.writeFile(configs);
    return config;
  }

  async update(id: string, updates: Partial<ScrapingConfig>): Promise<void> {
    const configs = await this.readFile();
    const index = configs.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Configurazione scraping non trovata');
    configs[index] = { ...configs[index], ...updates, updatedAt: new Date() };
    await this.writeFile(configs);
  }

  async delete(id: string): Promise<void> {
    let configs = await this.readFile();
    configs = configs.filter(c => c.id !== id);
    await this.writeFile(configs);
  }
}