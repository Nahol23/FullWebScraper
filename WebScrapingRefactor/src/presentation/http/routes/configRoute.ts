import { FastifyInstance } from "fastify";
import { ConfigController } from "../controllers/ConfigController";
import { ConfigRepository } from "../../../infrastructure/repositories/ConfigRepository";
import { AnalysisRepository } from "../../../infrastructure/repositories/AnalysisRepository";
import { ExecutionRepository } from "../../../infrastructure/repositories/ExecutionRepository";
import { ApiAdapter } from "../../../infrastructure/adapters/Api/ApiAdapter";

// Use Cases Configs
import { UpdateConfigUseCase } from "../../../application/usecases/Configs/UpdateConfigUseCase";
import { GetAllConfigsUseCase } from "../../../application/usecases/Configs/GetAllConfigsUseCase";
import { GetConfigByNameUseCase } from "../../../application/usecases/Configs/GetConfigByNameUseCase";
import { SaveConfigUseCase } from "../../../application/usecases/Configs/SaveConfigUseCase";
import { DeleteConfigUseCase } from "../../../application/usecases/Configs/DeleteConfigUseCase";
import { GetConfigByIdUseCase } from "../../../application/usecases/Configs/GetConfigByIdUseCase";

// Use Cases Analysis & Execution
import { CreateAnalysisUseCase } from "../../../application/usecases/Analysis/CreateAnalysisUseCase";
import { ExecuteApiUseCase } from "../../../application/usecases/Api/ExecuteApiUseCase";
import { GetAllAnalysesUseCase } from "../../../application/usecases/Analysis/GetAllAnalysisUseCase";
import { GetAllExecutionsUseCase } from "../../../application/usecases/Execution/GetAllExecutionsUseCase";

