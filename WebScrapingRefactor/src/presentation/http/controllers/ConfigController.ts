import { FastifyRequest, FastifyReply } from "fastify";
import { ApiConfig } from "../../../domain/entities/ApiConfig";
import { ExecuteApiUseCase } from "../../../application/usecases/Api/ExecuteApiUseCase";
import * as fs from 'fs';

import { UpdateConfigUseCase } from "../../../application/usecases/Configs/UpdateConfigUseCase";
import { GetAllConfigsUseCase } from "../../../application/usecases/Configs/GetAllConfigsUseCase";
import { GetConfigByNameUseCase } from "../../../application/usecases/Configs/GetConfigByNameUseCase";
import { GetConfigByIdUseCase } from "../../../application/usecases/Configs/GetConfigByIdUseCase";
import { SaveConfigUseCase } from "../../../application/usecases/Configs/SaveConfigUseCase";
import { DeleteConfigUseCase } from "../../../application/usecases/Configs/DeleteConfigUseCase";

import { CreateAnalysisUseCase } from "../../../application/usecases/Analysis/CreateAnalysisUseCase";
import { GetAllAnalysesUseCase } from "../../../application/usecases/Analysis/GetAllAnalysisUseCase";
import { GetAllExecutionsUseCase } from "../../../application/usecases/Execution/GetAllExecutionsUseCase";
import { DownloadAllUseCase, ExportFormat } from "../../../application/usecases/Api/DownloadAllUseCase";
import { randomUUID } from "crypto";

export class ConfigController {
  constructor(
    private updateConfigUseCase: UpdateConfigUseCase,
    private getAllConfigsUseCase: GetAllConfigsUseCase,
    private getConfigByNameUseCase: GetConfigByNameUseCase,
    private getConfigByIdUseCase: GetConfigByIdUseCase,
    private saveConfigUseCase: SaveConfigUseCase,
    private deleteConfigUseCase: DeleteConfigUseCase,
    private executeApiUseCase: ExecuteApiUseCase,
    private createAnalysisUseCase: CreateAnalysisUseCase,
    private getAllAnalysesUseCase: GetAllAnalysesUseCase,
    private getAllExecutionsUseCase: GetAllExecutionsUseCase,
    private downloadAllUseCase: DownloadAllUseCase,
  ) {}

  getAll = async (_req: FastifyRequest, reply: FastifyReply) => {
    const configs = await this.getAllConfigsUseCase.execute();
    return reply.send(configs);
  };

  getById = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;
    const config = await this.getConfigByIdUseCase.execute(id);
    if (!config)
      return reply.status(404).send({ error: "Configurazione non trovata" });
    return reply.send(config);
  };

  // Recupero per nome (mantenuto per compatibilità)
  getOne = async (
    req: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply,
  ) => {
    const { name } = req.params;
    const config = await this.getConfigByNameUseCase.execute(name);
    if (!config)
      return reply.status(404).send({ error: "Configurazione non trovata" });
    return reply.send(config);
  };


  create = async (
    req: FastifyRequest<{ Body: ApiConfig }>,
    reply: FastifyReply,
  ) => {
    const config = {
      ...req.body,
      id: randomUUID(),
    };
    await this.saveConfigUseCase.execute(config);
    return reply.status(201).send(config);
  };

  update = async (
    req: FastifyRequest<{ Params: { id: string }; Body: Partial<ApiConfig> }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;
    //const updates = req.body;
    await this.updateConfigUseCase.execute(id, req.body);
    return reply
      .status(200)
      .send({ message: "Configurazione aggiornata con successo" });
  };

  delete = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;
    await this.deleteConfigUseCase.execute(id);
    return reply.status(204).send();
  };

  getAllAnalyses = async (request: FastifyRequest, reply: FastifyReply) => {
    const analyses = await this.getAllAnalysesUseCase.execute();
    return reply.status(200).send(analyses);
  };

  getAllExecutions = async (request: FastifyRequest, reply: FastifyReply) => {
    const executions = await this.getAllExecutionsUseCase.execute();
    return reply.status(200).send(executions);
  };
  patchSelectedFields = async (req: any, reply: any) => {
    const { name } = req.params;
    const { selectedFields } = req.body;

    await this.updateConfigUseCase.execute(name, { selectedFields });

    return reply.status(200).send({ message: "selectedFields aggiornati" });
  };

  patchPagination = async (req: any, reply: any) => {
    const { name } = req.params;
    const updates = req.body;

    await this.updateConfigUseCase.execute(name, updates);

    return reply.status(200).send({ message: "Paginazione aggiornata" });
  };

  analyze = async (
    request: FastifyRequest<{
      Body: { url: string; method: "GET" | "POST"; body?: any; headers?: any };
    }>,
    reply: FastifyReply,
  ) => {
    // console.log(
    //   "Body ricevuto dal Controller:",
    //   JSON.stringify(request.body, null, 2),
    // );
    const { url, method, body, headers } = request.body;
    const result = await this.createAnalysisUseCase.execute(
      url,
      method,
      body,
      headers,
    );
    return reply.status(200).send(result);
  };

  execute = async (
    request: FastifyRequest<{ Params: { name: string }; Body: Record<string, any> }>,
    reply: FastifyReply
  ) => {
    const { name } = request.params;
    const runtimeParams = request.body;
    const result = await this.executeApiUseCase.execute(name, runtimeParams);
    return reply.status(200).send(result);
  };


 download = async (
    req: FastifyRequest<{ Params: { configName: string }; Querystring: { format?: ExportFormat } }>,
    reply: FastifyReply
  ) => {
    const { configName } = req.params;
    const format = req.query.format || 'json';

    try {
      // 1. Qui riceviamo il PERCORSO (path) del file, non il contenuto
      const filePath = await this.downloadAllUseCase.execute(configName, format);


      const safeFileName = configName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const extension = format === 'markdown' ? 'md' : 'json';
      const contentType = format === 'markdown' ? 'text/markdown' : 'application/json';

      // 2. Impostiamo gli header corretti
      reply.header('Content-Type', contentType);
      reply.header('Content-Disposition', `attachment; filename="${safeFileName}.${extension}"`);

      
      const stream = fs.createReadStream(filePath);

      stream.on('close', () => {
        fs.unlink(filePath, (err) => {
          if (err) {
            req.log.error(`Errore cancellazione file temp ${filePath}: ${err.message}`);
          } else {
            req.log.info(`File temporaneo cancellato: ${filePath}`);
          }
        });
      });



      return reply.send(stream);

    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({
         error: "DownloadFailed", 
        message: (error as Error).message });
    }
  };
}
