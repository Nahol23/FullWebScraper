
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
  
  const mergedParams: RuntimeParams = {
    dataPath: config.dataPath,
    headers: config.headers,
    body: config.body,
    selectedFields: config.selectedFields,
    ...runtimeParams,
    pagination: {
      offset: config.paginationSettings?.initialOffset || 0,
      limit: config.paginationSettings?.limitPerPage || 50,
      ...runtimeParams?.pagination,
    }
  };

  const result = await this.apiExecutionRepository.execute(config.id, mergedParams);
  
  console.log(" [UseCase] Parametri inviati:", mergedParams);
  console.log("[UseCase] Risultato:", result);

  return result;
}
}
