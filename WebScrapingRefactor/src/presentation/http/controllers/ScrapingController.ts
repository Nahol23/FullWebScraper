import { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import type { ExecuteScrapingUseCase } from "../../../application/usecases/Scraping/ExecuteScrapingUseCase";
import type { SaveScrapingConfigUseCase } from "../../../application/usecases/Scraping/SaveScrapingConfigUseCase";
import type { GetAllScrapingConfigsUseCase } from "../../../application/usecases/Scraping/GetAllScrapingConfigsUseCase";
import type { GetScrapingConfigByIdUseCase } from "../../../application/usecases/Scraping/GetScrapingConfigByIdUseCase";
import type { GetScrapingConfigByNameUseCase } from "../../../application/usecases/Scraping/GetScrapingConfigByNameUseCase";
import type { UpdateScrapingConfigUseCase } from "../../../application/usecases/Scraping/UpdateScrapingConfigUseCase";
import type { DeleteScrapingConfigUseCase } from "../../../application/usecases/Scraping/DeleteScrapingConfigUseCase";
import type { AnalyzeScrapingUseCase } from "../../../application/usecases/Scraping/AnalyzeScrapingUsecase";
import type {
  ScrapingConfig,
  ScrapingRuntimeParams,
} from "../../../domain/entities/ScrapingConfig";
import type { IScrapingExecutionRepository } from "../../../domain/ports/ScrapingConfig/IScrapingExecutionRepository";
import type { IScrapingAnalysisRepository } from "../../../domain/ports/ScrapingConfig/IScrapingAnalysisRepository";
import { ResumeScrapingUseCase } from "../../../application/usecases/Scraping/ResumeScrapingUseCase";

export interface ScrapingControllerDeps {
  executeScrapingUseCase: ExecuteScrapingUseCase;
  saveConfigUseCase: SaveScrapingConfigUseCase;
  getAllUseCase: GetAllScrapingConfigsUseCase;
  getByIdUseCase: GetScrapingConfigByIdUseCase;
  getByNameUseCase: GetScrapingConfigByNameUseCase;
  updateUseCase: UpdateScrapingConfigUseCase;
  deleteUseCase: DeleteScrapingConfigUseCase;
  analyzeUseCase: AnalyzeScrapingUseCase;
  executionRepo: IScrapingExecutionRepository;
  analysisRepo: IScrapingAnalysisRepository;
  resumeScrapingUseCase: ResumeScrapingUseCase;
}

export class ScrapingController {
  constructor(private readonly deps: ScrapingControllerDeps) {}

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIGS CRUD
  // ─────────────────────────────────────────────────────────────────────────

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
    const configToSave: ScrapingConfig = {
      ...req.body,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const saved = await this.deps.saveConfigUseCase.execute(configToSave);
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
    return reply
      .status(200)
      .send({ message: "Configurazione scraping aggiornata" });
  };

  delete = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    await this.deps.deleteUseCase.execute(req.params.id);
    return reply.status(204).send();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EXECUTIONS — full REST resource
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /scraping/executions
   * Returns all executions across every configuration.
   */
  getAllExecutions = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const executions = await this.deps.executionRepo.findAll();
      return reply.send(executions);
    } catch (error) {
      _req.log.error(error);
      return reply
        .status(500)
        .send({ error: "Errore nel recupero delle esecuzioni" });
    }
  };

  /**
   * GET /scraping/executions/:id
   * Returns a single execution by its own ID.
   */
  getExecutionById = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const execution = await this.deps.executionRepo.findById(req.params.id);
      if (!execution) {
        return reply.status(404).send({ error: "Esecuzione non trovata" });
      }
      return reply.send(execution);
    } catch (error) {
      req.log.error(error);
      return reply
        .status(500)
        .send({ error: "Errore nel recupero dell'esecuzione" });
    }
  };

  /**
   * POST /scraping/executions
   * Triggers a new execution. Body must include configId; optional runtimeParams.
   */
  createExecution = async (
    req: FastifyRequest<{ Body: { configId: string } & ScrapingRuntimeParams }>,
    reply: FastifyReply,
  ) => {
    try {
      const { configId, ...runtimeParams } = req.body;
      if (!configId) {
        return reply.status(400).send({ error: "configId is required" });
      }
      const result = await this.deps.executeScrapingUseCase.execute(
        configId,
        runtimeParams,
      );
      return reply.status(201).send(result);
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  };

  /**
   * GET /scraping/executions/by-name/:configName
   * Returns all executions for a config looked up by name.
   */
  getExecutionsByConfigName = async (
    req: FastifyRequest<{
      Params: { configName: string };
      Querystring: { limit?: number; offset?: number };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { configName } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const config = await this.deps.getByNameUseCase.execute(configName);
      if (!config) {
        return reply.status(404).send({ error: "Configurazione non trovata" });
      }

      const executions = await this.deps.executionRepo.findByConfigId(
        config.id,
        limit,
        offset,
      );
      return reply.send(executions);
    } catch (error) {
      req.log.error(error);
      return reply
        .status(500)
        .send({ error: "Errore nel recupero delle esecuzioni" });
    }
  };

  /**
   * GET /scraping/executions/by-config/:configId
   * Returns all executions for a config looked up by its ID.
   */
  getExecutionsByConfigId = async (
    req: FastifyRequest<{
      Params: { configId: string };
      Querystring: { limit?: number; offset?: number };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { configId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const config = await this.deps.getByIdUseCase.execute(configId);
      if (!config) {
        return reply.status(404).send({ error: "Configurazione non trovata" });
      }

      const executions = await this.deps.executionRepo.findByConfigId(
        configId,
        limit,
        offset,
      );
      return reply.send(executions);
    } catch (error) {
      req.log.error(error);
      return reply
        .status(500)
        .send({ error: "Errore nel recupero delle esecuzioni" });
    }
  };

  /**
   * DELETE /scraping/executions/:id
   * Deletes a single execution by its own ID (no configId needed in path).
   */
  deleteExecution = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      await this.deps.executionRepo.delete(req.params.id);
      return reply.status(204).send();
    } catch (error) {
      req.log.error(error);
      return reply
        .status(500)
        .send({ error: "Errore nell'eliminazione dell'esecuzione" });
    }
  };

  /**
   * POST /scraping/configs/:id/execute  (kept for backwards compat)
   */
  execute = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: ScrapingRuntimeParams;
    }>,
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

  /**
   * POST /scraping/configs/by-name/:configName/execute  (kept for backwards compat)
   */
  executeByName = async (
    req: FastifyRequest<{
      Params: { configName: string };
      Body: ScrapingRuntimeParams;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const config = await this.deps.getByNameUseCase.execute(
        req.params.configName,
      );
      if (!config) {
        return reply.status(404).send({ error: "Configurazione non trovata" });
      }
      const result = await this.deps.executeScrapingUseCase.execute(
        config.id,
        req.body,
      );
      return reply.send(result);
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  };
  resumeExecution = async (
    req: FastifyRequest<{
      Params: { configId: string };
      Body: { maxPages?: number };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await this.deps.resumeScrapingUseCase.execute(
        req.params.configId,
        req.body?.maxPages,
      );

      if (result.alreadyComplete) {
        // FIX: manda struttura completa — il frontend legge `data` e `nextPageUrl`
        return reply.status(200).send({
          alreadyComplete: true,
          data: [],
          nextPageUrl: null,
          meta: { pagesScraped: 0, totalItems: 0 },
        });
      }

      return reply.status(200).send(result);
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ANALYSES — full REST resource
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /scraping/analyses
   * Returns all stored analyses.
   */
  getAllAnalyses = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const analyses = await this.deps.analysisRepo.findAll();
      return reply.send(analyses);
    } catch (error) {
      _req.log.error(error);
      return reply
        .status(500)
        .send({ error: "Errore nel recupero delle analisi" });
    }
  };

  /**
   * GET /scraping/analyses/:id
   * Returns a single stored analysis by ID.
   */
  getAnalysisById = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const analysis = await this.deps.analysisRepo.findById(req.params.id);
      if (!analysis) {
        return reply.status(404).send({ error: "Analisi non trovata" });
      }
      return reply.send(analysis);
    } catch (error) {
      req.log.error(error);
      return reply
        .status(500)
        .send({ error: "Errore nel recupero dell'analisi" });
    }
  };

  /**
   * POST /scraping/analyses
   * Runs a new DOM analysis and persists it. Returns the analysis result.
   */
  createAnalysis = async (
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
      return reply.status(201).send(result);
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ error: (error as Error).message });
    }
  };

  /**
   * DELETE /scraping/analyses/:id
   */
  deleteAnalysis = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const existing = await this.deps.analysisRepo.findById(req.params.id);
      if (!existing) {
        return reply.status(404).send({ error: "Analisi non trovata" });
      }
      await this.deps.analysisRepo.delete(req.params.id);
      return reply.status(204).send();
    } catch (error) {
      req.log.error(error);
      return reply
        .status(500)
        .send({ error: "Errore nell'eliminazione dell'analisi" });
    }
  };

  /**
   * POST /scraping/configs/:id/analyze  (kept for backwards compat)
   */
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

  // ─────────────────────────────────────────────────────────────────────────
  // DOWNLOAD (kept for backwards compat)
  // ─────────────────────────────────────────────────────────────────────────

  downloadExecutions = async (
    request: FastifyRequest<{
      Params: { configName: string };
      Querystring: { format?: "json" | "markdown" };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { configName } = request.params;
      const format = request.query.format || "json";

      const config = await this.deps.getByNameUseCase.execute(configName);
      if (!config) {
        return reply.status(404).send({ error: "Configurazione non trovata" });
      }

      const executions = await this.deps.executionRepo.findByConfigId(
        config.id,
      );

      let content: string;
      let contentType: string;
      let filename: string;

      if (format === "json") {
        content = JSON.stringify(executions, null, 2);
        contentType = "application/json";
        filename = `${configName.replace(/[^a-zA-Z0-9-_]/g, "_")}_executions.json`;
      } else {
        content = this.generateMarkdown(executions, config);
        contentType = "text/markdown";
        filename = `${configName.replace(/[^a-zA-Z0-9-_]/g, "_")}_executions.md`;
      }

      reply.header("Content-Type", contentType);
      reply.header("Content-Disposition", `attachment; filename="${filename}"`);
      return reply.send(content);
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send({ error: "Errore nella generazione del file" });
    }
  };

  private generateMarkdown(executions: any[], config: any): string {
    let markdown = `# Scraping Executions: ${config.name}\n\n`;
    markdown += `- **URL**: ${config.url}\n`;
    markdown += `- **Total executions**: ${executions.length}\n`;
    markdown += `- **Generated**: ${new Date().toISOString()}\n\n`;

    if (executions.length === 0) {
      markdown += "No executions found.\n";
      return markdown;
    }

    executions.forEach((exec, index) => {
      markdown += `## Execution #${index + 1} (${exec.id})\n\n`;
      markdown += `- **Timestamp**: ${new Date(exec.timestamp).toLocaleString()}\n`;
      markdown += `- **Status**: ${exec.status}\n`;
      markdown += `- **Duration**: ${exec.duration || 0}ms\n`;
      markdown += `- **Records extracted**: ${exec.resultCount || 0}\n`;
      if (exec.errorMessage) {
        markdown += `- **Error**: ${exec.errorMessage}\n`;
      }
      markdown += `- **URL**: ${exec.url}\n\n`;

      if (exec.result) {
        markdown += "### Extracted Data\n\n";
        markdown += "```json\n";
        markdown += JSON.stringify(exec.result, null, 2).substring(0, 1000);
        if (JSON.stringify(exec.result).length > 1000) {
          markdown += "\n... (truncated)";
        }
        markdown += "\n```\n\n";
      }

      markdown += "---\n\n";
    });

    return markdown;
  }
}
