import { ApiConfig } from "../../../domain/entities/ApiConfig";
import { IConfigRepository } from "../../../domain/ports/IConfigRepository";


export class SaveConfigUseCase{
constructor(private configRepo: IConfigRepository){}

async execute(config: ApiConfig): Promise<void>{
	if(!config.name)
		{
		 throw new Error("Nome obbligatorio")
		
		}
		await this.configRepo.save(config);
    }
}