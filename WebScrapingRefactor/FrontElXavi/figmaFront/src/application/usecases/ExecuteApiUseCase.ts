
import type { RuntimeParams } from "../../domain/entities/RuntimeParams";
import type { IApiExecutionRepository } from "../../domain/ports/IApiExecutionRepository";
import type { IConfigRepository } from "../../domain/ports/IConfigRepository";

export class ExecuteApiUseCase {
  constructor(
    private readonly apiExecutionRepository: IApiExecutionRepository,
    private readonly configRepository: IConfigRepository,
  ) {}

  async execute(configId: string, runtimeParams?: RuntimeParams) {
    const config = await this.configRepository.getById(configId);
    
    if (!config) throw new Error("Configurazione non trovata");
    
    console.log("[UseCase] Config trovata:", config.name);
    console.log("[UseCase] dataPath (fisso):", config.dataPath);
    console.log("[UseCase] selectedFields (default):", config.selectedFields);
    
const mergedParams: RuntimeParams = {
  dataPath: config.dataPath,
  selectedFields: runtimeParams?.selectedFields || config.selectedFields || [],
  headers: { ...config.headers, ...runtimeParams?.headers },
  body: runtimeParams?.body || config.body,
  
  ...(config.queryParams && config.queryParams.length > 0 && {
    queryParams: config.queryParams.reduce((acc, param) => {
      if (param.key) acc[param.key] = param.value;
      return acc;
    }, {} as Record<string, string>)
  }),
  
  ...runtimeParams,
};

    delete mergedParams.dataPath;
    
    console.log("[UseCase] Parametri finali per il backend:", mergedParams);
    
    const result = await this.apiExecutionRepository.execute(config.id, mergedParams);
    
    console.log("[UseCase] Risultato:", result);

    return result;
  }
}
