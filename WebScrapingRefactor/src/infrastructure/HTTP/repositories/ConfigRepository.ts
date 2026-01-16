import fs from "fs";
import path from "path";
import { ApiConfig } from "../../../domain/entities/ApiConfig";

export class ConfigRepository {
  private readonly configDir = path.join(process.cwd(), "src", "config");

  constructor() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  async findAll(): Promise<ApiConfig[]> {
    const files = fs
      .readdirSync(this.configDir)
      .filter((f) => f.endsWith(".json"));
    return files.map((file) => {
      const raw = fs.readFileSync(path.join(this.configDir, file), "utf-8");
      return JSON.parse(raw);
    });
  }

  async findByName(name: string): Promise<ApiConfig | null> {
    const filePath = path.join(this.configDir, `${name}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  async save(config: ApiConfig): Promise<void> {
    const filePath = path.join(this.configDir, `${config.name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
  }

  async delete(name: string): Promise<void> {
    const filePath = path.join(this.configDir, `${name}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}
