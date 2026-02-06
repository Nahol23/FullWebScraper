import { FastifyInstance } from "fastify";
import { ConfigController } from "../controllers/ConfigController";

// Repositories & Adapters
import { ConfigRepository } from "../../../infrastructure/repositories/ConfigRepository";
import { AnalysisRepository } from "../../../infrastructure/repositories/AnalysisRepository";
import { ExecutionRepository } from "../../../infrastructure/repositories/ExecutionRepository";
import { ApiAdapter } from "../../../infrastructure/adapters/Api/ApiAdapter";

// Services
import { FormatDataService } from "../../../application/services/FormatDataService";

// Use Cases Configs
import { UpdateConfigUseCase } from "../../../application/usecases/Configs/UpdateConfigUseCase";
import { GetAllConfigsUseCase } from "../../../application/usecases/Configs/GetAllConfigsUseCase";
import { GetConfigByNameUseCase } from "../../../application/usecases/Configs/GetConfigByNameUseCase";
import { SaveConfigUseCase } from "../../../application/usecases/Configs/SaveConfigUseCase";
import { DeleteConfigUseCase } from "../../../application/usecases/Configs/DeleteConfigUseCase";
import { GetConfigByIdUseCase } from "../../../application/usecases/Configs/GetConfigByIdUseCase";

// Use Cases Analysis & Execution & Download
import { CreateAnalysisUseCase } from "../../../application/usecases/Analysis/CreateAnalysisUseCase";
import { ExecuteApiUseCase } from "../../../application/usecases/Api/ExecuteApiUseCase";
import { GetAllAnalysesUseCase } from "../../../application/usecases/Analysis/GetAllAnalysisUseCase";
import { GetAllExecutionsUseCase } from "../../../application/usecases/Execution/GetAllExecutionsUseCase";
import { DownloadAllUseCase } from "../../../application/usecases/Api/DownloadAllUseCase";
import { GetAllExecutionsByConfigUseCase } from "../../../application/usecases/Execution/GetAllExecutionByConfigUseCase";
import { DeleteExecutionUseCase } from "../../../application/usecases/Execution/DeleteExecutionUsecase";

