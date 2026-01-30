import { AnalyzeApiUseCase } from "./../../../application/usecases/Api/AnalyzeApiUseCase";
import { FastifyInstance } from "fastify";
import { ConfigController } from "../controllers/ConfigController";
import { ManageConfigUseCase } from "../../../application/usecases/Configs/ManageConfigUseCase";
import { ConfigRepository } from "../../../infrastructure/repositories/ConfigRepository";
import { ApiAdapter } from "../../../infrastructure/adapters/Api/ApiAdapter";
import { ExecuteApiUseCase } from "../../../application/usecases/Api/ExecuteApiUseCase";
import { UpdateConfigUseCase } from "../../../application/usecases/Configs/UpdateConfigUseCase";
import { GetAllConfigsUseCase } from "../../../application/usecases/Configs/GetAllConfigsUseCase";
import { GetConfigByNameUseCase } from "../../../application/usecases/Configs/GetConfigByNameUseCase";
import { SaveConfigUseCase } from "../../../application/usecases/Configs/SaveConfigUseCase";
import { DeleteConfigUseCase } from "../../../application/usecases/Configs/DeleteConfigUseCase";
import { GetConfigByIdUseCase } from "../../../application/usecases/Configs/GetConfigByIdUseCase";

export async function configRoutes(fastify: FastifyInstance) {
  const configRepo = new ConfigRepository();
  const apiAdapter = new ApiAdapter();
  const manageConfigUseCase = new ManageConfigUseCase(configRepo);
  const analyzeApiUseCase = new AnalyzeApiUseCase(apiAdapter);
  const executeApiUseCase = new ExecuteApiUseCase(configRepo, apiAdapter);
  const getAllConfigsUseCase = new GetAllConfigsUseCase(configRepo);
  const getConfigByNameUseCase = new GetConfigByNameUseCase(configRepo);
  const getConfigByIdUseCase = new GetConfigByIdUseCase (configRepo);
  const saveConfigUseCase = new SaveConfigUseCase(configRepo);
  const deleteConfigUseCase = new DeleteConfigUseCase(configRepo);
  const updateConfigUseCase = new UpdateConfigUseCase(configRepo);

  const controller = new ConfigController(
    updateConfigUseCase,
    getAllConfigsUseCase,
    getConfigByNameUseCase,
    getConfigByIdUseCase,
    saveConfigUseCase,
    deleteConfigUseCase,
    analyzeApiUseCase,
    executeApiUseCase,
  );

  const errorResponseSchema = {
    type: "object",
    properties: {
      error: { type: "string" },
      message: { type: "string" },
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
      name: { type: "string", examples: ["PokeApi"] },
      baseUrl: { type: "string", examples: ["https://pokeapi.co/api/v2"] },
      endpoint: { type: "string", examples: ["/pokemon"] },
      method: { type: "string", enum: ["GET", "POST"], examples: ["GET"] },
      defaultLimit: { type: "number", examples: [20] },
      dataPath: { type: "string", examples: ["results"] },
      selectedFields: {
        type: "array",
        items: { type: "string" },
        examples: [["name", "url"]],
      },
    },
  };

  const nameParamSchema = {
    type: "object",
    properties: {
      name: { type: "string" },
    },
    required: ["name"],
  };

  fastify.get(
    "/configs",
    {
      schema: {
        summary: "Lista tutte le configurazioni",
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
        summary: "Recupera una configurazione specifica",
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
}, controller.getById);

  fastify.post(
    "/configs",
    {
      schema: {
        summary: "Crea  una nuova  configurazione",
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

  fastify.delete(
    "/configs/:name",
    {
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
    },
    controller.delete,
  );

  fastify.put(
    "/configs/:name",
    {
      schema: {
        summary: "Aggiorna una configurazione esistente",
        tags: ["Configuration"],
        params: nameParamSchema,
        body: {
          ...configBodySchema,
          required: [],
        },
        response: {
          200: { type: "object", properties: { message: { type: "string" } } },
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.update,
  );
  fastify.patch(
    "/configs/:name/fields",
    {
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
    },
    controller.patchSelectedFields,
  );

  fastify.patch(
    "/configs/:name/pagination",
    {
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
    },
    controller.patchPagination,
  );

  fastify.post(
    "/configs/analyze",
    {
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
    },
    controller.analyze,
  );

  fastify.post(
    "/configs/:name/execute",
    {
      schema: {
        summary: "Esegue una configurazione API",
        tags: ["Execution"],
        params: nameParamSchema,

        //  AGGIUNGI QUESTO BLOCCO BODY
        body: {
          type: "object",
          description: "Parametri dinamici da passare alla configurazione",
          // 'additionalProperties: true' è FONDAMENTALE qui perché i parametri cambiano sempre
          additionalProperties: true,
          // Puoi rimettere 'example' solo se hai applicato il fix su AJV nel main.ts
          example: {
            userId: 12345,
            status: "active",
          },
        },
        // FINE BLOCCO BODY

        response: {
          // ... la tua risposta esistente
          200: {
            /* ... */
          },
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.execute,
  );
}
