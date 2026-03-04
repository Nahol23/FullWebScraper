import { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import type { ExecuteScrapingUseCase } from "../../../application/usecases/Scraping/ExecuteScrapingUseCase";
import type { SaveScrapingConfigUseCase } from "../../../application/usecases/Scraping/SaveScrapingConfigUseCase";
import type { GetAllScrapingConfigsUseCase } from "../../../application/usecases/Scraping/GetAllScrapingConfigsUseCase";
import type { GetScrapingConfigByIdUseCase } from "../../../application/usecases/Scraping/GetScrapingConfigByIdUseCase";
import type { UpdateScrapingConfigUseCase } from "../../../application/usecases/Scraping/UpdateScrapingConfigUseCase";
import type { DeleteScrapingConfigUseCase } from "../../../application/usecases/Scraping/DeleteScrapingConfigUseCase";
import type { AnalyzeScrapingUseCase } from "../../../application/usecases/Scraping/AnalyzeScrapingUsecase";
import type { ScrapingConfig, RuntimeParams } from "../../../domain/entities/ScrapingConfig";

export interface ScrapingControllerDeps {
  executeScrapingUseCase: ExecuteScrapingUseCase;
  saveConfigUseCase: SaveScrapingConfigUseCase;
  getAllUseCase: GetAllScrapingConfigsUseCase;
  getByIdUseCase: GetScrapingConfigByIdUseCase;
  updateUseCase: UpdateScrapingConfigUseCase;
  deleteUseCase: DeleteScrapingConfigUseCase;
  analyzeUseCase: AnalyzeScrapingUseCase;
}

/**
 * Responsabilità unica: tradurre HTTP request → use case → HTTP response.
 * Non conosce repository, adapter, Puppeteer, Cheerio o fetch.
 * Riceve le dipendenze già assemblate dal route file.
 */
export class ScrapingController {
  constructor(private readonly deps: ScrapingControllerDeps) {}

  getAll = async (_req: FastifyRequest, reply: FastifyReply) => {
    const configs = await this.deps.getAllUseCase.execute();
    return reply.send(configs);
  };

  getById = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const config = await this.deps.getByIdUseCase.execute(req.params.id);
    if (!config) {
      return reply.status(404).send({ error: "Configurazione scraping non trovata" });
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

     const configToSave: ScrapingConfig = {
    ...req.body,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
    const saved = await this.deps.saveConfigUseCase.execute(configToSave)
    return reply.status(201).send(saved);
  };

  update = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: Partial<ScrapingConfig>;
    }>,
    reply: FastifyReply,
  ) => {
    await this.deps.updateUseCase.execute(req.params.id, {
      ...req.body,
      updatedAt: new Date(),
    });
    return reply.status(200).send({ message: "Configurazione scraping aggiornata" });
  };

  delete = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    await this.deps.deleteUseCase.execute(req.params.id);
    return reply.status(204).send();
  };

  execute = async (
    req: FastifyRequest<{ Params: { id: string }; Body: RuntimeParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.deps.executeScrapingUseCase.execute(
        req.params.id,
        req.body,
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
      const { url, ...options } = req.body;
      const result = await this.deps.analyzeUseCase.execute(url, options);
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
      const config = await this.deps.getByIdUseCase.execute(req.params.id);
      if (!config) {
        return reply.status(404).send({ error: "Configurazione non trovata" });
      }
      const result = await this.deps.analyzeUseCase.execute(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        ...req.body,
      });
      return reply.send(result);
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  };
}