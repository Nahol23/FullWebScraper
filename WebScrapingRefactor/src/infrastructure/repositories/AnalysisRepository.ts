import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Analysis } from "../../domain/entities/Analysis";
import { IAnalysisRepository } from "../../domain/ports/Analyze/IAnalysisRepository";

export class AnalysisRepository implements IAnalysisRepository {
  private readonly storageDir = path.join(
    process.cwd(),
    "src",
    "config",
    "analyses",
  );

  constructor() {
    // Crea la cartella se non esiste
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async findAll(): Promise<Analysis[]> {
    const files = fs
      .readdirSync(this.storageDir)
      .filter((f) => f.endsWith(".json"));
    return files.map((file) => {
      const raw = fs.readFileSync(path.join(this.storageDir, file), "utf-8");
      return JSON.parse(raw);
    });
  }

  async findById(id: string): Promise<Analysis | null> {
    const filePath = path.join(this.storageDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  }

  async save(analysis: Analysis): Promise<void> {
    const id = analysis.id || randomUUID();
    const dataToSave = { ...analysis, id };

    const filePath = path.join(this.storageDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), "utf-8");
  }

  async delete(id: string): Promise<void> {
    const filePath = path.join(this.storageDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      throw new Error(`Analisi con ID ${id} non trovata`);
    }
  }
}
