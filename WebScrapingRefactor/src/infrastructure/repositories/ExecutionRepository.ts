import fs from "fs";
import path from "path";
import { Execution } from "../../domain/entities/Execution";
import { IExecutionRepository } from "../../domain/ports/Execution/IExecutionRepository";

export class ExecutionRepository implements IExecutionRepository {
  private readonly storageDir = path.join(process.cwd(), "src", "config", "executions");

  constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async findAll(): Promise<Execution[]> {
    const files = fs.readdirSync(this.storageDir).filter((f) => f.endsWith(".json"));
    return files.map((file) => JSON.parse(fs.readFileSync(path.join(this.storageDir, file), "utf-8")));
  }

  async findById(id: string): Promise<Execution | null> {
    const filePath = path.join(this.storageDir, `${id}.json`);
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : null;
  }

  async findByConfigId(configId: string): Promise<Execution[]> {
    const all = await this.findAll();
    return all.filter(e => e.configId === configId);
  }

  async save(execution: Execution): Promise<void> {
    const filePath = path.join(this.storageDir, `${execution.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(execution, null, 2), "utf-8");
  }

  async delete(id: string): Promise<void> {
    const filePath = path.join(this.storageDir, `${id}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}