import { ScrapingConfigRepository } from "./../../../infrastructure/repositories/Scraping/ScrapingConfigRepository";
import { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import { ScrapingAdapter } from "../../../infrastructure/adapters/Scraping/ScrapingAdapter";
import { ExecuteScrapingUseCase } from "../../../application/usecases/Scraping/ExecuteScrapingUseCase";
import { SaveScrapingConfigUseCase } from "../../../application/usecases/Scraping/SaveScrapingConfigUseCase";
import { GetAllScrapingConfigsUseCase } from "../../../application/usecases/Scraping/GetAllScrapingConfigsUseCase";
import { GetScrapingConfigByIdUseCase } from "../../../application/usecases/Scraping/GetScrapingConfigByIdUseCase";
import { UpdateScrapingConfigUseCase } from "../../../application/usecases/Scraping/UpdateScrapingConfigUseCase";
import { DeleteScrapingConfigUseCase } from "../../../application/usecases/Scraping/DeleteScrapingConfigUseCase";
import { AnalyzeScrapingUseCase } from "../../../application/usecases/Scraping/AnalyzeScrapingUsecase";
import type { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";
import type { RuntimeParams } from "../../../domain/entities/ScrapingConfig";
import { ScrapingExecutionRepository } from '../../../infrastructure/repositories/Scraping/ScrapingExecutionRepository';
import { ScrapingAnalysisRepository} from '../../../infrastructure/repositories/Scraping/ScrapingAnalysisRepository';


export class ScrapingController {
  private executeScrapingUseCase: ExecuteScrapingUseCase;
  private saveConfigUseCase: SaveScrapingConfigUseCase;
  private getAllUseCase: GetAllScrapingConfigsUseCase;
  private getByIdUseCase: GetScrapingConfigByIdUseCase;
  private updateUseCase: UpdateScrapingConfigUseCase;
  private deleteUseCase: DeleteScrapingConfigUseCase;
  private analyzeUseCase: AnalyzeScrapingUseCase;

  constructor() {
    const repo = new ScrapingConfigRepository();
    const adapter = new ScrapingAdapter();
    const executionRepo = new ScrapingExecutionRepository(); 
    const analysisRepo = new ScrapingAnalysisRepository(); 
    this.executeScrapingUseCase = new ExecuteScrapingUseCase(
      repo,
      executionRepo,
      adapter,
    );
    this.saveConfigUseCase = new SaveScrapingConfigUseCase(repo);
    this.getAllUseCase = new GetAllScrapingConfigsUseCase(repo);
    this.getByIdUseCase = new GetScrapingConfigByIdUseCase(repo);
    this.updateUseCase = new UpdateScrapingConfigUseCase(repo);
    this.deleteUseCase = new DeleteScrapingConfigUseCase(repo);
    this.analyzeUseCase = new AnalyzeScrapingUseCase(adapter, analysisRepo);

  }

  getAll = async (_req: FastifyRequest, reply: FastifyReply) => {
    const configs = await this.getAllUseCase.execute();
    return reply.send(configs);
  };

  getById = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;
    const config = await this.getByIdUseCase.execute(id);
    if (!config) {
      return reply
        .status(404)
        .send({ error: "Configurazione scraping non trovata" });
    }
    return reply.send(config);
  };

  create = async (
    req: FastifyRequest<{
      Body: Omit<ScrapingConfig, "id" | "createdAt" | "updatedAt">;
    }>,
    reply: FastifyReply,
  ) => {
    const now = new Date();
    const configToSave = {
      ...req.body,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const saved = await this.saveConfigUseCase.execute(configToSave);
    return reply.status(201).send(saved);
  };

  update = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: Partial<ScrapingConfig>;
    }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;
    const updates = {
      ...req.body,
      updatedAt: new Date(),
    };
    await this.updateUseCase.execute(id, updates);
    return reply
      .status(200)
      .send({ message: "Configurazione scraping aggiornata" });
  };

  delete = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;
    await this.deleteUseCase.execute(id);
    return reply.status(204).send();
  };

  execute = async (
    req: FastifyRequest<{ Params: { id: string }; Body: RuntimeParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const { id } = req.params;
      const runtimeParams = req.body;
      const result = await this.executeScrapingUseCase.execute(
        id,
        runtimeParams,
      );
      return reply.send(result);
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  };

  analyze = async (
    req: FastifyRequest<{
      Body: {
        url: string;
        method?: "GET" | "POST";
        headers?: Record<string, string>;
        body?: any;
        useJavaScript?: boolean;
        waitForSelector?: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { url, method, headers, body, useJavaScript, waitForSelector } =
        req.body;
      const result = await this.analyzeUseCase.execute(url, {
        method,
        headers,
        body,
        useJavaScript,
        waitForSelector,
      });
      return reply.send(result);
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  };

  
  analyzeById = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: { useJavaScript?: boolean; waitForSelector?: string };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { id } = req.params;
      const { useJavaScript, waitForSelector } = req.body || {};

      const config = await this.getByIdUseCase.execute(id);
      if (!config) {
        return reply.status(404).send({ error: "Configurazione non trovata" });
      }

      const result = await this.analyzeUseCase.execute(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        useJavaScript,
        waitForSelector,
      });

      return reply.send(result);
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  };
}
