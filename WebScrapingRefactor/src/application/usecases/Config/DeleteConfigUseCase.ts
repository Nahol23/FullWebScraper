import { IConfigRepository } from "../../../domain/repositories/IConfigRepository";

export class DeleteConfigUseCase {
  constructor(private repository: IConfigRepository) {}

  async execute(name: string): Promise<void> {
    // Controlla se esiste
    const existing = await this.repository.findByName(name);
    if (!existing) {
      throw new Error(`Config with name "${name}" not found`);
    }

    await this.repository.delete(name);
  }
}