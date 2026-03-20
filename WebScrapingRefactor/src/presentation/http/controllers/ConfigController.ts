import { FastifyRequest, FastifyReply } from "fastify";
import { ApiConfig } from "../../../domain/entities/ApiConfig";
import { ExecuteApiUseCase } from "../../../application/usecases/Api/ExecuteApiUseCase";
import { ResumeApiUseCase } from "../../../application/usecases/Api/ResumeApiUseCase";
import * as fs from "fs";

import { UpdateConfigUseCase } from "../../../application/usecases/Configs/UpdateConfigUseCase";
import { GetAllConfigsUseCase } from "../../../application/usecases/Configs/GetAllConfigsUseCase";
import { GetConfigByNameUseCase } from "../../../application/usecases/Configs/GetConfigByNameUseCase";
import { GetConfigByIdUseCase } from "../../../application/usecases/Configs/GetConfigByIdUseCase";
import { SaveConfigUseCase } from "../../../application/usecases/Configs/SaveConfigUseCase";
import { DeleteConfigUseCase } from "../../../application/usecases/Configs/DeleteConfigUseCase";

import { CreateAnalysisUseCase } from "../../../application/usecases/Analysis/CreateAnalysisUseCase";
import { GetAllAnalysesUseCase } from "../../../application/usecases/Analysis/GetAllAnalysisUseCase";
import { GetAllExecutionsUseCase } from "../../../application/usecases/Execution/GetAllExecutionsUseCase";
import {
  DownloadAllUseCase,
  ExportFormat,
} from "../../../application/usecases/Api/DownloadAllUseCase";
import { randomUUID } from "crypto";
import { DeleteExecutionUseCase } from "../../../application/usecases/Execution/DeleteExecutionUsecase";
import { GetAllExecutionsByConfigUseCase } from "../../../application/usecases/Execution/GetAllExecutionByConfigUseCase";

export class ConfigController {
  constructor(
    private updateConfigUseCase: UpdateConfigUseCase,
    private getAllConfigsUseCase: GetAllConfigsUseCase,
    private getConfigByNameUseCase: GetConfigByNameUseCase,
    private getConfigByIdUseCase: GetConfigByIdUseCase,
    private saveConfigUseCase: SaveConfigUseCase,
    private deleteConfigUseCase: DeleteConfigUseCase,
    private executeApiUseCase: ExecuteApiUseCase,
    private resumeApiUseCase: ResumeApiUseCase,
    private createAnalysisUseCase: CreateAnalysisUseCase,
    private getAllAnalysesUseCase: GetAllAnalysesUseCase,
    private getAllExecutionsUseCase: GetAllExecutionsUseCase,
    private getAllExecutionByconfigUsecase: GetAllExecutionsByConfigUseCase,
    private deleteExecutionUsecase: DeleteExecutionUseCase,
    private downloadAllUseCase: DownloadAllUseCase,
  ) {}

