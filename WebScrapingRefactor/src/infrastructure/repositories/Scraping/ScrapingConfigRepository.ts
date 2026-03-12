import fs from "fs";
import path from "path";
import { IScrapingConfigRepository } from "../../../domain/ports/ScrapingConfig/IScrapingConfigRepository";
import { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";

export class ScrapingConfigRepository implements IScrapingConfigRepository {
  private readonly storageDir = path.join(
    process.cwd(),
    "src",
    "config",
    "scraping",
    "configs",
  );

  constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private getFilePath(id: string): string {
    return path.join(this.storageDir, `${id}.json`);
  }

  /**
   * Reads a raw JSON file and guarantees the returned object always has
   * a populated `id` field.
   *
   * Old configs were saved before the controller started assigning a UUID,
   * so their filename IS their identifier (e.g. "HomeB.json" → id = "HomeB").
   * New configs already carry `id` inside the JSON — the filename is the UUID.
   *
   * Using the filename as fallback makes both cases work transparently.
   */
  private readConfig(file: string): ScrapingConfig {
    const data = fs.readFileSync(path.join(this.storageDir, file), "utf-8");
    const parsed: ScrapingConfig = JSON.parse(data);

    if (!parsed.id) {
      parsed.id = file.replace(".json", ""); // e.g. "HomeB"
    }

    return parsed;
  }

  async getAll(): Promise<ScrapingConfig[]> {
    const files = fs
      .readdirSync(this.storageDir)
      .filter((f) => f.endsWith(".json"));

    return files.map((file) => this.readConfig(file));
  }

  async getById(id: string): Promise<ScrapingConfig | null> {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) return null;

    const data = fs.readFileSync(filePath, "utf-8");
    const parsed: ScrapingConfig = JSON.parse(data);

    // Same guarantee: id is always populated
    if (!parsed.id) {
      parsed.id = id;
    }

    return parsed;
  }

  async getByName(name: string): Promise<ScrapingConfig | null> {
    const all = await this.getAll();
    return all.find((config) => config.name === name) ?? null;
  }

  async save(config: ScrapingConfig): Promise<ScrapingConfig> {
    const filePath = this.getFilePath(config.id);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
    return config;
  }

  async update(id: string, updates: Partial<ScrapingConfig>): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) throw new Error("Config not found");
    const updated = { ...existing, ...updates };
    await this.save(updated);
  }

  async delete(id: string): Promise<void> {
    const filePath = this.getFilePath(id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}