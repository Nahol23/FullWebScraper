import { AnalyzeApiUseCase } from './../../../application/usecases/Api/AnalyzeApiUseCase';
import { FastifyRequest, FastifyReply } from "fastify";
import { ApiConfig } from "../../../domain/entities/ApiConfig"; 
import { ExecuteApiUseCase } from '../../../application/usecases/Api/ExecuteApiUseCase';
import { UpdateConfigUseCase } from '../../../application/usecases/Configs/UpdateConfigUseCase';
import { GetAllConfigsUseCase } from '../../../application/usecases/Configs/GetAllConfigsUseCase';
import { GetConfigByNameUseCase } from '../../../application/usecases/Configs/GetConfigByNameUseCase';
import { GetConfigByIdUseCase } from '../../../application/usecases/Configs/GetConfigByIdUseCase';
import { SaveConfigUseCase } from '../../../application/usecases/Configs/SaveConfigUseCase';
import { DeleteConfigUseCase } from '../../../application/usecases/Configs/DeleteConfigUseCase';  

export class ConfigController {
  constructor(
    private updateConfigUseCase: UpdateConfigUseCase,
    private getAllConfigsUseCase: GetAllConfigsUseCase,
    private getConfigByNameUseCase: GetConfigByNameUseCase,
    private getConfigByIdUseCase: GetConfigByIdUseCase,
    private saveConfigUseCase: SaveConfigUseCase,
    private deleteConfigUseCase: DeleteConfigUseCase,
    private analyzeApiUseCase: AnalyzeApiUseCase,
    private executeApiUseCase: ExecuteApiUseCase
  ) {}

  getAll = async (_req: FastifyRequest, reply: FastifyReply) => {
    const configs = await this.getAllConfigsUseCase.execute();
    return reply.send(configs);
  };

  
  getById = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    const config = await this.getConfigByIdUseCase.execute(id);
    if (!config) return reply.status(404).send({ error: "Configurazione non trovata" });
    return reply.send(config);
  };

  // Recupero per nome (mantenuto per compatibilità)
  getOne = async (
    req: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply
  ) => {
    const { name } = req.params;
    const config = await this.getConfigByNameUseCase.execute(name);
    if (!config) return reply.status(404).send({ error: "Configurazione non trovata" });
    return reply.send(config);
  };

  create = async (
    req: FastifyRequest<{ Body: ApiConfig }>,
    reply: FastifyReply
  ) => {
    const config = req.body;
    // L'ID verrà generato automaticamente nel Repository se non fornito
    await this.saveConfigUseCase.execute(config);
    return reply.status(201).send(config);
  };

  // Aggiornato: Usa l'ID per identificare il file, ma permette di cambiare i dati (incluso il nome)
  update = async (
    req: FastifyRequest<{ Params: { id: string }; Body: Partial<ApiConfig> }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    const updates = req.body;
    await this.updateConfigUseCase.execute(id, updates);
    return reply.status(200).send({ message: "Configurazione aggiornata con successo" });
  };

  // Aggiornato: Usa l'ID per l'eliminazione sicura
  delete = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    await this.deleteConfigUseCase.execute(id);
    return reply.status(204).send();
  };

  
  execute = async (
    request: FastifyRequest<{ Params: { identifier: string }; Body: unknown }>,
    reply: FastifyReply
  ) => {
    const { identifier } = request.params;
    const runtimeParams = request.body as Record<string, any>| undefined; 
    const result = await this.executeApiUseCase.execute(identifier, runtimeParams);
    return reply.send(result);
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
}