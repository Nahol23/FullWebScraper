import { randomUUID } from "node:crypto";
import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { IConfigRepository } from "../../../domain/ports/IConfigRepository";
import { Execution } from "../../../domain/entities/Execution";
import { getNestedData } from "../../../infrastructure/utils/ObjectUtils";
import { IExecutionRepository } from "../../../domain/ports/Execution/IExecutionRepository";


export class RunExecutionUseCase {
  constructor(
    private readonly configRepo: IConfigRepository,
    private readonly apiPort: IApiPort,
    private readonly executionRepo: IExecutionRepository, 
  ) {}

  async execute(
    configId: string,
    runtimeParams?: Record<string, any>,
  ): Promise<{ execution: Execution; data: any[] }> {
    const config = await this.configRepo.findById(configId);
    if (!config) {
      throw new Error(`Configuration with ID ${configId} not found`);
    }

    try {
      const urlObj = new URL(`${config.baseUrl}${config.endpoint}`);

      config.queryParams?.forEach((p) =>
        urlObj.searchParams.append(p.key, p.value),
      );

      if (runtimeParams) {
        Object.entries(runtimeParams).forEach(([k, v]) =>
          urlObj.searchParams.set(k, String(v)),
        );
      }

      const responseData = await this.apiPort.request<any>({
        url: urlObj.toString(),
        method: config.method,
        body: config.body,
      });

      const data = getNestedData(responseData, config.dataPath);

      const execution: Execution = {
        id: randomUUID(),
        configId: config.id,
        timestamp: new Date(),
        parametersUsed: runtimeParams || {},
        resultCount: data.length,
        status: "success",
      };
      await this.executionRepo.save(execution);

      return { execution, data };
    } catch (error: any) {
      const executionError: Execution = {
        id: randomUUID(),
        configId: config.id,
        timestamp: new Date(),
        parametersUsed: runtimeParams || {},
        resultCount: 0,
        status: "error",
        errorMessage: error.message,
      };

      throw { execution: executionError, message: error.message };
    }
  }
}
