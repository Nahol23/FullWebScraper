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
import { GetScrapingConfigByNameUseCase } from "../../../application/usecases/Scraping/GetScrapingConfigByNameUseCase";
import { IScrapingExecutionRepository } from "../../../domain/ports/ScrapingConfig/IScrapingExecutionRepository";

export interface ScrapingControllerDeps {
  executeScrapingUseCase: ExecuteScrapingUseCase;
  saveConfigUseCase: SaveScrapingConfigUseCase;
  getAllUseCase: GetAllScrapingConfigsUseCase;
  getByIdUseCase: GetScrapingConfigByIdUseCase;
  getByNameUseCase : GetScrapingConfigByNameUseCase;
  updateUseCase: UpdateScrapingConfigUseCase;
  deleteUseCase: DeleteScrapingConfigUseCase;
  analyzeUseCase: AnalyzeScrapingUseCase;
  executionRepo: IScrapingExecutionRepository;
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
    getExecutionsByConfigId = async (
    request: FastifyRequest<{
      Params: { configId: string };
      Querystring: { limit?: number; offset?: number };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { configId } = request.params;
      const { limit = 50, offset = 0 } = request.query;

      // Verifica che la configurazione esista
      const config = await this.deps.getByIdUseCase.execute(configId);
      if (!config) {
        return reply.status(404).send({ error: "Configurazione non trovata" });
      }

      const executions = await this.deps.executionRepo.findByConfigId(configId, limit, offset);
      return reply.send(executions);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Errore nel recupero delle esecuzioni" });
    }
  };

  // DELETE /scraping/executions/:configId/:executionId
  deleteExecution = async (
    request: FastifyRequest<{
      Params: { configId: string; executionId: string };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { executionId } = request.params;
      await this.deps.executionRepo.delete(executionId);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Errore nell'eliminazione dell'esecuzione" });
    }
  };

  // GET /scraping/download/:configName
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

      // Trova la configurazione per nome
      const config = await this.deps.getByNameUseCase.execute(configName);
      if (!config) {
        return reply.status(404).send({ error: "Configurazione non trovata" });
      }

      // Recupera tutte le esecuzioni
      const executions = await this.deps.executionRepo.findByConfigId(config.id);

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
      return reply.status(500).send({ error: "Errore nella generazione del file" });
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