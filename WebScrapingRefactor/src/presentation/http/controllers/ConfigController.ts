import { AnalyzeApiUseCase } from './../../../application/usecases/Api/AnalyzeApiUseCase';
import { FastifyRequest, FastifyReply } from "fastify";
import { ApiConfig } from "../../../config/ApiConfigLoader";
import { ManageConfigUseCase } from "../../../application/usecases/Configs/ManageConfigUseCase";
import { ExecuteApiUseCase } from '../../../application/usecases/Api/ExecuteApiUseCase';
import { UpdateConfigUseCase } from '../../../application/usecases/Configs/UpdateConfigUseCase';
import { GetAllConfigsUseCase } from '../../../application/usecases/Configs/GetAllConfigsUseCase';
import { GetConfigByNameUseCase } from '../../../application/usecases/Configs/GetConfigByNameUseCase';
import { SaveConfigUseCase } from '../../../application/usecases/Configs/SaveConfigUseCase';
import { DeleteConfigUseCase } from '../../../application/usecases/Configs/DeleteConfigUseCase';  


export class ConfigController {
  constructor(
  
    private updateConfigUseCase: UpdateConfigUseCase,
    private getAllConfigsUseCase: GetAllConfigsUseCase,
    private getConfigByNameUseCase: GetConfigByNameUseCase,
    private saveConfigUseCase: SaveConfigUseCase,
    private deleteConfigUseCase: DeleteConfigUseCase,
    private analyzeApiUseCase: AnalyzeApiUseCase,
    private executeApiUseCase: ExecuteApiUseCase
  ) {}

  getAll = async (_req: FastifyRequest, reply: FastifyReply) => {
    const configs = await this.getAllConfigsUseCase.execute();
    return reply.send(configs);
  };

  getOne = async (
    req: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply
  ) => {
    const { name } = req.params;
    const config = await this.getConfigByNameUseCase.execute(name);
    if (!config) throw new Error("Configurazione non trovata");
    return reply.send(config);
  };

  create = async (
    req: FastifyRequest<{ Body: ApiConfig }>,
    reply: FastifyReply
  ) => {
    const config = req.body;
    await this.saveConfigUseCase.execute(config);
    return reply.status(201).send(config);
  };

  delete = async (
    req: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply
  ) => {
    const { name } = req.params;
    await this.deleteConfigUseCase.execute(name);
    return reply.status(204).send();
  };

  update = async (
    req: FastifyRequest<{ Params: { name: string }; Body: Partial<ApiConfig> }>,
    reply: FastifyReply
  ) => {
    const { name } = req.params;
    const updates = req.body;
    await this.updateConfigUseCase.execute(name, updates);
    return reply.status(200).send({ message: "Configurazione aggiornata" });
  };
  patchSelectedFields = async (req : any, reply : any) => {
  const { name } = req.params;
  const { selectedFields } = req.body;

  await this.updateConfigUseCase.execute(name, { selectedFields });

  return reply.status(200).send({ message: "selectedFields aggiornati" });
};

patchPagination = async (req : any, reply : any) => {
  const { name } = req.params;
  const updates = req.body;

  await this.updateConfigUseCase.execute(name, updates);

  return reply.status(200).send({ message: "Paginazione aggiornata" });
};

  analyze = async (
    request: FastifyRequest<{
      Body: { url: string; method: string; body?: any };
    }>,
    reply: FastifyReply
  ) => {
    const { url, method, body } = request.body;
    const result = await this.analyzeApiUseCase.analyze(url, method as "GET" | "POST", body);
    return reply.send(result);
  };

  execute = async (
    request: FastifyRequest<{ Params: { name: string }, Body: Record<string, any> }>,
    reply: FastifyReply
  ) => {
    const { name } = request.params;
    const runtimeParams = request.body;
    const result = await this.executeApiUseCase.execute(name, runtimeParams);
    return reply.send(result);
  };
}