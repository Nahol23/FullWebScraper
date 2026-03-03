import { FastifyInstance } from "fastify";
import { ScrapingController } from "../controllers/ScrapingController";

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
    defaultRuntimeParams: {
      type: "object",
      additionalProperties: true,
    },
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

export async function scrapingRoutes(fastify: FastifyInstance) {
  const controller = new ScrapingController();

  // CRUD
  fastify.get("/scraping/configs", {
    schema: {
      summary: "List all scraping configurations",
      tags: ["Scraping"],
      response: {
        200: {
          type: "array",
          items: scrapingConfigBodySchema,
        },
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
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
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
        examples: [
          {
            waitForSelector: ".content",
            maxPages: 3,
            headers: { "User-Agent": "Custom" },
          },
        ],
      },
      response: {
        200: {
          type: "object",
          additionalProperties: true,
        },
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.execute);

  // Analisi generica (con URL e opzioni)
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

  // Analisi basata su configurazione esistente
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
}