  // ── CONFIGS CRUD ───────────────────────────────────────────────────────────

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
    const config = { ...req.body, id: randomUUID() };
    await this.saveConfigUseCase.execute(config);
    return reply.status(201).send(config);
  };

  update = async (
    req: FastifyRequest<{ Params: { id: string }; Body: Partial<ApiConfig> }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;
    await this.updateConfigUseCase.execute(id, req.body);
    return reply.status(200).send({ message: "Configurazione aggiornata con successo" });
  };

  delete = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;
    await this.deleteConfigUseCase.execute(id);
    return reply.status(204).send();
  };

  // ── ANALYSIS ───────────────────────────────────────────────────────────────

  getAllAnalyses = async (_req: FastifyRequest, reply: FastifyReply) => {
    const analyses = await this.getAllAnalysesUseCase.execute();
    return reply.status(200).send(analyses);
  };

  analyze = async (
  request: FastifyRequest<{
    Body: { url: string; method: "GET" | "POST"; body?: unknown; headers?: Record<string, string> };
  }>,
  reply: FastifyReply,
) => {
  const { url, method, body, headers } = request.body;
  const result = await this.createAnalysisUseCase.execute(url, method, body, headers);
  const plainResult = JSON.parse(JSON.stringify(result));
  reply.status(200).send(plainResult);
  return;
};

  // ── EXECUTIONS ─────────────────────────────────────────────────────────────

  getAllExecutions = async (_req: FastifyRequest, reply: FastifyReply) => {
    const executions = await this.getAllExecutionsUseCase.execute();
    return reply.status(200).send(executions);
  };

  getExecutionsByConfig = async (
    req: FastifyRequest<{ Params: { configId: string } }>,
    reply: FastifyReply,
  ) => {
    const { configId } = req.params;
    const results = await this.getAllExecutionByconfigUsecase.execute(configId);
    return reply.status(200).send(results);
  };

  execute = async (
    request: FastifyRequest<{
      Params: { name: string };
      Body: Record<string, unknown>;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { name } = request.params;
      const runtimeParams = request.body;
      const result = await this.executeApiUseCase.execute(name, runtimeParams);
      return reply.status(200).send(result);
    } catch (error) {
      request.log.error(
        { err: error, params: request.params, body: request.body },
        "[ConfigController.execute] Errore durante execute",
      );
      throw error;
    }
  };

  /**
   * POST /executions/resume/:configId
   * Reads nextPageUrl from the last execution automatically and resumes from there.
   * Returns { alreadyComplete: true } if scraping is already finished.
   */
  resumeExecution = async (
    req: FastifyRequest<{ Params: { configId: string }; Body: { maxPages?: number } }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.resumeApiUseCase.execute(
        req.params.configId,
        req.body?.maxPages,
      );

      if (result.alreadyComplete) {
        return reply.status(200).send({
          message: "Scraping già completato",
          alreadyComplete: true,
          nextPageUrl: null,
        });
      }

      return reply.status(200).send(result);
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  };

  deleteExecution = async (
    req: FastifyRequest<{ Params: { configId: string; executionId: string } }>,
    reply: FastifyReply,
  ) => {
    const { executionId } = req.params;
    await this.deleteExecutionUsecase.execute(executionId);
    return reply.status(204).send();
  };

  // ── PATCH (legacy) ─────────────────────────────────────────────────────────

  patchSelectedFields = async (req: FastifyRequest<{ Params: { name: string }; Body: { selectedFields: string[] } }>, reply: FastifyReply) => {
    const { name } = req.params;
    const { selectedFields } = req.body;
    await this.updateConfigUseCase.execute(name, { selectedFields });
    return reply.status(200).send({ message: "selectedFields aggiornati" });
  };

  patchPagination = async (req: FastifyRequest<{ Params: { name: string }; Body: Record<string, unknown> }>, reply: FastifyReply) => {
    const { name } = req.params;
    await this.updateConfigUseCase.execute(name, req.body);
    return reply.status(200).send({ message: "Paginazione aggiornata" });
  };

  // ── DOWNLOAD ───────────────────────────────────────────────────────────────

  download = async (
    req: FastifyRequest<{
      Params: { configName: string };
      Querystring: { format?: ExportFormat };
    }>,
    reply: FastifyReply,
  ) => {
    const { configName } = req.params;
    const format = req.query.format || "json";

    try {
      const filePath = await this.downloadAllUseCase.execute(configName, format);

      const safeFileName = configName.replace(/[^a-zA-Z0-9-_]/g, "_");
      const extension    = format === "markdown" ? "md" : "json";
      const contentType  = format === "markdown" ? "text/markdown" : "application/json";

      reply.header("Content-Type", contentType);
      reply.header("Content-Disposition", `attachment; filename="${safeFileName}.${extension}"`);

      const stream = fs.createReadStream(filePath);

      stream.on("close", () => {
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
        message: (error as Error).message,
      });
    }
  };
}