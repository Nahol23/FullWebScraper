import { FastifyRequest, FastifyReply } from "fastify";
import { ApiConfig } from "../../../config/ApiConfigLoader";
import { ManageConfigUseCase } from "../../../application/usecases/ManageConfigUseCase";
import { AnalyzeApiUseCase } from "../../../application/usecases/AnalyzeApiUseCase";
import { ExecuteApiUseCase } from "../../../application/usecases/ExecuteApiUseCase";

export class ConfigController {
  constructor(
    private manageConfigUseCase: ManageConfigUseCase,
    private analyzeApiUseCase: AnalyzeApiUseCase,
    private executeApiUseCase: ExecuteApiUseCase
  ) {}

  getAll = async (_req: FastifyRequest, reply: FastifyReply) => {
    const configs = await this.manageConfigUseCase.getAllConfigs();
    return reply.send(configs);
  };

  getOne = async (
    req: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply
  ) => {
    const { name } = req.params;
    const config = await this.manageConfigUseCase.getConfigByName(name);
    if (!config) throw new Error("Configurazione non trovata");
    return reply.send(config);
  };

  upsert = async (
    req: FastifyRequest<{ Body: ApiConfig }>,
    reply: FastifyReply
  ) => {
    const config = req.body;
    await this.manageConfigUseCase.saveConfig(config);
    return reply.status(201).send(config);
  };

  delete = async (
    req: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply
  ) => {
    const { name } = req.params;
    await this.manageConfigUseCase.deleteConfig(name);
    return reply.status(204).send();
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
    request: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply
  ) => {
    const { name } = request.params;
    const result = await this.executeApiUseCase.execute(name);
    return reply.send(result);
  };
}