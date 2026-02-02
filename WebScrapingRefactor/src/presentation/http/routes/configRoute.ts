
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
// Use Cases Analysis
import { CreateAnalysisUseCase } from "../../../application/usecases/Analysis/CreateAnalysisUseCase";
import { GetAllAnalysesUseCase } from "../../../application/usecases/Analysis/GetAllAnalysisUseCase";
// Use Cases Execution
import { RunExecutionUseCase } from "../../../application/usecases/Execution/RunExecutionUseCase";
import { GetAllExecutionsUseCase } from "../../../application/usecases/Execution/GetAllExecutionsUseCase";

export async function configRoutes(fastify: FastifyInstance) {
  //  REPOSITORY E ADAPTER
  const configRepo = new ConfigRepository();
  const analysisRepo = new AnalysisRepository();
  const executionRepo = new ExecutionRepository();
  const apiAdapter = new ApiAdapter();


  // USE CASES

  
  const analyzeApiUseCase = new AnalyzeApiUseCase(apiAdapter);
  const executeApiUseCase = new ExecuteApiUseCase(configRepo, apiAdapter);

  const getAllConfigsUseCase = new GetAllConfigsUseCase(configRepo);
  const getConfigByIdUseCase = new GetConfigByIdUseCase(configRepo);
  const getConfigByNameUseCase = new GetConfigByNameUseCase(configRepo);
  const getConfigByIdUseCase = new GetConfigByIdUseCase(configRepo);
  const saveConfigUseCase = new SaveConfigUseCase(configRepo);
  const updateConfigUseCase = new UpdateConfigUseCase(configRepo);
  const deleteConfigUseCase = new DeleteConfigUseCase(configRepo);

  // Analysis & Execution con persistenza
  const createAnalysisUseCase = new CreateAnalysisUseCase(
    apiAdapter,
    analysisRepo,
  );
  const getAllAnalysesUseCase = new GetAllAnalysesUseCase(analysisRepo);
  const runExecutionUseCase = new RunExecutionUseCase(
    configRepo,
    apiAdapter,
    executionRepo,
  );
  const getAllExecutionsUseCase = new GetAllExecutionsUseCase(executionRepo);

  const controller = new ConfigController(
    updateConfigUseCase,
    getAllConfigsUseCase,
    getConfigByNameUseCase,
    getConfigByIdUseCase,
    saveConfigUseCase,
    deleteConfigUseCase,
    runExecutionUseCase,
    createAnalysisUseCase,
    getAllAnalysesUseCase,
    getAllExecutionsUseCase,
  );

    analyzeApiUseCase,
    executeApiUseCase,
  );

 


  const errorResponseSchema = {
    type: "object",
    properties: {
      error: { type: "string" },
      message: { type: "string" },
      details: { type: "array", items: { type: "object" } },
      details: {
        type: "array",
        items: { type: "object" },
      },
      stack: { type: "string" },
    },
  };

  const configBodySchema = {
    type: "object",
    required: ["name", "baseUrl", "endpoint", "method"],
    properties: {
      id: { type: "string", readOnly: true },
      name: { type: "string", examples: ["PokeApi"] },
      baseUrl: { type: "string", examples: ["https://pokeapi.co/api/v2"] },
      endpoint: { type: "string", examples: ["/pokemon"] },
      method: { type: "string", enum: ["GET", "POST"], examples: ["GET"] },
      defaultLimit: { type: "number", examples: [20] },
      dataPath: { type: "string", examples: ["results"] },
      headers: {
        type: "object",
        additionalProperties: true,
        description: "Headers fissi (es. API Key)",
        examples: [{ Authorization: "Bearer token_qui" }],
      },
      body: {
        type: "object",
        additionalProperties: true,
        description: "Payload predefinito per POST",
      },
      selectedFields: {
        type: "array",
        items: { type: "string" },
        examples: [["name", "url"]],
      },
    },
  };

  const identifierParamSchema = {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
      name: { type: 'string', examples: ['Nome API'] },
      baseUrl: { type: 'string', examples: ['https://api.esempio.it'] },
      endpoint: { type: 'string', examples: ['/v1/data'] },
      method: { type: 'string', enum: ['GET', 'POST'], examples: ['GET'] },
      queryParams: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key', 'value'],
          properties: {
            key: { type: 'string' },
            value: { type: 'string' }
          }
        },
        examples: [[{ "key": "v", "value": "1" }]]
      },
      headers: {
        type: 'object',
        additionalProperties: { type: 'string' },
        examples: [
          {
            "Authorization": "Bearer token123",
            "Content-Type": "application/json",
            "X-Custom-Header": "value"
          }
        ]
      },
      body: {
        type: 'object',
        additionalProperties: true,
        examples: [
          {
            "param1": "value1",
            "param2": "value2",
            "offset": 20
          }
        ],
      },
      defaultLimit: { type: 'number', examples: [20] },
      dataPath: { type: 'string', examples: ['data.results'] },
      selectedFields: {
        type: 'array',
        items: { type: 'string' },
        examples: [['id', 'name', 'description']]
      }
    }
  };

  const nameParamSchema = {
    type: "object",
    required: ["name"],
    properties: { name: { type: "string" } },
  };

  fastify.get(
    "/configs",
    {
      schema: {
        summary: "Lista configurazioni",
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
    "/configs/:id",
    {
      schema: {
        summary: "Dettaglio configurazione",
        tags: ["Configuration"],
        params: identifierParamSchema,
        response: {
          200: configBodySchema,
          404: errorResponseSchema,
        },
      },
    },
    controller.getById,
  );

  fastify.post(
    "/configs",
    {
      schema: {
        summary: "Salva nuova configurazione",
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
    "/configs/:name",
    {
      schema: {
        summary: "Aggiorna configurazione",
        tags: ["Configuration"],
        params: nameParamSchema,
        body: configBodySchema,
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
    "/configs/:name",
    {
      schema: {
        summary: "Elimina configurazione",
        tags: ["Configuration"],
        params: nameParamSchema,
        response: {
          204: { type: "null" },
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.delete,
  );

  // ANALYSIS
  fastify.post(
    "/executions/analyze",
    {
      schema: {
        summary: "Analizza URL e salva risultato",
        tags: ["Analysis"],
        // 1. Quello che l'utente INVIA
        body: {
          type: "object",
          required: ["url", "method"],
          properties: {
            url: { type: "string" },
            method: { type: "string", enum: ["GET", "POST"] },
            headers: {
              type: "object",
              additionalProperties: true,
              description: "Esempio: { 'Authorization': 'API Key' }",
            },
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
      schema: { summary: "Storico analisi", tags: ["Analysis"] },
    },
    controller.getAllAnalyses,
  );

  // EXECUTION
  fastify.post(
    "/executions/:name/execute",
    {
      schema: {
        summary: "Esegue API e salva log",
        tags: ["Execution"],
        params: nameParamSchema,
        body: {
          type: "object",
          additionalProperties: true,
          description: "Parametri runtime/body",
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
    },
    controller.execute,
  );

  fastify.get(
    "/executions",
    {
      schema: { summary: "Storico esecuzioni", tags: ["Execution"] },
    },
    controller.getAllExecutions,
  );
}
    properties: {
      name: { type: "string" },
    },
    required: ["name"],
  };

  
  fastify.get('/configs', {
    schema: {
      summary: 'Lista tutte le configurazioni',
      tags: ['Configuration'],
      response: {
        200: {
          type: 'array',
          items: configBodySchema
        },
      },
    },
  }, controller.getAll);

  
  fastify.post("/configs", {
    schema: {
      summary: "Crea una nuova configurazione",
      description: 'Modello di default da editare in base a chiamata http.',
      tags: ["Configuration"],
      body: configBodySchema,
      response: {
        201: configBodySchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.create);

 
  fastify.get("/configs/:name", {
    schema: {
      summary: "Recupera una configurazione specifica per nome",
      tags: ["Configuration"],
      params: nameParamSchema,
      response: {
        200: configBodySchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.getOne),

  
  fastify.get("/configs/id/:id", {
    schema: {
      summary: "Recupera una configurazione tramite ID",
      tags: ["Configuration"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } }
      },
      response: {
        200: configBodySchema,
        404: errorResponseSchema
      }
    }
  }, controller.getById),

  fastify.delete("/configs/:name", {
    schema: {
      summary: "Elimina una configurazione",
      tags: ["Configuration"],
      params: nameParamSchema,
      response: {
        204: { type: "null" },
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.delete),

  
  fastify.put("/configs/:name", {
    schema: {
      summary: "Aggiorna una configurazione esistente",
      tags: ["Configuration"],
      params: nameParamSchema,
      body: {
        ...configBodySchema,
        required: [], // Partial update logic handled by controller/schema if needed
      },
      response: {
        200: { type: "object", properties: { message: { type: "string" } } },
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.update),

  
  fastify.patch("/configs/:name/fields", {
    schema: {
      summary: "Aggiorna solo i campi selezionati",
      tags: ["Configuration"],
      params: nameParamSchema,
      body: {
        type: "object",
        required: ["selectedFields"],
        properties: {
          selectedFields: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      response: {
        200: { type: "object", properties: { message: { type: "string" } } },
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.patchSelectedFields),

  
  fastify.patch("/configs/:name/pagination", {
    schema: {
      summary: "Aggiorna solo le impostazioni di paginazione",
      tags: ["Configuration"],
      params: nameParamSchema,
      body: {
        type: "object",
        properties: {
          supportsPagination: { type: "boolean" },
          paginationField: { type: "string" },
        },
        additionalProperties: false,
      },
      response: {
        200: { type: "object", properties: { message: { type: "string" } } },
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
  }, controller.patchPagination),

  
  fastify.post("/configs/analyze", {
    schema: {
      summary: "Analizza un URL API per suggerire campi",
      tags: ["Execution"],
      body: {
        type: "object",
        required: ["url", "method"],
        properties: {
          url: { type: "string", examples: ["https://api.example.com/data"] },
          method: {
            type: "string",
            enum: ["GET", "POST"],
            examples: ["GET"],
          },
          body: { type: "object" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            sampleData: { type: "object" },
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
  }, controller.analyze),

  
  fastify.post('/configs/:name/execute', {
    schema: {
      summary: 'Esegue una configurazione API',
      description: 'Esegue la chiamata API configurata iniettando i parametri dinamici.',
      tags: ['Execution'],
      params: nameParamSchema,
      body: {
        type: 'object',
        description: `
        **Parametri Dinamici**:
        I campi inseriti qui verranno usati per sostituire i placeholder o aggiunti come query params.
        Usa la chiave speciale 'headers' per sovrascrivere gli header HTTP.
        `,
        properties: {
          headers: {
            type: 'object',
            description: 'Headers HTTP opzionali da aggiungere/sovrascrivere',
            additionalProperties: { type: 'string' },
            examples: [{ "Authorization": "Bearer <token>" }]
          }
        },
        
        additionalProperties: true,
        examples: [
          {
            "_name": "Simple Query",
            "city": "Milano",
            "days": 3
          },
          {
            "_name": "With Auth Header",
            "headers": { "Authorization": "Bearer 123" },
            "productId": 99
          }
        ]
      },
      response: {
        200: { 
          type: 'object',
          additionalProperties: true 
        },
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  }, controller.execute)
}