export async function configRoutes(fastify: FastifyInstance) {
  // 1. REPOSITORIES AND ADAPTERS
  const configRepo = new ConfigRepository();
  const analysisRepo = new AnalysisRepository();
  const executionRepo = new ExecutionRepository();
  const apiAdapter = new ApiAdapter();
  const formatService = new FormatDataService(); // Istanziamo qui il servizio

  // 2. USE CASES (Logic strictly preserved as requested)
  const createAnalysisUseCase = new CreateAnalysisUseCase(
    apiAdapter,
    analysisRepo,
  );
  const executeApiUseCase = new ExecuteApiUseCase(
    configRepo,
    executionRepo,
    apiAdapter,
  );

  const getAllConfigsUseCase = new GetAllConfigsUseCase(configRepo);
  const getConfigByIdUseCase = new GetConfigByIdUseCase(configRepo);
  const getConfigByNameUseCase = new GetConfigByNameUseCase(configRepo);
  const saveConfigUseCase = new SaveConfigUseCase(configRepo);
  const updateConfigUseCase = new UpdateConfigUseCase(configRepo);
  const deleteConfigUseCase = new DeleteConfigUseCase(configRepo);
  const getAllAnalysesUseCase = new GetAllAnalysesUseCase(analysisRepo);
  const getAllExecutionsUseCase = new GetAllExecutionsUseCase(executionRepo);
  const getAllExecutionByConfigUseCase = new GetAllExecutionsByConfigUseCase(
    executionRepo,
  );
  const deleteExecutionUsecase = new DeleteExecutionUseCase(executionRepo);

  const downloadAllUseCase = new DownloadAllUseCase(
    configRepo,
    executeApiUseCase,
    formatService,
  );

  const controller = new ConfigController(
    updateConfigUseCase,
    getAllConfigsUseCase,
    getConfigByNameUseCase,
    getConfigByIdUseCase,
    saveConfigUseCase,
    deleteConfigUseCase,
    executeApiUseCase,
    createAnalysisUseCase,
    getAllAnalysesUseCase,
    getAllExecutionsUseCase,
    getAllExecutionByConfigUseCase,
    deleteExecutionUsecase,
    downloadAllUseCase,
  );

  const errorResponseSchema = {
    type: "object",
    properties: {
      error: { type: "string" },
      message: { type: "string" },
      details: { type: "array", items: { type: "object" } },
      stack: { type: "string" },
    },
  };

  const idParamSchema = {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  };

  const configBodySchema = {
    type: "object",
    required: ["name", "baseUrl", "endpoint", "method"],
    properties: {
      // TODO: Decidere se includere 'id' in base alla response effettiva
      id: { type: "string", readOnly: true },

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
          },
        ],
      },

      pagination: {
        type: "object",
        nullable: true,
        properties: {
          type: { type: "string", enum: ["offset", "page"] },
          paramName: { type: "string" },
          limitParam: { type: "string" },
          defaultLimit: { type: "number" },
        },
        examples: [
          {
            type: "page",
            paramName: "page",
            limitParam: "limit",
            defaultLimit: 50,
          },
        ],
      },

      dataPath: { type: "string", examples: ["data.results"] },

      filter: {
        type: "object",
        nullable: true,
        properties: {
          field: { type: "string" },
          value: { type: ["string", "number", "boolean"] },
        },
        examples: [{ field: "status", value: "active" }],
      },

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

      pagination: {
        type: "object",
        nullable: true,
        properties: {
          type: { type: "string", enum: ["offset", "page"] },
          paramName: { type: "string" },
          limitParam: { type: "string" },
          defaultLimit: { type: "number" },
        },
      },

      dataPath: { type: "string" },

      filter: {
        type: "object",
        nullable: true,
        properties: {
          field: { type: "string" },
          value: { type: ["string", "number", "boolean"] },
        },
      },

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

  const configNameParamSchema = {
    type: "object",
    required: ["configName"],
    properties: { configName: { type: "string" } },
  };

  const downloadQuerySchema = {
    type: "object",
    properties: {
      format: { type: "string", enum: ["json", "markdown"] },
    },
  };

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
        summary: "Get config by name",
        tags: ["Configuration"],
        params: nameParamSchema,
        response: {
          200: configBodySchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.getOne,
  );

  fastify.get(
    "/configs/id/:id",
    {
      schema: {
        summary: "Get config by ID",
        tags: ["Configuration"],
        params: idParamSchema,
        response: {
          200: configBodySchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.getById,
  );

  fastify.post(
    "/configs",
    {
      schema: {
        summary: "Create new config",
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
        summary: "Update existing config",
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

  fastify.post(
    "/executions/analyze",
    {
      schema: {
        summary: "Analyze API URL and suggest config",
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
        summary: "Get analysis history",
        tags: ["Analysis"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true,
            },
          },
          500: errorResponseSchema,
        },
      },
    },
    controller.getAllAnalyses,
  );

  fastify.post(
    "/executions/:name/execute",
    {
      schema: {
        summary: "Execute API config with optional runtime params",
        tags: ["Execution"],
        params: nameParamSchema,
        body: {
          type: "object",
          additionalProperties: true,
          examples: [
            {
              limit: 10,
              page: 1,
              headers: { "X-Custom": "value" },
            },
          ],
        },
        response: {
          200: {
            type: "object",
            properties: {
              data: { type: "array" },
              filteredBy: { type: "object" },
              meta: {
                type: "object",
                properties: {
                  paths: { type: "array", items: { type: "string" } },
                  total: { type: "number" },
                  limit: { type: "number" },
                  validObjectsCount: { type: "number" },
                },
              },
            },
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
        summary: "Get execution history",
        tags: ["Execution"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true,
            },
          },
          500: errorResponseSchema,
        },
      },
    },
    controller.getAllExecutions,
  );
  fastify.get(
    "/executions/:configId",
    {
      schema: {
        summary: "Get executions config history",
        tags: ["Execution"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true,
            },
          },
          500: errorResponseSchema,
        },
      },
    },
    controller.getExecutionsByConfig,
  );

  fastify.delete(
    "/executions/:configId/:executionId",
    {
      schema: {
        summary: "Delete execution history entry",
        tags: ["Execution"],
        params: {
          type: "object",
          properties: {
            configId: { type: "string" },
            executionId: { type: "string" },
          },
          required: ["configId", "executionId"],
        },
        response: {
          204: {
            type: "null",
            description: "Execution deleted successfully",
          },
          500: errorResponseSchema,
        },
      },
    },
    controller.deleteExecution,
  );

  fastify.get(
    "/configs/:configName/download",
    {
      schema: {
        summary: "Download all paginated data",
        tags: ["Execution"],
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
    },
    controller.download,
  );
}
