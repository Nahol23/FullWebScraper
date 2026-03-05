import { FastifyInstance } from "fastify";
import { ScrapingController } from "../controllers/ScrapingController";
import { PuppeteerBrowser } from "../../../infrastructure/adapters/Scraping/PuppeteerBrowser";
import { HttpFetcher } from "../../../infrastructure/adapters/Scraping/HttpFetcher";
import { JsBrowserFetcher } from "../../../infrastructure/adapters/Scraping/JsBrowserFetcher";
import { HtmlExtractor } from "../../../infrastructure/adapters/Scraping/HtmlExtractor";
import { ScrapingAdapter } from "../../../infrastructure/adapters/Scraping/ScrapingAdapter";
import { ScrapingAnalyzer } from "../../../infrastructure/utils/ScrapingAnalyzer";
import { ScrapingConfigRepository } from "../../../infrastructure/repositories/Scraping/ScrapingConfigRepository";
import { ScrapingExecutionRepository } from "../../../infrastructure/repositories/Scraping/ScrapingExecutionRepository";
import { ScrapingAnalysisRepository } from "../../../infrastructure/repositories/Scraping/ScrapingAnalysisRepository";
import { ExecuteScrapingUseCase } from "../../../application/usecases/Scraping/ExecuteScrapingUseCase";
import { SaveScrapingConfigUseCase } from "../../../application/usecases/Scraping/SaveScrapingConfigUseCase";
import { GetAllScrapingConfigsUseCase } from "../../../application/usecases/Scraping/GetAllScrapingConfigsUseCase";
import { GetScrapingConfigByIdUseCase } from "../../../application/usecases/Scraping/GetScrapingConfigByIdUseCase";
import { GetScrapingConfigByNameUseCase } from "../../../application/usecases/Scraping/GetScrapingConfigByNameUseCase";
import { UpdateScrapingConfigUseCase } from "../../../application/usecases/Scraping/UpdateScrapingConfigUseCase";
import { DeleteScrapingConfigUseCase } from "../../../application/usecases/Scraping/DeleteScrapingConfigUseCase";
import { AnalyzeScrapingUseCase } from "../../../application/usecases/Scraping/AnalyzeScrapingUsecase";

const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    message: { type: "string" },
  },
};

const idParamSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string" } },
};

const configIdParamSchema = {
  type: "object",
  required: ["configId"],
  properties: { configId: { type: "string" } },
};

const executionParamsSchema = {
  type: "object",
  required: ["configId", "executionId"],
  properties: {
    configId: { type: "string" },
    executionId: { type: "string" },
  },
};

const configNameParamSchema = {
  type: "object",
  required: ["configName"],
  properties: { configName: { type: "string" } },
};

const scrapingConfigBodySchema = {
  type: "object",
  required: ["name", "url", "rules"],
  properties: {
    name: { type: "string", examples: ["Wikipedia Scraper"] },
    url: { type: "string", examples: ["https://en.wikipedia.org/wiki/Web_scraping"] },
    method: { type: "string", enum: ["GET", "POST"], default: "GET" },
    headers: {
      type: "object",
      additionalProperties: { type: "string" },
      examples: [{ "User-Agent": "Mozilla/5.0" }],
    },
    body: { type: "object", additionalProperties: true },
    rules: {
      type: "array",
      items: {
        type: "object",
        required: ["fieldName", "selector"],
        properties: {
          fieldName: { type: "string" },
          selector: { type: "string" },
          attribute: {
            type: "string",
            enum: ["text", "html", "href", "src", "innerText"],
          },
          multiple: { type: "boolean" },
          transform: { type: "string" },
        },
      },
    },
    pagination: {
      type: "object",
      nullable: true,
      properties: {
        type: { type: "string", enum: ["nextSelector", "urlParam"] },
        selector: { type: "string" },
        paramName: { type: "string" },
        maxPages: { type: "number" },
      },
    },
    waitForSelector: { type: "string" },
    dataPath: { type: "string" },
    defaultRuntimeParams: { type: "object", additionalProperties: true },
  },
};

const updateBodySchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    url: { type: "string" },
    method: { type: "string", enum: ["GET", "POST"] },
    headers: { type: "object", additionalProperties: { type: "string" } },
    body: { type: "object", additionalProperties: true },
    rules: { type: "array", items: { type: "object" } },
    pagination: {
      type: "object",
      nullable: true,
      properties: {
        type: { type: "string", enum: ["nextSelector", "urlParam"] },
        selector: { type: "string" },
        paramName: { type: "string" },
        maxPages: { type: "number" },
      },
    },
    waitForSelector: { type: "string" },
    dataPath: { type: "string" },
    defaultRuntimeParams: { type: "object", additionalProperties: true },
  },
};

const executionQuerySchema = {
  type: "object",
  properties: {
    limit: { type: "number", default: 50 },
    offset: { type: "number", default: 0 },
  },
};

const downloadQuerySchema = {
  type: "object",
  properties: {
    format: { type: "string", enum: ["json", "markdown"], default: "json" },
  },
};

const executionResponseSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      configId: { type: "string" },
      timestamp: { type: "string", format: "date-time" },
      url: { type: "string" },
      rulesUsed: { type: "array" },
      result: { type: "object" },
      resultCount: { type: "number" },
      status: { type: "string", enum: ["success", "error"] },
      errorMessage: { type: "string" },
      duration: { type: "number" },
    },
  },
};

