import { IConfigRepository } from "../../../domain/ports/IConfigRepository";

export class DeleteConfigUseCase {
  constructor(private configRepo: IConfigRepository) {}

  async execute(name: string): Promise<void> {
    const existing = await this.configRepo.findByName(name);
    if (!existing) {
      throw new Error("Configurazione non trovata");
    }
    await this.configRepo.delete(name);
  }
}