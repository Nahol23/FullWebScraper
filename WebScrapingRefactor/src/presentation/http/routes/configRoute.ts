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

export async function configRoutes(fastify: FastifyInstance) {
  // 1. REPOSITORIES AND ADAPTERS
  const configRepo = new ConfigRepository();
  const analysisRepo = new AnalysisRepository();
  const executionRepo = new ExecutionRepository();
  const apiAdapter = new ApiAdapter();
  const formatService = new FormatDataService(); // Istanziamo qui il servizio

  // 2. USE CASES
  const createAnalysisUseCase = new CreateAnalysisUseCase(apiAdapter, analysisRepo);
  const executeApiUseCase = new ExecuteApiUseCase(configRepo, apiAdapter);

  const getAllConfigsUseCase = new GetAllConfigsUseCase(configRepo);
  const getConfigByIdUseCase = new GetConfigByIdUseCase(configRepo);
  const getConfigByNameUseCase = new GetConfigByNameUseCase(configRepo);
  const saveConfigUseCase = new SaveConfigUseCase(configRepo);
  const updateConfigUseCase = new UpdateConfigUseCase(configRepo);
  const deleteConfigUseCase = new DeleteConfigUseCase(configRepo);
  const getAllAnalysesUseCase = new GetAllAnalysesUseCase(analysisRepo);
  const getAllExecutionsUseCase = new GetAllExecutionsUseCase(executionRepo);
  
  // ✅ Istanziamo il DownloadUseCase correttamente
  const downloadAllUseCase = new DownloadAllUseCase(
    configRepo,
    executeApiUseCase,
    formatService
  );

  // 3. CONTROLLER INITIALIZATION
  const controller = new ConfigController(
    updateConfigUseCase,
    getAllConfigsUseCase,
    getConfigByNameUseCase,
    getConfigByIdUseCase,
    saveConfigUseCase,
    deleteConfigUseCase,
    executeApiUseCase, // Rimosso "as any" se i tipi sono allineati
    createAnalysisUseCase,
    getAllAnalysesUseCase,
    getAllExecutionsUseCase,
    downloadAllUseCase
  );

  // 4. SCHEMAS
  // ✅ Aggiornato schema per supportare la PAGINAZIONE
  const configBodySchema = {
    type: "object",
    required: ["name", "baseUrl", "endpoint", "method"],
    properties: {
      id: { type: "string", readOnly: true },
      name: { type: "string" },
      baseUrl: { type: "string" },
      endpoint: { type: "string" },
      method: { type: "string", enum: ["GET", "POST"] },
      
      // Nuova struttura paginazione
      pagination: {
        type: "object",
        nullable: true,
        properties: {
            type: { type: "string", enum: ["offset", "page"] },
            paramName: { type: "string" },
            limitParam: { type: "string" },
            defaultLimit: { type: "number" }
        }
      },
      
      dataPath: { type: "string" },
      headers: { type: "object", additionalProperties: true },
      body: { type: "object", additionalProperties: true },
      selectedFields: { type: "array", items: { type: "string" } },
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
        format: { type: "string", enum: ["json", "markdown"] }
    }
  };

 

  
  fastify.get("/configs", {
    schema: { summary: "List all configs", tags: ["Configuration"] }
  }, controller.getAll);

  fastify.get("/configs/:name", {
    schema: { summary: "Get by name", tags: ["Configuration"], params: nameParamSchema }
  }, controller.getOne);

  fastify.get("/configs/id/:id", {
    schema: { summary: "Get by ID", tags: ["Configuration"] }
  }, controller.getById);

  fastify.post("/configs", {
    schema: { summary: "Create config", tags: ["Configuration"], body: configBodySchema }
  }, controller.create);

  fastify.put("/configs/:name", {
    schema: { summary: "Update config", tags: ["Configuration"], params: nameParamSchema, body: configBodySchema }
  }, controller.update);

  fastify.delete("/configs/:name", {
    schema: { summary: "Delete config", tags: ["Configuration"], params: nameParamSchema }
  }, controller.delete);

  
  fastify.post("/executions/analyze", {
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
        }
      }
    }
  }, controller.analyze);

  fastify.get("/analyses", {
    schema: { summary: "Analysis history", tags: ["Analysis"] }
  }, controller.getAllAnalyses);

  
  
  fastify.post("/executions/:name/execute", {
    schema: {
      summary: "Execute specific config (Preview)",
      tags: ["Execution"],
      params: nameParamSchema,
      body: { type: "object", additionalProperties: true }
    }
  }, controller.executePreview); 

  fastify.get("/executions", {
    schema: { summary: "Execution history", tags: ["Execution"] }
  }, controller.getAllExecutions);

  
  fastify.get("/configs/:configName/download", {
    schema: { 
        summary: "Download all data", 
        tags: ["Execution"],
        params: configNameParamSchema,
        querystring: downloadQuerySchema
    }
  }, controller.download);
}