export async function scrapingRoutes(fastify: FastifyInstance) {
  // ── Composition root ──────────────────────────────────────────────────────
  const browser = new PuppeteerBrowser();
  const httpFetcher = new HttpFetcher();
  const jsBrowserFetcher = new JsBrowserFetcher(browser);

  // Per scraping con regole
  const scraper = new ScrapingAdapter(
    httpFetcher,
    jsBrowserFetcher,
    new HtmlExtractor(),
  );

  // Per analisi DOM — istanza separata, responsabilità separata
  const domAnalyzer = new ScrapingAnalyzer(httpFetcher, jsBrowserFetcher);

  const repo = new ScrapingConfigRepository();
  const executionRepo = new ScrapingExecutionRepository();
  const analysisRepo = new ScrapingAnalysisRepository();

  const controller = new ScrapingController({
    executeScrapingUseCase: new ExecuteScrapingUseCase(repo, executionRepo, scraper),
    saveConfigUseCase: new SaveScrapingConfigUseCase(repo),
    getAllUseCase: new GetAllScrapingConfigsUseCase(repo),
    getByIdUseCase: new GetScrapingConfigByIdUseCase(repo),
    getByNameUseCase: new GetScrapingConfigByNameUseCase(repo),
    updateUseCase: new UpdateScrapingConfigUseCase(repo),
    deleteUseCase: new DeleteScrapingConfigUseCase(repo),
    analyzeUseCase: new AnalyzeScrapingUseCase(scraper, domAnalyzer, analysisRepo),
    executionRepo,
  });

  // CRUD Configurazioni
  fastify.get("/scraping/configs", {
    schema: {
      summary: "List all scraping configurations",
      tags: ["Scraping"],
      response: {
        200: { type: "array", items: scrapingConfigBodySchema },
        500: errorResponseSchema,
      },
    },
  }, controller.getAll);

  fastify.get("/scraping/configs/:id", {
    schema: {
      summary: "Get scraping configuration by ID",
      tags: ["Scraping"],
      params: idParamSchema,
      response: {
        200: scrapingConfigBodySchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.getById);

  fastify.post("/scraping/configs", {
    schema: {
      summary: "Create new scraping configuration",
      tags: ["Scraping"],
      body: scrapingConfigBodySchema,
      response: {
        201: scrapingConfigBodySchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.create);

  fastify.put("/scraping/configs/:id", {
    schema: {
      summary: "Update scraping configuration",
      tags: ["Scraping"],
      params: idParamSchema,
      body: updateBodySchema,
      response: {
        200: { type: "object", properties: { message: { type: "string" } } },
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.update);

  fastify.delete("/scraping/configs/:id", {
    schema: {
      summary: "Delete scraping configuration",
      tags: ["Scraping"],
      params: idParamSchema,
      response: {
        204: { type: "null" },
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.delete);

  // Esecuzione
  fastify.post("/scraping/configs/:id/execute", {
    schema: {
      summary: "Execute scraping with given configuration and runtime parameters",
      tags: ["Scraping"],
      params: idParamSchema,
      body: {
        type: "object",
        additionalProperties: true,
        examples: [{ waitForSelector: ".content", maxPages: 3 }],
      },
      response: {
        200: { type: "object", additionalProperties: true },
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.execute);

  // Analisi generica
  fastify.post("/scraping/analyze", {
    schema: {
      summary: "Analyze a webpage and suggest extraction rules",
      tags: ["Scraping"],
      body: {
        type: "object",
        required: ["url"],
        properties: {
          url: { type: "string" },
          method: { type: "string", enum: ["GET", "POST"] },
          headers: { type: "object", additionalProperties: { type: "string" } },
          body: { type: "object", additionalProperties: true },
          useJavaScript: { type: "boolean" },
          waitForSelector: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            url: { type: "string" },
            title: { type: "string" },
            suggestedRules: { type: "array" },
            sampleData: { type: "object" },
            detectedListSelectors: { type: "array", items: { type: "string" } },
            rawPreview: { type: "string" },
          },
        },
        500: errorResponseSchema,
      },
    },
  }, controller.analyze);

  // Analisi da configurazione esistente
  fastify.post("/scraping/configs/:id/analyze", {
    schema: {
      summary: "Analyze a scraping configuration and suggest extraction rules",
      tags: ["Scraping"],
      params: idParamSchema,
      body: {
        type: "object",
        properties: {
          useJavaScript: { type: "boolean" },
          waitForSelector: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            url: { type: "string" },
            title: { type: "string" },
            suggestedRules: { type: "array" },
            sampleData: { type: "object" },
            detectedListSelectors: { type: "array", items: { type: "string" } },
            rawPreview: { type: "string" },
          },
        },
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.analyzeById);

  // ============================================
  // NUOVI ENDPOINTS PER LE ESECUZIONI
  // ============================================

  // GET /scraping/executions/:configId - Recupera tutte le esecuzioni di una configurazione
  fastify.get("/scraping/executions/:configId", {
    schema: {
      summary: "Get all executions for a scraping configuration",
      tags: ["Scraping"],
      params: configIdParamSchema,
      querystring: executionQuerySchema,
      response: {
        200: executionResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.getExecutionsByConfigId);

  // DELETE /scraping/executions/:configId/:executionId - Elimina una specifica esecuzione
  fastify.delete("/scraping/executions/:configId/:executionId", {
    schema: {
      summary: "Delete a specific scraping execution",
      tags: ["Scraping"],
      params: executionParamsSchema,
      response: {
        204: { type: "null", description: "Execution deleted successfully" },
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.deleteExecution);

  // GET /scraping/download/:configName - Scarica i log in formato JSON/Markdown
  fastify.get("/scraping/download/:configName", {
    schema: {
      summary: "Download all executions for a configuration as JSON or Markdown",
      tags: ["Scraping"],
      params: configNameParamSchema,
      querystring: downloadQuerySchema,
      response: {
        200: {
          description: "File scaricato con successo",
          type: "string",
          format: "binary",
        },
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.downloadExecutions);
}