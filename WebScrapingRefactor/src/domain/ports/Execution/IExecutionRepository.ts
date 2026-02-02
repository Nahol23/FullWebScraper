import { Execution } from "../../entities/Execution";

export interface IExecutionRepository {
  findAll(): Promise<Execution[]>;
  findById(id: string): Promise<Execution | null>;
  findByConfigId(configId: string): Promise<Execution[]>;
  save(execution: Execution): Promise<void>;
  delete(id: string): Promise<void>;
}
