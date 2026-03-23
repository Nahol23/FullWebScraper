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
import { ResumeScrapingUseCase } from "../../../application/usecases/Scraping/ResumeScrapingUseCase";
import { SaveScrapingConfigUseCase } from "../../../application/usecases/Scraping/SaveScrapingConfigUseCase";
import { GetAllScrapingConfigsUseCase } from "../../../application/usecases/Scraping/GetAllScrapingConfigsUseCase";
import { GetScrapingConfigByIdUseCase } from "../../../application/usecases/Scraping/GetScrapingConfigByIdUseCase";
import { GetScrapingConfigByNameUseCase } from "../../../application/usecases/Scraping/GetScrapingConfigByNameUseCase";
import { UpdateScrapingConfigUseCase } from "../../../application/usecases/Scraping/UpdateScrapingConfigUseCase";
import { DeleteScrapingConfigUseCase } from "../../../application/usecases/Scraping/DeleteScrapingConfigUseCase";
import { AnalyzeScrapingUseCase } from "../../../application/usecases/Scraping/AnalyzeScrapingUsecase";

// ── Shared error/param schemas ───────────────────────────────────────────────

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

const configNameParamSchema = {
  type: "object",
  required: ["configName"],
  properties: { configName: { type: "string" } },
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

// ── Config schemas ───────────────────────────────────────────────────────────

const paginationSchema = {
  type: "object",
  nullable: true,
  description: "Pagination configuration. After each run check nextPageUrl in the response to resume.",
  properties: {
    type:      { type: "string", enum: ["nextSelector", "urlParam"] },
    selector:  { type: "string", description: "nextSelector: CSS selector of the 'next' link" },
    paramName: { type: "string", description: "urlParam: query param name (e.g. 'page')" },
    maxPages:  { type: "number", description: "Max pages to scrape per run (default 10)" },
  },
};

const scrapingConfigBodySchema = {
  type: "object",
  required: ["name", "url", "rules"],
  properties: {
    id:     { type: "string" },
    name:   { type: "string", examples: ["Wikipedia Scraper"] },
    url:    { type: "string", examples: ["https://en.wikipedia.org/wiki/Web_scraping"] },
    method: { type: "string", enum: ["GET", "POST"], default: "GET" },
    headers: {
      type: "object",
      additionalProperties: { type: "string" },
    },
    body: { type: "object", additionalProperties: true },
    rules: {
      type: "array",
      items: {
        type: "object",
        required: ["fieldName", "selector"],
        properties: {
          fieldName: { type: "string" },
          selector:  { type: "string" },
          attribute: {
            type: "string",
            enum: ["text", "html", "href", "src", "innerText"],
          },
          multiple:  { type: "boolean" },
          transform: { type: "string" },
        },
      },
    },
    pagination:           paginationSchema,
    waitForSelector:      { type: "string" },
    dataPath:             { type: "string" },
    defaultRuntimeParams: { type: "object", additionalProperties: true },
  },
};

const updateBodySchema = {
  type: "object",
  properties: {
    name:    { type: "string" },
    url:     { type: "string" },
    method:  { type: "string", enum: ["GET", "POST"] },
    headers: { type: "object", additionalProperties: { type: "string" } },
    body:    { type: "object", additionalProperties: true },
    rules:   { type: "array", items: { type: "object" } },
    pagination:           paginationSchema,
    waitForSelector:      { type: "string" },
    dataPath:             { type: "string" },
    defaultRuntimeParams: { type: "object", additionalProperties: true },
  },
};

// ── Runtime params schema ────────────────────────────────────────────────────

const runtimeParamsSchema = {
  type: "object",
  properties: {
    maxPages: {
      type: "number",
      description: "How many pages to scrape in this run (default 10)",
    },
    waitForSelector:   { type: "string" },
    containerSelector: { type: "string" },
    rules: { type: "array", items: { type: "object" } },
    startPage: {
      type: "number",
      description:
        "urlParam resume: page number to start from. " +
        "Pass the value returned in nextPageUrl from the previous run.",
    },
    resumeFromUrl: {
      type: "string",
      description:
        "nextSelector resume: exact URL to resume from. " +
        "Pass the nextPageUrl string returned by the previous run.",
    },
  },
};

// ── Result schemas ───────────────────────────────────────────────────────────

const executeResultSchema = {
  type: "object",
  properties: {
    data: {
      type: "array",
      items: { type: "object", additionalProperties: true },
    },
    nextPageUrl: {
      type: ["string", "null"],
      description:
        "null = scraping complete. " +
        "String = URL to pass as startPage or resumeFromUrl in the next run, " +
        "or just call POST /scraping/executions/resume/:configId.",
    },
    meta: {
      type: "object",
      properties: {
        pagesScraped: { type: "number", description: "Pages scraped in this run" },
        totalItems:   { type: "number", description: "Total items collected in this run" },
      },
    },
  },
};

const resumeResultSchema = {
  type: "object",
  properties: {
    alreadyComplete: {
      type: "boolean",
      description: "true = scraping was already complete, no new pages fetched",
    },
    data: {
      type: "array",
      items: { type: "object", additionalProperties: true },
    },
    nextPageUrl: {
      type: ["string", "null"],
      description: "null = scraping now complete",
    },
    meta: {
      type: "object",
      properties: {
        pagesScraped: { type: "number" },
        totalItems:   { type: "number" },
      },
    },
    message: { type: "string" },
  },
};

// ── Execution resource schemas ───────────────────────────────────────────────

const executionItemSchema = {
  type: "object",
  properties: {
    id:           { type: "string" },
    configId:     { type: "string" },
    timestamp:    { type: "string", format: "date-time" },
    url:          { type: "string" },
    rulesUsed:    { type: "array" },
    result:       { type: "object", additionalProperties: true },
    resultCount:  { type: "number" },
    status:       { type: "string", enum: ["success", "error"] },
    errorMessage: { type: "string" },
    duration:     { type: "number" },
    nextPageUrl: {
      type: ["string", "null"],
      description:
        "null = scraping was complete. " +
        "String = pass this as startPage or resumeFromUrl to resume.",
    },
    pagesScraped: {
      type: "number",
      description: "Number of pages scraped in this execution",
    },
  },
};

const executionListSchema = { type: "array", items: executionItemSchema };

// ── Analysis resource schemas ────────────────────────────────────────────────

const analysisItemSchema = {
  type: "object",
  properties: {
    id:           { type: "string" },
    url:          { type: "string" },
    timestamp:    { type: "string", format: "date-time" },
    options:      { type: "object", additionalProperties: true },
    result:       { type: "object", additionalProperties: true },
    status:       { type: "string", enum: ["completed", "failed"] },
    errorMessage: { type: "string" },
  },
};

const analysisListSchema = { type: "array", items: analysisItemSchema };

const analyzeBodySchema = {
  type: "object",
  required: ["url"],
  properties: {
    url:             { type: "string" },
    method:          { type: "string", enum: ["GET", "POST"] },
    headers:         { type: "object", additionalProperties: { type: "string" } },
    body:            { type: "object", additionalProperties: true },
    useJavaScript:   { type: "boolean" },
    waitForSelector: { type: "string" },
  },
};

const analysisResultSchema = {
  type: "object",
  properties: {
    url:                   { type: "string" },
    title:                 { type: "string" },
    suggestedRules:        { type: "array" },
    sampleData:            { type: "object", additionalProperties: true },
    detectedListSelectors: { type: "array", items: { type: "string" } },
    rawPreview:            { type: "string" },
  },
};

// ── Route registration ───────────────────────────────────────────────────────

export async function scrapingRoutes(fastify: FastifyInstance) {
  // Composition root
  const browser          = new PuppeteerBrowser();
  const httpFetcher      = new HttpFetcher();
  const jsBrowserFetcher = new JsBrowserFetcher(browser);

  const scraper     = new ScrapingAdapter(httpFetcher, jsBrowserFetcher, new HtmlExtractor());
  const domAnalyzer = new ScrapingAnalyzer(httpFetcher, jsBrowserFetcher);

  const repo          = new ScrapingConfigRepository();
  const executionRepo = new ScrapingExecutionRepository();
  const analysisRepo  = new ScrapingAnalysisRepository();

  // Extracted so ResumeScrapingUseCase can reuse the same instance
  const executeUseCase = new ExecuteScrapingUseCase(repo, executionRepo, scraper);

  const controller = new ScrapingController({
    executeScrapingUseCase: executeUseCase,
    resumeScrapingUseCase:  new ResumeScrapingUseCase(repo, executionRepo, executeUseCase),
    saveConfigUseCase:      new SaveScrapingConfigUseCase(repo),
    getAllUseCase:           new GetAllScrapingConfigsUseCase(repo),
    getByIdUseCase:         new GetScrapingConfigByIdUseCase(repo),
    getByNameUseCase:       new GetScrapingConfigByNameUseCase(repo),
    updateUseCase:          new UpdateScrapingConfigUseCase(repo),
    deleteUseCase:          new DeleteScrapingConfigUseCase(repo),
    analyzeUseCase:         new AnalyzeScrapingUseCase(scraper, domAnalyzer, analysisRepo),
    executionRepo,
    analysisRepo,
  });

  // ── CONFIGS ────────────────────────────────────────────────────────────────

  fastify.get(
    "/scraping/configs",
    {
      schema: {
        summary: "List all scraping configurations",
        tags: ["Scraping - Configs"],
        response: {
          200: { type: "array", items: scrapingConfigBodySchema },
          500: errorResponseSchema,
        },
      },
    },
    controller.getAll,
  );

  fastify.get(
    "/scraping/configs/:id",
    {
      schema: {
        summary: "Get scraping configuration by ID",
        tags: ["Scraping - Configs"],
        params: idParamSchema,
        response: {
          200: scrapingConfigBodySchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.getById,
  );

  fastify.post(
    "/scraping/configs",
    {
      schema: {
        summary: "Create new scraping configuration",
        tags: ["Scraping - Configs"],
        body: scrapingConfigBodySchema,
        response: {
          201: scrapingConfigBodySchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.create,
  );

  fastify.put(
    "/scraping/configs/:id",
    {
      schema: {
        summary: "Update scraping configuration",
        tags: ["Scraping - Configs"],
        params: idParamSchema,
        body: updateBodySchema,
        response: {
          200: { type: "object", properties: { message: { type: "string" } } },
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.update,
  );

  fastify.delete(
    "/scraping/configs/:id",
    {
      schema: {
        summary: "Delete scraping configuration",
        tags: ["Scraping - Configs"],
        params: idParamSchema,
        response: {
          204: { type: "null" },
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.delete,
  );

  fastify.post(
    "/scraping/configs/:id/execute",
    {
      schema: {
        summary: "Execute scraping by config ID",
        description:
          "Run a scraping execution. Pass startPage or resumeFromUrl to resume a previous paginated run.",
        tags: ["Scraping - Configs"],
        params: idParamSchema,
        body: runtimeParamsSchema,
        response: {
          200: executeResultSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.execute,
  );

  fastify.post(
    "/scraping/configs/by-name/:configName/execute",
    {
      schema: {
        summary: "Execute scraping by config name",
        description:
          "Run a scraping execution. Pass startPage or resumeFromUrl to resume a previous paginated run.",
        tags: ["Scraping - Configs"],
        params: configNameParamSchema,
        body: runtimeParamsSchema,
        response: {
          200: executeResultSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.executeByName,
  );

  fastify.post(
    "/scraping/configs/:id/analyze",
    {
      schema: {
        summary: "Analyze a config's URL (shortcut)",
        tags: ["Scraping - Configs"],
        params: idParamSchema,
        body: {
          type: "object",
          properties: {
            useJavaScript:   { type: "boolean" },
            waitForSelector: { type: "string" },
          },
        },
        response: {
          200: analysisResultSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.analyzeById,
  );

  // ── EXECUTIONS ─────────────────────────────────────────────────────────────

  fastify.get(
    "/scraping/executions",
    {
      schema: {
        summary: "List all executions across all configurations",
        tags: ["Scraping - Executions"],
        response: { 200: executionListSchema, 500: errorResponseSchema },
      },
    },
    controller.getAllExecutions,
  );

  fastify.post(
    "/scraping/executions",
    {
      schema: {
        summary: "Trigger a new scraping execution",
        description:
          "Run a scraping execution. " +
          "When nextPageUrl is not null call POST /scraping/executions/resume/:configId " +
          "to continue automatically, or pass startPage/resumeFromUrl manually.",
        tags: ["Scraping - Executions"],
        body: {
          type: "object",
          required: ["configId"],
          properties: {
            configId:          { type: "string", description: "ID of the scraping config to run" },
            maxPages:          runtimeParamsSchema.properties.maxPages,
            waitForSelector:   runtimeParamsSchema.properties.waitForSelector,
            containerSelector: runtimeParamsSchema.properties.containerSelector,
            rules:             runtimeParamsSchema.properties.rules,
            startPage:         runtimeParamsSchema.properties.startPage,
            resumeFromUrl:     runtimeParamsSchema.properties.resumeFromUrl,
          },
        },
        response: {
          201: executeResultSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.createExecution,
  );

  // NOTE: static sub-paths before parameterised routes to avoid Fastify conflicts

  fastify.post(
    "/scraping/executions/resume/:configId",
    {
      schema: {
        summary: "Resume scraping from where the last execution stopped",
        description:
          "Automatically reads nextPageUrl from the last execution — no need to pass it manually. " +
          "Call this repeatedly until alreadyComplete is true or nextPageUrl is null.",
        tags: ["Scraping - Executions"],
        params: configIdParamSchema,
        body: {
          type: "object",
          properties: {
            maxPages: {
              type: "number",
              description: "Pages to scrape in this run (default 10)",
            },
          },
        },
        response: {
          200: resumeResultSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.resumeExecution,
  );

  fastify.get(
    "/scraping/executions/by-name/:configName",
    {
      schema: {
        summary: "List executions by configuration name",
        tags: ["Scraping - Executions"],
        params: configNameParamSchema,
        querystring: executionQuerySchema,
        response: {
          200: executionListSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.getExecutionsByConfigName,
  );

  fastify.get(
    "/scraping/executions/by-config/:configId",
    {
      schema: {
        summary: "List executions by configuration ID",
        tags: ["Scraping - Executions"],
        params: configIdParamSchema,
        querystring: executionQuerySchema,
        response: {
          200: executionListSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.getExecutionsByConfigId,
  );

  fastify.get(
    "/scraping/executions/:id",
    {
      schema: {
        summary: "Get a single execution by its ID",
        tags: ["Scraping - Executions"],
        params: idParamSchema,
        response: {
          200: executionItemSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.getExecutionById,
  );

  fastify.delete(
    "/scraping/executions/:id",
    {
      schema: {
        summary: "Delete a single execution by its ID",
        tags: ["Scraping - Executions"],
        params: idParamSchema,
        response: {
          204: { type: "null" },
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.deleteExecution,
  );

  // ── ANALYSES ───────────────────────────────────────────────────────────────

  fastify.get(
    "/scraping/analyses",
    {
      schema: {
        summary: "List all stored DOM analyses",
        tags: ["Scraping - Analyses"],
        response: { 200: analysisListSchema, 500: errorResponseSchema },
      },
    },
    controller.getAllAnalyses,
  );

  fastify.post(
    "/scraping/analyses",
    {
      schema: {
        summary: "Run a new DOM analysis and store the result",
        tags: ["Scraping - Analyses"],
        body: analyzeBodySchema,
        response: {
          201: analysisResultSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.createAnalysis,
  );

  fastify.get(
    "/scraping/analyses/:id",
    {
      schema: {
        summary: "Get a single stored analysis by ID",
        tags: ["Scraping - Analyses"],
        params: idParamSchema,
        response: {
          200: analysisItemSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.getAnalysisById,
  );

  fastify.delete(
    "/scraping/analyses/:id",
    {
      schema: {
        summary: "Delete a stored analysis by ID",
        tags: ["Scraping - Analyses"],
        params: idParamSchema,
        response: {
          204: { type: "null" },
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.deleteAnalysis,
  );

  // ── DOWNLOAD ───────────────────────────────────────────────────────────────

  fastify.get(
    "/scraping/download/:configName",
    {
      schema: {
        summary: "Download all executions for a config as JSON or Markdown",
        tags: ["Scraping - Executions"],
        params: configNameParamSchema,
        querystring: downloadQuerySchema,
        response: {
          200: { description: "File download", type: "string", format: "binary" },
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.downloadExecutions,
  );
}