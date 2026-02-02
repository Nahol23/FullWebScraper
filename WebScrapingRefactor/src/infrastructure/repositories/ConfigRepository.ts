import fs from "fs";
import path from "path";
import { ApiConfig } from "../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../domain/ports/IConfigRepository";
import { randomUUID } from "crypto";

export class ConfigRepository implements IConfigRepository {
  private readonly configDir = path.join(process.cwd(), "src", "config");

  constructor() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  async findAll(): Promise<ApiConfig[]> {
    const files = fs.readdirSync(this.configDir).filter((f) => f.endsWith(".json"));
    return files.map((file) => {
      const raw = fs.readFileSync(path.join(this.configDir, file), "utf-8");
      return JSON.parse(raw);
    });
  }

  async findById(id: string): Promise<ApiConfig | null> {
    const configs = await this.findAll();
    return configs.find((c) => c.id === id) || null;
  }

  async findByName(name: string): Promise<ApiConfig | null> {
    const filePath = path.join(this.configDir, `${name}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  async findById(id: string): Promise<ApiConfig | null> {
  const files = fs.readdirSync(this.configDir).filter(f => f.endsWith(".json"));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(this.configDir, file), "utf-8");
    const config = JSON.parse(raw);
    if (config.id === id) return config;
  }

  return null;
}

  async save(config: ApiConfig): Promise<void> {
    if (!config.id) config.id = randomUUID();
    
    const filePath = path.join(this.configDir, `${config.name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
  }

  async update(id: string, config: ApiConfig): Promise<void> {
    const configs = await this.findAll();
    const existingIndex = configs.findIndex(c => c.id === id);

    if (existingIndex === -1) {
      throw new Error(`Configurazione con ID ${id} non trovata`);
    }

    const oldConfig = configs[existingIndex];
    const updatedData = { ...config, id: id };

    if (oldConfig.name !== updatedData.name) {
      const oldPath = path.join(this.configDir, `${oldConfig.name}.json`);
      const newPath = path.join(this.configDir, `${updatedData.name}.json`);
      
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      
    }

    const filePath = path.join(this.configDir, `${updatedData.name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), "utf-8");
  }

  async delete(id: string): Promise<void> {
    const config = await this.findById(id);
    if (config) {
      const filePath = path.join(this.configDir, `${config.name}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}