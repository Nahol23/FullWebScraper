import { IConfigRepository } from "../../../domain/ports/IConfigRepository";

export class DeleteConfigUseCase {
  constructor(private configRepo: IConfigRepository) {}

  async execute(idOrname: string): Promise<void> {
    let config = await this.configRepo.findById(idOrname);
    if(!config){
      config = await this.configRepo.findByName(idOrname);
    }
    if (!config) {
      throw new Error("Configurazione non trovata");
    }
    await this.configRepo.delete(config.id);
  }
}