export async function configRoutes(fastify: FastifyInstance) {
  // 1. REPOSITORIES AND ADAPTERS
  const configRepo = new ConfigRepository();
  const analysisRepo = new AnalysisRepository();
  const executionRepo = new ExecutionRepository();
  const apiAdapter = new ApiAdapter();

  // 2. USE CASES (Logic strictly preserved as requested)
  const createAnalysisUseCase = new CreateAnalysisUseCase(
    apiAdapter,
    analysisRepo,
  );
  const executeApiUseCase = new ExecuteApiUseCase(configRepo, executionRepo, apiAdapter);

  const getAllConfigsUseCase = new GetAllConfigsUseCase(configRepo);
  const getConfigByIdUseCase = new GetConfigByIdUseCase(configRepo);
  const getConfigByNameUseCase = new GetConfigByNameUseCase(configRepo);
  const saveConfigUseCase = new SaveConfigUseCase(configRepo);
  const updateConfigUseCase = new UpdateConfigUseCase(configRepo);
  const deleteConfigUseCase = new DeleteConfigUseCase(configRepo);
  const getAllAnalysesUseCase = new GetAllAnalysesUseCase(analysisRepo);
  const getAllExecutionsUseCase = new GetAllExecutionsUseCase(executionRepo);

  // 3. CONTROLLER INITIALIZATION
  const controller = new ConfigController(
    updateConfigUseCase,
    getAllConfigsUseCase,
    getConfigByNameUseCase,
    getConfigByIdUseCase,
    saveConfigUseCase,
    deleteConfigUseCase,
    executeApiUseCase as any,
    createAnalysisUseCase,
    getAllAnalysesUseCase,
    getAllExecutionsUseCase,
  );

  // 4. SCHEMAS
  const errorResponseSchema = {
    type: "object",
    properties: {
      error: { type: "string" },
      message: { type: "string" },
      details: { type: "array", items: { type: "object" } },
      stack: { type: "string" },
    },
  };

  const configBodySchema = {
    type: "object",
    required: ["name", "baseUrl", "endpoint", "method"],
    properties: {
      name: { type: "string", examples: ["Nome API"] },
      baseUrl: { type: "string", examples: ["https://api.esempio.it"] },
      endpoint: { type: "string", examples: ["/v1/data"] },
      method: { type: "string", enum: ["GET", "POST"], examples: ["GET"] },
      queryParams: {
        type: "array",
        items: {
          type: "object",
          required: ["key", "value"],
          properties: {
            key: { type: "string" },
            value: { type: "string" },
          },
        },
        examples: [[{ key: "v", value: "1" }]],
      },
      headers: {
        type: "object",
        additionalProperties: { type: "string" },
        examples: [
          {
            Authorization: "Bearer token123",
            "Content-Type": "application/json",
            "X-Custom-Header": "value",
          },
        ],
      },
      body: {
        type: "object",
        additionalProperties: true,
        examples: [
          {
            param1: "value1",
            param2: "value2",
            offset: 20,
          },
        ],
      },
      defaultLimit: { type: "number", examples: [20] },
      dataPath: { type: "string", examples: ["data.results"] },
      selectedFields: {
        type: "array",
        items: { type: "string" },
        examples: [["id", "name", "description"]],
      },
    },
  };
  const updateBodySchema = {
    type: "object",
    properties: {
      name: { type: "string", examples: ["Nome API"] },
      baseUrl: { type: "string", examples: ["https://api.esempio.it"] },
      endpoint: { type: "string", examples: ["/v1/data"] },
      method: { type: "string", enum: ["GET", "POST"], examples: ["GET"] },
      queryParams: {
        type: "array",
        items: {
          type: "object",
          required: ["key", "value"],
          properties: {
            key: { type: "string" },
            value: { type: "string" },
          },
        },
      },
      headers: {
        type: "object",
        additionalProperties: { type: "string" },
      },
      body: {
        type: "object",
        additionalProperties: true,
      },
      defaultLimit: { type: "number" },
      dataPath: { type: "string" },
      selectedFields: {
        type: "array",
        items: { type: "string" },
      },
    },
  };

  const nameParamSchema = {
    type: "object",
    required: ["name"],
    properties: { name: { type: "string" } },
  };

  const idParamSchema = {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  };

  // 5. ROUTES

  // CONFIGURATION ROUTES
  fastify.get(
    "/configs",
    {
      schema: {
        summary: "List all configs",
        tags: ["Configuration"],
        response: {
          200: {
            type: "array",
            items: configBodySchema,
          },
          500: errorResponseSchema,
        },
      },
    },
    controller.getAll,
  );

  fastify.get(
    "/configs/:name",
    {
      schema: {
        summary: "Get by name",
        tags: ["Configuration"],
        params: nameParamSchema,
        response: {
          200: configBodySchema,
          400: errorResponseSchema,
        },
      },
    },
    controller.getOne,
  );

  fastify.get(
    "/configs/id/:id",
    {
      schema: {
        summary: "Get by ID",
        tags: ["Configuration"],
        params: idParamSchema,
        response: {
          200: configBodySchema,
          400: errorResponseSchema,
        },
      },
    },
    controller.getById,
  );

  fastify.post(
    "/configs",
    {
      schema: {
        summary: "Create config",
        tags: ["Configuration"],
        body: configBodySchema,
        response: {
          201: configBodySchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.create,
  );

  fastify.put(
    "/configs/:id",
    {
      schema: {
        summary: "Update config",
        tags: ["Configuration"],
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
    },
    controller.update,
  );

  fastify.delete(
    "/configs/:id",
    {
      schema: {
        summary: "Delete config",
        tags: ["Configuration"],
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

  // ANALYSIS ROUTES
  fastify.post(
    "/executions/analyze",
    {
      schema: {
        summary: "Analyze API URL",
        tags: ["Analysis"],
        body: {
          type: "object",
          required: ["url", "method"],
          properties: {
            url: { type: "string" },
            method: { type: "string", enum: ["GET", "POST"] },
            headers: { type: "object", additionalProperties: true },
            body: { type: "object", additionalProperties: true },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              sampleData: { type: "object", additionalProperties: true },
              suggestedFields: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.analyze,
  );

  fastify.get(
    "/analyses",
    {
      schema: {
        summary: "Analysis history",
        tags: ["Analysis"],
        response: {
          200: {
            type: "array",
            items: configBodySchema,
          },
          500: errorResponseSchema,
        },
      },
    },
    controller.getAllAnalyses,
  );

  // EXECUTION ROUTES
  fastify.post(
    "/executions/:name/execute",
    {
      schema: {
        summary: "Execute specific config",
        tags: ["Execution"],
        params: nameParamSchema,
        body: { type: "object", additionalProperties: true },
        response: {
          200: {
            type: "object",
            additionalProperties: true,
          },
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.execute,
  );

  fastify.get(
    "/executions",
    {
      schema: {
        summary: "Execution history",
        tags: ["Execution"],
        response: {
          200: {
            type: "array",
            items: configBodySchema,
          },
          500: errorResponseSchema,
        },
      },
    },
    controller.getAllExecutions,
  );
}
