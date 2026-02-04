import fs from "fs";
import path from "path";
import { ApiConfig } from "../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../domain/ports/IConfigRepository";
import { randomUUID } from "crypto";
import { createHash } from "crypto";

export class ConfigRepository implements IConfigRepository {
  private readonly configDir = path.join(process.cwd(), "src", "config");

  constructor() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }
  // private slugify(text: string): string {
  //   return text
  //     .toString()
  //     .toLowerCase()
  //     .trim()
  //     .replace(/\s+/g, "-")     
  //     .replace(/[^\w-]+/g, "")  
  //     .replace(/--+/g, "-");    
  // }
  private generateCodex(baseUrl: string, endpoint: string, method: string): string {
  const rawString = `${method.toUpperCase()}|${baseUrl.toLowerCase()}|${endpoint.toLowerCase()}`;
  return createHash("sha256")
    .update(rawString)
    .digest("hex")
    .substring(0, 5); 
}

  async findAll(): Promise<ApiConfig[]> {
    const files = fs.readdirSync(this.configDir).filter((f) => f.endsWith(".json"));
    return files.map((file) => {
      const raw = fs.readFileSync(path.join(this.configDir, file), "utf-8");
      return JSON.parse(raw);
    });
  }

  async findByName(name: string): Promise<ApiConfig | null> {
  const files = fs.readdirSync(this.configDir).filter(f => f.endsWith(".json"));
  
  for (const file of files) {
    const raw = fs.readFileSync(path.join(this.configDir, file), "utf-8");
    const config: ApiConfig = JSON.parse(raw);
    
    if (config.name === name) {
      return config;
    }
  }
  return null;
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

  const codex = this.generateCodex(config.baseUrl, config.endpoint, config.method);
  
  const fileName = `${codex}.json`;
  const filePath = path.join(this.configDir, fileName);
  
  //   // se il nome della config cambia il codex resta uguale
  // const files = fs.readdirSync(this.configDir).filter(f => f.startsWith(codex) && f.endsWith(".json"));
  // for (const oldFile of files) {
  //   const oldPath = path.join(this.configDir, oldFile);
  //   if (oldPath !== filePath) {
  //     fs.unlinkSync(oldPath); // rimuove la versione vecchia
  //   }
  // }

  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
}

 async update(id: string, config: ApiConfig): Promise<void> {
    const exists = await this.findById(id);
    if (!exists) {
      throw new Error(`Configurazione con ID ${id} non trovata`);
    }
    await this.save({ ...config, id });
  }

 async delete(id: string): Promise<void> {
    const files = fs.readdirSync(this.configDir).filter(f => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(this.configDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const config = JSON.parse(raw);

      // Cerchiamo il file che contiene l'ID corrispondente
      if (config.id === id) {
        fs.unlinkSync(filePath);
        return; 
      }
    }
    throw new Error(`Impossibile eliminare: configurazione con ID ${id} non trovata`);
  }
}